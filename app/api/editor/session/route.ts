import { NextResponse } from "next/server";
import {
  applyEditorAccess,
  clearEditorAccess,
  isEditorAuthorized,
  isEditorProtectionEnabled,
  isValidEditorToken,
} from "@/utils/server/editor-auth";
import {
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "session-state",
    limit: 240,
    windowMs: 60 * 1000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  return NextResponse.json(
    {
      enabled: isEditorProtectionEnabled() || process.env.NODE_ENV === "production",
      authorized: await isEditorAuthorized(),
    },
    { headers: NO_STORE },
  );
}

export async function POST(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "session-unlock",
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  if (!isEditorProtectionEnabled() && process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      { enabled: false, authorized: true },
      { headers: NO_STORE },
    );
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token : "";

  if (!token || !isValidEditorToken(token)) {
    return NextResponse.json(
      {
        enabled: true,
        authorized: false,
        error: "invalid token",
      },
      { status: 401, headers: NO_STORE },
    );
  }

  logEditorInfo("session-unlock", "Unlocked editor session.");
  return await applyEditorAccess(
    NextResponse.json(
      { enabled: true, authorized: true },
      { headers: NO_STORE },
    ),
    req,
  );
}

export async function DELETE(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "session-signout",
    limit: 40,
    windowMs: 60 * 1000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  logEditorInfo("session-signout", "Signed out editor session.");
  return clearEditorAccess(
    NextResponse.json({ ok: true }, { headers: NO_STORE }),
    req,
  );
}
