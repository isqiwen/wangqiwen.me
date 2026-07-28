import redis from "@/app/redis";
import { getPostById } from "@/app/get-posts";
import commaNumber from "comma-number";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";
import { canPreviewDrafts } from "@/utils/server/editor-auth";
import {
  consumeRateLimitToken,
  getRequestClientIp,
} from "@/utils/server/rate-limit";

const POST_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? null;

  if (id === null || id.length > 100 || !POST_ID_PATTERN.test(id)) {
    return NextResponse.json(
      {
        error: {
          message: 'Missing or invalid "id" query',
          code: "INVALID_ID",
        },
      },
      { status: 400, headers: NO_STORE },
    );
  }

  const shouldIncrement = url.searchParams.get("incr") != null;
  const clientIp = getRequestClientIp(req);
  const readRateLimit = consumeRateLimitToken(`view:read:${clientIp}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!readRateLimit.allowed) {
    return NextResponse.json(
      { error: { message: "Too many view requests.", code: "RATE_LIMITED" } },
      {
        status: 429,
        headers: {
          ...NO_STORE,
          "Retry-After": String(readRateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const post = await getPostById(id, {
    includeDrafts: await canPreviewDrafts(),
    includeViews: false,
  });

  if (post == null) {
    return NextResponse.json(
      {
        error: {
          message: "Unknown post",
          code: "UNKNOWN_POST",
        },
      },
      { status: 400, headers: NO_STORE },
    );
  }

  if (shouldIncrement) {
    const incrementRateLimit = consumeRateLimitToken(
      `view:increment:${clientIp}:${id}`,
      { limit: 1, windowMs: 30 * 60 * 1000 },
    );
    const views = incrementRateLimit.allowed
      ? await incrementViews(id)
      : await readViews(id);
    return NextResponse.json({
      ...post,
      views,
      viewsFormatted: commaNumber(views),
    }, { headers: NO_STORE });
  } else {
    const views = await readViews(id);
    return NextResponse.json({
      ...post,
      views,
      viewsFormatted: commaNumber(views),
    }, { headers: NO_STORE });
  }
}

async function readViews(id: string): Promise<number> {
  try {
    const value = await redis.hget("views", id);
    return Number(value ?? 0);
  } catch (error) {
    logger.warn("Failed to read views from Redis, defaulting to 0.", error);
    return 0;
  }
}

async function incrementViews(id: string): Promise<number> {
  try {
    return Number(await redis.hincrby("views", id, 1));
  } catch (error) {
    logger.warn("Failed to increment views in Redis.", error);
    return 0;
  }
}
