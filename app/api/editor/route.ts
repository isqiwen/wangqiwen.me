import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { editorRoute, logEditorInfo } from "@/utils/server/editor-api";
import {
  POSTS_ROOT,
  readFileIfPresent,
  removeEmptyParents,
  resolvePostFile,
  validatePostContent,
  withPostMutationLock,
  writeFileAtomically,
} from "@/utils/server/post-files";
import {
  assertPostPrecondition,
  getPostVersion,
} from "@/utils/server/post-version";
import { syncPostsMetadata } from "@/utils/server/sync-posts";
import { parseExportedMetadata } from "@/utils/shared/post-metadata";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

type EditorMetadata = {
  status?: unknown;
};

export const GET = editorRoute(
  {
    action: "read-file",
    limit: 180,
    failureMessage: "failed to read post",
    missingFileIsNotFound: true,
  },
  async req => {
    const { searchParams } = new URL(req.url);
    const postFile = resolvePostFile(searchParams.get("path"));
    const content = await fs.readFile(postFile.absolutePath, "utf8");
    logEditorInfo("read-file", "Loaded editor post.", {
      path: postFile.relativePath,
    });
    const version = getPostVersion(content);

    return NextResponse.json(
      { content, version },
      { headers: { ...NO_STORE, ETag: version } }
    );
  }
);

export const POST = editorRoute(
  { action: "save-file", limit: 60, failureMessage: "failed to save post" },
  async req => {
    const payload = await req.json();
    const target = resolvePostFile(payload?.path);
    const previous = payload?.previousPath
      ? resolvePostFile(payload.previousPath)
      : null;
    const content = validatePostContent(payload?.content, target);

    return withPostMutationLock(async () => {
      const isMove = Boolean(
        previous && previous.absolutePath !== target.absolutePath
      );
      const originalPath = previous?.absolutePath ?? target.absolutePath;
      const originalContent = await readFileIfPresent(originalPath);

      assertPostPrecondition(originalContent, req.headers, !previous);

      if (isMove && (await fileExists(target.absolutePath))) {
        return NextResponse.json(
          { error: "a post already exists at the target path" },
          { status: 409, headers: NO_STORE }
        );
      }

      await writeFileAtomically(target.absolutePath, content);
      try {
        if (isMove && previous) {
          await fs.rm(previous.absolutePath);
        }
        await syncPostsMetadata();
      } catch (error) {
        await rollbackSave({
          targetPath: target.absolutePath,
          originalPath,
          originalContent,
        });
        await syncPostsMetadata().catch(() => undefined);
        throw error;
      }

      if (isMove && previous) {
        await removeEmptyParents(
          path.dirname(previous.absolutePath),
          POSTS_ROOT
        );
      }

      logEditorInfo("save-file", "Saved editor post and synchronized posts.", {
        path: target.relativePath,
        previousPath: previous?.relativePath,
      });

      const version = getPostVersion(content);
      return NextResponse.json(
        { ok: true, path: target.relativePath, version },
        { headers: { ...NO_STORE, ETag: version } }
      );
    });
  }
);

export const DELETE = editorRoute(
  {
    action: "delete-file",
    limit: 30,
    failureMessage: "failed to delete post",
    missingFileIsNotFound: true,
  },
  async req => {
    const payload = await req.json();
    const postFile = resolvePostFile(payload?.path);

    return withPostMutationLock(async () => {
      const content = await readFileIfPresent(postFile.absolutePath);
      assertPostPrecondition(content, req.headers, false);
      // The precondition rejects a missing file before any mutation occurs.
      if (content === null) throw new Error("Post disappeared before deletion");
      const metadata = parseExportedMetadata<EditorMetadata>(content);

      if (
        !metadata ||
        (metadata.status !== "draft" && metadata.status !== "archived")
      ) {
        return NextResponse.json(
          {
            error:
              "published or invalid posts must be archived before deletion",
          },
          { status: 409, headers: NO_STORE }
        );
      }

      await fs.rm(postFile.absolutePath);
      try {
        await syncPostsMetadata();
      } catch (error) {
        await writeFileAtomically(postFile.absolutePath, content);
        await syncPostsMetadata().catch(() => undefined);
        throw error;
      }

      await removeEmptyParents(path.dirname(postFile.absolutePath), POSTS_ROOT);
      logEditorInfo(
        "delete-file",
        "Deleted editor post and synchronized posts.",
        { path: postFile.relativePath }
      );

      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    });
  }
);

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function rollbackSave(options: {
  targetPath: string;
  originalPath: string;
  originalContent: string | null;
}) {
  if (options.originalContent === null) {
    await fs.rm(options.targetPath, { force: true });
    return;
  }

  if (options.originalPath !== options.targetPath) {
    await fs.rm(options.targetPath, { force: true });
  }
  await writeFileAtomically(options.originalPath, options.originalContent);
}
