import { NextRequest, NextResponse } from "next/server";
import { getManifest, type PostLocale } from "../../get-posts";
import { defaultLocale } from "@/locales/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const manifest = await getManifest();
  const locale = (req.nextUrl.searchParams.get("locale") ?? defaultLocale) as PostLocale;
  const posts = manifest?.posts?.[locale] ?? [];

  return NextResponse.json({ locale, posts });
}
