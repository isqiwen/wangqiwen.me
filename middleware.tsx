import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";
import manifest from "@/posts/manifest.json";

type ManifestPost = {
  status: "draft" | "published" | "archived";
  path: string;
};

type Manifest = {
  posts?: ManifestPost[];
};

const POST_ROUTE_PATTERN = /^\/\d{4}\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EDITOR_ROUTE_PATTERN = /^\/(?:editor|api\/editor)(?:\/|$)/;
const postsManifest = manifest as Manifest;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function getStatus(post: ManifestPost): "draft" | "published" | "archived" {
  if (
    post.status === "draft" ||
    post.status === "published" ||
    post.status === "archived"
  ) {
    return post.status;
  }

  throw new Error(`Post manifest contains an invalid status for ${post.path}.`);
}

function canPreviewDraftRequest(): boolean {
  return process.env.NODE_ENV !== "production";
}

function loadPost(pathname: string): ManifestPost | null {
  if (!Array.isArray(postsManifest.posts)) {
    throw new Error("Post manifest does not contain a posts array.");
  }

  return (
    postsManifest.posts.find(
      post =>
        typeof post.path === "string" &&
        normalizePathname(post.path) === pathname
    ) ?? null
  );
}

export async function middleware(req: NextRequest) {
  const pathname = normalizePathname(req.nextUrl.pathname);
  if (
    process.env.NODE_ENV === "production" &&
    EDITOR_ROUTE_PATTERN.test(pathname)
  ) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  if (!POST_ROUTE_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  try {
    const post = loadPost(pathname);
    if (!post) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const status = getStatus(post);
    if (status === "archived") {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (status === "draft" && !canPreviewDraftRequest()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.next();
  } catch (error) {
    logger.error("[middleware] Failed to load the post manifest.", error);
    return new NextResponse("Post index is temporarily unavailable.", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
