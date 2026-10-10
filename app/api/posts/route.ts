import { NextResponse } from "next/server";
import { getPosts } from "@/app/get-posts";

export const dynamic = "force-dynamic";

// The public index of published posts.
export async function GET() {
  const posts = (await getPosts()).map(({ date: _date, ...post }) => ({
    ...post,
    path: `/${post.publishedAt.slice(0, 4)}/${post.id}`,
  }));

  return NextResponse.json({ posts });
}
