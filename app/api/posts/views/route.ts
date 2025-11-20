import { NextRequest, NextResponse } from "next/server";
import redis from "@/app/redis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({});
  }

  const ids = Array.from(
    new Set(
      idsParam
        .split(",")
        .map(id => id.trim())
        .filter(Boolean),
    ),
  );

  if (ids.length === 0) {
    return NextResponse.json({});
  }

  try {
    const views: Record<string, number> = {};
    for (const id of ids) {
      const value = await redis.hget("views", id);
      views[id] = Number(value ?? 0);
    }
    return NextResponse.json(views);
  } catch (error) {
    console.warn("Failed to load views", error);
    return NextResponse.json({}, { status: 200 });
  }
}
