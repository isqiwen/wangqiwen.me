import { NextResponse } from "next/server";
import { requireLocalEditor } from "@/utils/server/local-editor";
import { collectEditorFiles } from "@/utils/server/editor-files";
import {
  createEditorJsonError,
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "list-files",
    limit: 180,
    windowMs: 60 * 1000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const unavailable = requireLocalEditor();
  if (unavailable) {
    return unavailable;
  }

  try {
    const entries = await collectEditorFiles();
    logEditorInfo("list-files", "Loaded editor file list.", {
      count: entries.length,
    });
    return NextResponse.json({ files: entries }, { headers: NO_STORE });
  } catch (error) {
    return createEditorJsonError(
      "list-files",
      "failed to list files",
      500,
      error
    );
  }
}
