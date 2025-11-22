import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setCustomHeaders } from "@/utils/server/response-helpers";

function createResponse(response: NextResponse, startedAt: number): NextResponse {
  return setCustomHeaders(response, {
    "x-edge-age": String(Date.now() - startedAt),
    "x-powered-by": "Next.js",
  });
}

function detectLanguage(req: NextRequest): string {
  const languageCookie = req.cookies.get("language");
  if (languageCookie?.value) {
    return languageCookie.value;
  }

  const acceptLanguage = req.headers.get("accept-language") || "";
  return acceptLanguage.startsWith("zh") ? "zh" : "en";
}

function setLanguageCookie(response: NextResponse, language: string): void {
  response.cookies.set("language", language, { path: "/" });
}

export function middleware(req: NextRequest) {
  const startedAt = Date.now();
  const url = req.nextUrl.clone();
  const respond = (response: NextResponse, language?: string) => {
    if (language) {
      setLanguageCookie(response, language);
    }
    return createResponse(response, startedAt);
  };

  if (url.pathname === "/about/zh" || url.pathname === "/about/en") {
    const language = url.pathname.endsWith("/zh") ? "zh" : "en";
    return respond(NextResponse.next(), language);
  }

  if (url.pathname === "/") {
    const language = detectLanguage(req);
    return respond(NextResponse.next(), language);
  }

  if (url.pathname === "/about") {
    const language = detectLanguage(req);
    url.pathname = `${url.pathname}/${language}`;
    return respond(NextResponse.redirect(url), language);
  }

  if (url.pathname.startsWith("/zh") || url.pathname.startsWith("/en")) {
    const language = url.pathname.startsWith("/zh") ? "zh" : "en";
    return respond(NextResponse.next(), language);
  }

  if (/^\/\d{4}/.test(url.pathname)) {
    const language = detectLanguage(req);
    url.pathname = `/${language}${url.pathname}`;
    return respond(NextResponse.redirect(url), language);
  }

  return respond(NextResponse.next());
}
