import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";
import { getEditorRequestError } from "@/utils/shared/editor-access";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The local authoring flow mutates posts/manifest.json. Importing that file
// makes every save rebuild middleware (and can invalidate all dev routes).
// Node middleware is supported by Next.js 15.5; the standalone artifact already
// includes the published-only index. Read it as data, never as a module.
export const config = { runtime: "nodejs" };

type ManifestPost = {
  status: "draft" | "published" | "archived";
  path: string;
};
type Manifest = { posts?: ManifestPost[] };

const POST_ROUTE_PATTERN = /^\/\d{4}\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EDITOR_ROUTE_PATTERN = /^\/(?:editor|api\/editor)(?:\/|$)/;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function getStatus(post: ManifestPost): "draft" | "published" | "archived" {
  if (post.status === "draft" || post.status === "published" || post.status === "archived") {
    return post.status;
  }
  throw new Error(`Post manifest contains an invalid status for ${post.path}.`);
}

async function loadPost(pathname: string): Promise<ManifestPost | null> {
  const raw = await readFile(join(process.cwd(), "posts", "manifest.json"), "utf8");
  const postsManifest = JSON.parse(raw) as Manifest;
  if (!Array.isArray(postsManifest.posts)) {
    throw new Error("Post manifest does not contain a posts array.");
  }
  return postsManifest.posts.find(post =>
    typeof post.path === "string" && normalizePathname(post.path) === pathname
  ) ?? null;
}

export async function middleware(req: NextRequest) {
  const pathname = normalizePathname(req.nextUrl.pathname);
  if (EDITOR_ROUTE_PATTERN.test(pathname)) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Not Found", {
        status: 404, headers: { "Cache-Control": "no-store" },
      });
    }
    const error = getEditorRequestError(req);
    if (error) {
      return NextResponse.json({ error }, {
        status: 403, headers: { "Cache-Control": "no-store" },
      });
    }
  }

  if (!POST_ROUTE_PATTERN.test(pathname)) return NextResponse.next();

  try {
    const post = await loadPost(pathname);
    if (!post) return new NextResponse("Not Found", { status: 404 });
    const status = getStatus(post);
    if (status === "archived" || (status === "draft" && process.env.NODE_ENV === "production")) {
      return new NextResponse("Not Found", { status: 404 });
    }
    return NextResponse.next();
  } catch (error) {
    logger.error("[middleware] Failed to load the post manifest.", error);
    return new NextResponse("Post index is temporarily unavailable.", {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
