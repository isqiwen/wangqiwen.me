import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setCustomHeaders } from '@/utils/server/response-helpers';

const initialDate = Date.now();

function createResponse(response: NextResponse): NextResponse {
  return setCustomHeaders(response, {
    'x-edge-age': String(Date.now() - initialDate),
    'x-powered-by': 'Next.js',
  });
}

function detectLanguage(req: NextRequest): string {
  const languageCookie = req.cookies.get('language');
  if (languageCookie?.value) {
    return languageCookie.value;
  }

  const acceptLanguage = req.headers.get('accept-language') || '';
  return acceptLanguage.startsWith('zh') ? 'zh' : 'en';
}

function setLanguageCookie(response: NextResponse, language: string): void {
  response.cookies.set('language', language, { path: '/' });
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  if (url.pathname === '/about/zh' || url.pathname === '/about/en') {
    return NextResponse.next();
  }

  let language: string;

  if (url.pathname === '/') {
    language = detectLanguage(req);
    const response = NextResponse.next();
    setLanguageCookie(response, language);
    return createResponse(response);
  }

  if (url.pathname === '/about') {
    language = detectLanguage(req);
    url.pathname = `${url.pathname}/${language}`;
    const response = NextResponse.redirect(url);
    setLanguageCookie(response, language);
    return createResponse(response);
  }

  if (url.pathname.startsWith('/zh') || url.pathname.startsWith('/en')) {
    language = url.pathname.startsWith('/zh') ? 'zh' : 'en';
    const response = NextResponse.next();
    setLanguageCookie(response, language);
    return createResponse(response);
  }

  if (/^\/\d{4}/.test(url.pathname)) {
    language = detectLanguage(req);
    url.pathname = `/${language}${url.pathname}`;
    const response = NextResponse.redirect(url);
    setLanguageCookie(response, language);
    return createResponse(response);
  } else {
    const response = NextResponse.next();
    return createResponse(response);
  }
}
