import redis from "@/app/redis";
import { getPostById } from "@/app/get-posts";
import commaNumber from "comma-number";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";
import { canPreviewDrafts } from "@/utils/server/editor-auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? null;

  if (id === null) {
    return NextResponse.json(
      {
        error: {
          message: 'Missing "id" query',
          code: "MISSING_ID",
        },
      },
      { status: 400 }
    );
  }

  const post = await getPostById(id, {
    includeDrafts: await canPreviewDrafts(),
  });

  if (post == null) {
    return NextResponse.json(
      {
        error: {
          message: "Unknown post",
          code: "UNKNOWN_POST",
        },
      },
      { status: 400 }
    );
  }

  if (url.searchParams.get("incr") != null) {
    const views = await incrementViews(id);
    return NextResponse.json({
      ...post,
      views,
      viewsFormatted: commaNumber(views),
    });
  } else {
    const views = await readViews(id);
    return NextResponse.json({
      ...post,
      views,
      viewsFormatted: commaNumber(views),
    });
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
