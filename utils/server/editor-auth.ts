import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  editorAccessCookieName,
  hashEditorAccessToken,
} from "@/utils/shared/editor-access";

const NO_STORE = { "Cache-Control": "no-store" };
const EDITOR_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isLocalEditorAvailable(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function requireLocalEditor() {
  if (isLocalEditorAvailable()) {
    return null;
  }

  return NextResponse.json(
    { error: "not found" },
    { status: 404, headers: NO_STORE },
  );
}

function getConfiguredToken(): string {
  return process.env.EDITOR_ACCESS_TOKEN?.trim() ?? "";
}

function allowOpenEditorAccess(): boolean {
  return isLocalEditorAvailable();
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function shouldUseSecureCookie(req?: Request): boolean {
  if (!req) {
    return process.env.NODE_ENV === "production";
  }

  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
  }

  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function getCookieOptions(req?: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookie(req),
    path: "/",
  };
}

export function isEditorProtectionEnabled(): boolean {
  return isLocalEditorAvailable() && getConfiguredToken().length > 0;
}

export function isValidEditorToken(token: string): boolean {
  if (!isLocalEditorAvailable()) {
    return false;
  }

  const expectedToken = getConfiguredToken();

  if (!expectedToken) {
    return allowOpenEditorAccess();
  }

  return safeCompare(token.trim(), expectedToken);
}

export async function isEditorAuthorized(): Promise<boolean> {
  if (!isLocalEditorAvailable()) {
    return false;
  }

  if (!isEditorProtectionEnabled()) {
    return allowOpenEditorAccess();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(editorAccessCookieName)?.value ?? "";
  return sessionCookie === (await hashEditorAccessToken(getConfiguredToken()));
}

export async function requireEditorAccess() {
  const unavailable = requireLocalEditor();
  if (unavailable) {
    return unavailable;
  }

  const authorized = await isEditorAuthorized();

  if (authorized) {
    return null;
  }

  const error = isEditorProtectionEnabled()
    ? "editor access denied"
    : "editor access is not configured";

  return NextResponse.json(
    { error },
    { status: 401, headers: NO_STORE },
  );
}

export async function canPreviewDrafts(): Promise<boolean> {
  if (!isLocalEditorAvailable()) {
    return false;
  }

  if (!isEditorProtectionEnabled()) {
    return true;
  }

  return isEditorAuthorized();
}

export async function applyEditorAccess(response: NextResponse, req?: Request) {
  if (!isEditorProtectionEnabled()) {
    return response;
  }

  // Store a derived session value instead of the raw token so the secret
  // never needs to round-trip back to the browser after the first unlock.
  response.cookies.set({
    name: editorAccessCookieName,
    value: await hashEditorAccessToken(getConfiguredToken()),
    maxAge: EDITOR_ACCESS_MAX_AGE_SECONDS,
    ...getCookieOptions(req),
  });

  return response;
}

export function clearEditorAccess(response: NextResponse, req?: Request) {
  response.cookies.set({
    name: editorAccessCookieName,
    value: "",
    maxAge: 0,
    ...getCookieOptions(req),
  });

  return response;
}
