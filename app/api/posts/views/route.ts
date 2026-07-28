import { NextRequest, NextResponse } from "next/server";
import redis from "@/app/redis";
import { getManifest } from "@/app/get-posts";
import { logger } from "@/utils/logger";
import {
  consumeRateLimitToken,
  getRequestClientIp,
} from "@/utils/server/rate-limit";

export const dynamic = "force-dynamic";
const MAX_IDS = 100;
const POST_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const rateLimit = consumeRateLimitToken(
    `views:list:${getRequestClientIp(req)}`,
    { limit: 120, windowMs: 60 * 1000 },
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many view-count requests." },
      {
        status: 429,
        headers: {
          ...NO_STORE,
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({}, { headers: NO_STORE });
  }
  if (idsParam.length > 8192) {
    return NextResponse.json(
      { error: "ids query is too long" },
      { status: 414, headers: NO_STORE },
    );
  }

  const ids = Array.from(
    new Set(
      idsParam
        .split(",")
        .map(id => id.trim())
        .filter(id => id.length <= 100 && POST_ID_PATTERN.test(id)),
    ),
  );

  if (ids.length === 0) {
    return NextResponse.json({}, { headers: NO_STORE });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `at most ${MAX_IDS} ids are allowed` },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const manifest = await getManifest();
    const publishedIds = new Set(
      (manifest?.posts ?? [])
        .filter(
          post =>
            !post.draft &&
            !post.archived &&
            (post.status ?? "published") === "published",
        )
        .map(post => post.id),
    );
    const allowedIds = ids.filter(id => publishedIds.has(id));
    const values = allowedIds.length
      ? (await redis.hmget("views", ...allowedIds)) ?? {}
      : {};
    const views = Object.fromEntries(
      allowedIds.map(id => [id, Number(values[id] ?? 0)]),
    );
    return NextResponse.json(views, { headers: NO_STORE });
  } catch (error) {
    logger.warn("Failed to load views", error);
    return NextResponse.json({}, { status: 200, headers: NO_STORE });
  }
}
