import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import manifest from "@/posts/manifest.json";
import {
  editorAccessCookieName,
  hashEditorAccessToken,
} from "@/utils/shared/editor-access";
import { setCustomHeaders } from "@/utils/server/response-helpers";

type ManifestPost = {
  status?: "draft" | "published" | "archived" | string;
  draft?: boolean;
  archived?: boolean;
  path?: string;
};

const configuredEditorAccessToken = process.env.EDITOR_ACCESS_TOKEN?.trim() ?? "";
const configuredEditorAccessHashPromise = configuredEditorAccessToken
  ? hashEditorAccessToken(configuredEditorAccessToken)
  : null;
const englishPosts: ManifestPost[] = ((manifest as { posts?: ManifestPost[] }).posts ?? []);
const draftPostPaths = new Set(
  englishPosts
    .filter(post => normalizeStatus(post) === "draft" && typeof post.path === "string")
    .map(post => normalizePathname(post.path as string)),
);
const archivedPostPaths = new Set(
  englishPosts
    .filter(post => normalizeStatus(post) === "archived" && typeof post.path === "string")
    .map(post => normalizePathname(post.path as string)),
);

function createResponse(response: NextResponse, startedAt: number): NextResponse {
  return setCustomHeaders(response, {
    "x-edge-age": String(Date.now() - startedAt),
    "x-powered-by": "Next.js",
  });
}

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
  if (!cookieValue) {
    return false;
  }

  return cookieValue === (await configuredEditorAccessHashPromise);
}

export async function middleware(req: NextRequest) {
  const startedAt = Date.now();
  const pathname = normalizePathname(new URL(req.url).pathname);
  const respond = (response: NextResponse) => createResponse(response, startedAt);

  if (/^\/\d{4}\//.test(pathname)) {
    if (archivedPostPaths.has(pathname)) {
      return respond(new NextResponse("Not Found", { status: 404 }));
    }

    if (draftPostPaths.has(pathname) && !(await canPreviewDraftRequest(req))) {
      return respond(new NextResponse("Not Found", { status: 404 }));
    }
  }

  return respond(NextResponse.next());
}
