import { NextRequest, NextResponse } from "next/server";
import { getManifest, type PostLocale } from "../../get-posts";
import { defaultLocale, resolveLocale } from "@/locales/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const manifest = await getManifest();
  const locale = resolveLocale(req.nextUrl.searchParams.get("locale") ?? defaultLocale) as PostLocale;
  const posts =
    manifest?.posts?.[locale]?.map(post => ({
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
    })).filter(post => post.status === "published") ?? [];

  return NextResponse.json({ locale, posts });
}
