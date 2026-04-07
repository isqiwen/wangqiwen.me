import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  supportedLocales,
  defaultLocale,
  isSupportedLocale,
  languageCookieName,
  type Locale,
} from "@/locales/config";
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
const manifestPosts = (manifest as { posts?: Record<string, ManifestPost[]> }).posts ?? {};
const knownPostPaths = new Set(
  Object.values(manifestPosts).flatMap(posts =>
    (posts ?? [])
      .filter(post => typeof post?.path === "string")
      .map(post => normalizePathname(post.path as string)),
  ),
);
const draftPostPaths = new Set(
  Object.values(manifestPosts).flatMap(posts =>
    (posts ?? [])
      .filter(post => normalizeStatus(post) === "draft" && typeof post.path === "string")
      .map(post => normalizePathname(post.path as string)),
  ),
);
const archivedPostPaths = new Set(
  Object.values(manifestPosts).flatMap(posts =>
    (posts ?? [])
      .filter(post => normalizeStatus(post) === "archived" && typeof post.path === "string")
      .map(post => normalizePathname(post.path as string)),
  ),
);

function createResponse(response: NextResponse, startedAt: number): NextResponse {
  return setCustomHeaders(response, {
    "x-edge-age": String(Date.now() - startedAt),
    "x-powered-by": "Next.js",
  });
}

function detectLanguage(req: NextRequest): Locale {
  const languageCookie = req.cookies.get(languageCookieName);
  const cookieValue = languageCookie?.value;

  if (isSupportedLocale(cookieValue)) {
    return cookieValue;
  }

  const acceptLanguage = req.headers.get("accept-language") || "";
  return acceptLanguage.startsWith("zh") ? "zh" : defaultLocale;
}

function setLanguageCookie(response: NextResponse, language: Locale): void {
  response.cookies.set(languageCookieName, language, { path: "/" });
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isDraftPath(pathname: string): boolean {
  return draftPostPaths.has(normalizePathname(pathname));
}

function isArchivedPath(pathname: string): boolean {
  return archivedPostPaths.has(normalizePathname(pathname));
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

function getPathLocale(pathname: string): Locale | null {
  if (pathname === "/zh" || pathname.startsWith("/zh/")) {
    return "zh";
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en";
  }

  return null;
}

function toBarePostPath(pathname: string): string {
  return pathname.replace(/^\/(?:zh|en)(?=\/)/, "") || "/";
}

function resolveLocalizedPostPath(
  barePath: string,
  preferredLocale: Locale,
  canPreviewDraft: boolean,
): string | null | undefined {
  const normalizedBarePath = normalizePathname(barePath);
  const localeOrder: Locale[] = [
    preferredLocale,
    ...supportedLocales.filter(locale => locale !== preferredLocale),
  ];
  let matchedAny = false;

  for (const locale of localeOrder) {
    const localizedPath = normalizePathname(`/${locale}${normalizedBarePath}`);

    if (!knownPostPaths.has(localizedPath)) {
      continue;
    }

    matchedAny = true;

    if (isArchivedPath(localizedPath)) {
      continue;
    }

    if (!isDraftPath(localizedPath) || canPreviewDraft) {
      return localizedPath;
    }
  }

  return matchedAny ? null : undefined;
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
  const url = req.nextUrl.clone();
  const pathname = normalizePathname(url.pathname);
  const respond = (response: NextResponse, language?: Locale) => {
    if (language) {
      setLanguageCookie(response, language);
    }
    return createResponse(response, startedAt);
  };

  if (pathname === "/about/zh" || pathname === "/about/en") {
    const language = pathname.endsWith("/zh") ? "zh" : "en";
    return respond(NextResponse.next(), language);
  }

  if (pathname === "/") {
    const language = detectLanguage(req);
    return respond(NextResponse.next(), language);
  }

  if (pathname === "/about") {
    const language = detectLanguage(req);
    url.pathname = `${pathname}/${language}`;
    return respond(NextResponse.redirect(url), language);
  }

  const pathLocale = getPathLocale(pathname);
  if (pathLocale) {
    const language = pathLocale;

    if (isArchivedPath(pathname)) {
      return respond(new NextResponse("Not Found", { status: 404 }), language);
    }

    if (isDraftPath(pathname) && !(await canPreviewDraftRequest(req))) {
      return respond(new NextResponse("Not Found", { status: 404 }), language);
    }

    return respond(NextResponse.next(), language);
  }

  if (/^\/\d{4}/.test(pathname)) {
    const language = detectLanguage(req);
    const canPreviewDraft = await canPreviewDraftRequest(req);
    const resolvedLocalizedPath = resolveLocalizedPostPath(
      pathname,
      language,
      canPreviewDraft,
    );
    const localizedPath = resolvedLocalizedPath ?? `/${language}${pathname}`;

    if (
      resolvedLocalizedPath === null ||
      isArchivedPath(localizedPath) ||
      (isDraftPath(localizedPath) && !canPreviewDraft)
    ) {
      return respond(new NextResponse("Not Found", { status: 404 }), language);
    }

    url.pathname = localizedPath;
    return respond(NextResponse.redirect(url), language);
  }

  return respond(NextResponse.next());
}
