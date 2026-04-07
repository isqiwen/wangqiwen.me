import { NextResponse } from "next/server";
import { requireEditorAccess } from "@/utils/server/editor-auth";
import { syncPostsMetadata } from "@/utils/server/sync-posts";
import {
  createEditorJsonError,
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "publish",
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const denied = await requireEditorAccess();
  if (denied) {
    return denied;
  }

  try {
    const { stdout, stderr } = await syncPostsMetadata();
    logEditorInfo("publish", "Synchronized post metadata after publish.", {
      hasStdout: Boolean(stdout),
      hasStderr: Boolean(stderr),
    });

    return NextResponse.json({ ok: true, stdout, stderr });
  } catch (error: any) {
    return createEditorJsonError("publish", error?.message ?? "publish failed", 500, error, {
      stdout: error?.stdout,
      stderr: error?.stderr,
    });
  }
}
