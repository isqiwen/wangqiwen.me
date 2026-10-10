import { NextResponse } from "next/server";
import {
  createEditorJsonError,
  editorRoute,
  logEditorInfo,
} from "@/utils/server/editor-api";
import { withPostMutationLock } from "@/utils/server/post-files";
import { syncPostsMetadata } from "@/utils/server/sync-posts";

export const runtime = "nodejs";

export const POST = editorRoute(
  { action: "publish", limit: 20, failureMessage: "publish failed" },
  async () => {
    try {
      const { stdout, stderr } = await withPostMutationLock(() =>
        syncPostsMetadata()
      );
      logEditorInfo("publish", "Synchronized post metadata after publish.", {
        hasStdout: Boolean(stdout),
        hasStderr: Boolean(stderr),
      });

      return NextResponse.json({ ok: true, stdout, stderr });
    } catch (error) {
      // The author needs the validation text itself, not a generic failure.
      return createEditorJsonError(
        "publish",
        error instanceof Error ? error.message : "publish failed",
        500,
        error
      );
    }
  }
);
