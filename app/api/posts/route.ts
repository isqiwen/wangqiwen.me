import { NextResponse } from "next/server";
import { getManifest } from "../../get-posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const manifest = await getManifest();
  const posts =
    manifest?.posts
      ?.map(post => ({
        id: post.id,
        title: post.title,
        description: post.description,
        summary: post.summary,
        series: post.series,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        status: post.status ?? "published",
        featured: post.featured ?? false,
        tags: post.tags ?? [],
        cover: post.cover ?? null,
        readingTimeMinutes: post.readingTimeMinutes ?? 1,
        path: post.path,
      }))
      .filter(post => post.status === "published") ?? [];

  return NextResponse.json({ posts });
}
