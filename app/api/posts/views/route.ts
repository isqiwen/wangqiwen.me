import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/app/get-posts";
import {
  consumeRateLimitToken,
  getRequestClientIp,
} from "@/utils/server/rate-limit";
import { readViews } from "@/utils/server/views";
import { isPostSlug } from "@/utils/shared/post-fields";

export const dynamic = "force-dynamic";
const MAX_IDS = 100;
const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/posts/views?ids=a,b -> { a: 12, b: 3 }
//
// Only published posts are answered. An empty object means the counts are
// unavailable, which the list renders as blanks.
export async function GET(req: NextRequest) {
  const rateLimit = consumeRateLimitToken(
    `views:list:${getRequestClientIp(req)}`,
    { limit: 120, windowMs: 60 * 1000 }
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
      }
    );
  }

  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({}, { headers: NO_STORE });
  }
  if (idsParam.length > 8192) {
    return NextResponse.json(
      { error: "ids query is too long" },
      { status: 414, headers: NO_STORE }
    );
  }

  const ids = Array.from(
    new Set(
      idsParam
        .split(",")
        .map(id => id.trim())
        .filter(isPostSlug)
    )
  );
  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `at most ${MAX_IDS} ids are allowed` },
      { status: 400, headers: NO_STORE }
    );
  }

  const publishedIds = new Set((await getPosts()).map(post => post.id));
  const views = await readViews(ids.filter(id => publishedIds.has(id)));

  return NextResponse.json(views ?? {}, { headers: NO_STORE });
}
