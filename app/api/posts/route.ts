import { NextRequest, NextResponse } from "next/server";
import { getManifest, type PostLocale } from "../../get-posts";
import { defaultLocale } from "@/locales/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const manifest = await getManifest();
  const locale = (req.nextUrl.searchParams.get("locale") ?? defaultLocale) as PostLocale;
  const posts =
    manifest?.posts?.[locale]?.map(post => ({
      id: post.id,
      title: post.title,
      description: post.description,
      publishedAt: post.publishedAt,
      path: post.path,
    })) ?? [];

  return NextResponse.json({ locale, posts });
}
