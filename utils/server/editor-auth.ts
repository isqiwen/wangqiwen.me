import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  editorAccessCookieName,
  hashEditorAccessToken,
} from "@/utils/shared/editor-access";

const NO_STORE = { "Cache-Control": "no-store" };
const EDITOR_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getConfiguredToken(): string {
  return process.env.EDITOR_ACCESS_TOKEN?.trim() ?? "";
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function isEditorProtectionEnabled(): boolean {
  return getConfiguredToken().length > 0;
}

export function isValidEditorToken(token: string): boolean {
  const expectedToken = getConfiguredToken();

  if (!expectedToken) {
    return true;
  }

  return safeCompare(token.trim(), expectedToken);
}

export async function isEditorAuthorized(): Promise<boolean> {
  if (!isEditorProtectionEnabled()) {
    return true;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(editorAccessCookieName)?.value ?? "";
  return sessionCookie === (await hashEditorAccessToken(getConfiguredToken()));
}

export async function requireEditorAccess() {
  const authorized = await isEditorAuthorized();

  if (authorized) {
    return null;
  }

  return NextResponse.json(
    { error: "editor access denied" },
    { status: 401, headers: NO_STORE },
  );
}

export async function canPreviewDrafts(): Promise<boolean> {
  if (!isEditorProtectionEnabled()) {
    // Keep local authoring ergonomic, but avoid accidentally exposing drafts
    // on a deployed site that has no explicit editor token configured.
    return process.env.NODE_ENV !== "production";
  }

  return isEditorAuthorized();
}

export async function applyEditorAccess(response: NextResponse) {
  if (!isEditorProtectionEnabled()) {
    return response;
  }

  // Store a derived session value instead of the raw token so the secret
  // never needs to round-trip back to the browser after the first unlock.
  response.cookies.set({
    name: editorAccessCookieName,
    value: await hashEditorAccessToken(getConfiguredToken()),
    maxAge: EDITOR_ACCESS_MAX_AGE_SECONDS,
    ...getCookieOptions(),
  });

  return response;
}

export function clearEditorAccess(response: NextResponse) {
  response.cookies.set({
    name: editorAccessCookieName,
    value: "",
    maxAge: 0,
    ...getCookieOptions(),
  });

  return response;
}
