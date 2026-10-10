import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPostById } from "@/app/get-posts";
import { canPreviewDrafts } from "@/utils/server/local-editor";
import {
  consumeRateLimitToken,
  getRequestClientIp,
} from "@/utils/server/rate-limit";
import { incrementViews, readViews } from "@/utils/server/views";
import { isPostSlug } from "@/utils/shared/post-fields";

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/view?id=slug        -> { id, views }
// GET /api/view?id=slug&incr=1 -> records one visit, then the same answer
//
// `views` is null when the count is unavailable; the page then omits it.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id === null || !isPostSlug(id)) {
    return errorResponse('Missing or invalid "id" query', "INVALID_ID", 400);
  }

  const clientIp = getRequestClientIp(req);
  const readRateLimit = consumeRateLimitToken(`view:read:${clientIp}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!readRateLimit.allowed) {
    return errorResponse("Too many view requests.", "RATE_LIMITED", 429, {
      "Retry-After": String(readRateLimit.retryAfterSeconds),
    });
  }

  const post = await getPostById(id, { includeDrafts: canPreviewDrafts() });
  if (post == null) {
    return errorResponse("Unknown post", "UNKNOWN_POST", 400);
  }

  // A reader counts once per article in half an hour, however often the page
  // is reloaded.
  const shouldIncrement =
    req.nextUrl.searchParams.get("incr") != null &&
    consumeRateLimitToken(`view:increment:${clientIp}:${id}`, {
      limit: 1,
      windowMs: 30 * 60 * 1000,
    }).allowed;

  const views = shouldIncrement
    ? await incrementViews(id)
    : (await readViews([id]))?.[id] ?? null;

  return NextResponse.json({ id, views }, { headers: NO_STORE });
}

function errorResponse(
  message: string,
  code: string,
  status: number,
  headers: Record<string, string> = {}
) {
  return NextResponse.json(
    { error: { message, code } },
    { status, headers: { ...NO_STORE, ...headers } }
  );
}
