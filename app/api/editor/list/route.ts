import { NextResponse } from "next/server";
import { editorRoute, logEditorInfo } from "@/utils/server/editor-api";
import { collectEditorFiles } from "@/utils/server/editor-files";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export const GET = editorRoute(
  { action: "list-files", limit: 180, failureMessage: "failed to list files" },
  async () => {
    const entries = await collectEditorFiles();
    logEditorInfo("list-files", "Loaded editor file list.", {
      count: entries.length,
    });
    return NextResponse.json({ files: entries }, { headers: NO_STORE });
  }
);
