import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  editorAccessCookieName,
  hashEditorAccessToken,
} from "@/utils/shared/editor-access";
import { logger } from "@/utils/logger";

type ManifestPost = {
  status?: "draft" | "published" | "archived" | string;
  draft?: boolean;
  archived?: boolean;
  path?: string;
};

type Manifest = {
  posts?: ManifestPost[];
};

export const config = {
  runtime: "nodejs",
};

const POSTS_MANIFEST_PATH = path.join(process.cwd(), "posts", "manifest.json");
const POST_ROUTE_PATTERN = /^\/\d{4}\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const configuredEditorAccessToken = process.env.EDITOR_ACCESS_TOKEN?.trim() ?? "";
const configuredEditorAccessHashPromise = configuredEditorAccessToken
  ? hashEditorAccessToken(configuredEditorAccessToken)
  : null;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function normalizeStatus(post?: ManifestPost): "draft" | "published" | "archived" {
  const value = post?.status;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "draft" || normalized === "published" || normalized === "archived") {
      return normalized;
    }
  }

  if (post?.archived) {
    return "archived";
  }

  if (post?.draft) {
    return "draft";
  }

  return "published";
}

async function canPreviewDraftRequest(req: NextRequest): Promise<boolean> {
  if (!configuredEditorAccessHashPromise) {
    return process.env.NODE_ENV !== "production";
  }

  const cookieValue = req.cookies.get(editorAccessCookieName)?.value ?? "";
  return Boolean(cookieValue) && cookieValue === (await configuredEditorAccessHashPromise);
}

async function loadPost(pathname: string): Promise<ManifestPost | null> {
  const source = await fs.readFile(POSTS_MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(source) as Manifest;
  if (!Array.isArray(manifest.posts)) {
    throw new Error("Post manifest does not contain a posts array.");
  }

  return (
    manifest.posts.find(
      post =>
        typeof post.path === "string" &&
        normalizePathname(post.path) === pathname,
    ) ?? null
  );
}

export async function middleware(req: NextRequest) {
  const pathname = normalizePathname(req.nextUrl.pathname);
  if (!POST_ROUTE_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  try {
    const post = await loadPost(pathname);
    if (!post) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const status = normalizeStatus(post);
    if (status === "archived") {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (status === "draft" && !(await canPreviewDraftRequest(req))) {
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
