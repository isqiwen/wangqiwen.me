import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireLocalEditor } from "@/utils/server/local-editor";
import {
  POSTS_ROOT,
  PostFileValidationError,
  resolvePostFile,
  validatePostContent,
  withPostMutationLock,
  writeFileAtomically,
} from "@/utils/server/post-files";
import { syncPostsMetadata } from "@/utils/server/sync-posts";
import { parseExportedMetadata } from "@/utils/shared/post-metadata";
import {
  createEditorJsonError,
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

type EditorMetadata = {
  status?: unknown;
};

export async function GET(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "read-file",
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

  const { searchParams } = new URL(req.url);

  try {
    const postFile = resolvePostFile(searchParams.get("path"));
    const content = await fs.readFile(postFile.absolutePath, "utf8");
    logEditorInfo("read-file", "Loaded editor post.", {
      path: postFile.relativePath,
    });
    return NextResponse.json({ content }, { headers: NO_STORE });
  } catch (error: any) {
    if (error instanceof PostFileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
    }
    if (error?.code === "ENOENT") {
      return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
    }
    return createEditorJsonError("read-file", "failed to read post", 500, error);
  }
}

export async function POST(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "save-file",
    limit: 60,
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
    const payload = await req.json();
    const target = resolvePostFile(payload?.path);
    const previous = payload?.previousPath
      ? resolvePostFile(payload.previousPath)
      : null;
    const content = validatePostContent(payload?.content, target);

    return await withPostMutationLock(async () => {
      const isMove = Boolean(previous && previous.absolutePath !== target.absolutePath);
      const originalPath = previous?.absolutePath ?? target.absolutePath;
      const originalContent = await readFileIfPresent(originalPath);

      if (previous && originalContent === null) {
        return NextResponse.json(
          { error: "the original post no longer exists" },
          { status: 404, headers: NO_STORE },
        );
      }

      if (isMove && (await fileExists(target.absolutePath))) {
        return NextResponse.json(
          { error: "a post already exists at the target path" },
          { status: 409, headers: NO_STORE },
        );
      }

      if (!previous && originalContent !== null) {
        return NextResponse.json(
          { error: "a post already exists at the target path" },
          { status: 409, headers: NO_STORE },
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
        await cleanupEmptyParents(path.dirname(previous.absolutePath));
      }

      logEditorInfo("save-file", "Saved editor post and synchronized posts.", {
        path: target.relativePath,
        previousPath: previous?.relativePath,
      });

      return NextResponse.json(
        { ok: true, path: target.relativePath },
        { headers: NO_STORE },
      );
    });
  } catch (error) {
    if (error instanceof PostFileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
    }
    return createEditorJsonError("save-file", "failed to save post", 500, error);
  }
}

export async function DELETE(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "delete-file",
    limit: 30,
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
    const payload = await req.json();
    const postFile = resolvePostFile(payload?.path);

    return await withPostMutationLock(async () => {
      const content = await fs.readFile(postFile.absolutePath, "utf8");
      const metadata = parseExportedMetadata<EditorMetadata>(content);

      if (
        !metadata ||
        (metadata.status !== "draft" && metadata.status !== "archived")
      ) {
        return NextResponse.json(
          { error: "published or invalid posts must be archived before deletion" },
          { status: 409, headers: NO_STORE },
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

      await cleanupEmptyParents(path.dirname(postFile.absolutePath));
      logEditorInfo("delete-file", "Deleted editor post and synchronized posts.", {
        path: postFile.relativePath,
      });

      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    });
  } catch (error: any) {
    if (error instanceof PostFileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
    }
    if (error?.code === "ENOENT") {
      return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
    }
    return createEditorJsonError("delete-file", "failed to delete post", 500, error);
  }
}

async function readFileIfPresent(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
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

async function cleanupEmptyParents(startDirectory: string) {
  let current = startDirectory;

  while (current !== POSTS_ROOT) {
    const relative = path.relative(POSTS_ROOT, current);
    if (relative === ".." || relative.startsWith(`..${path.sep}`)) {
      return;
    }

    const entries = await fs.readdir(current);
    if (entries.length > 0) {
      return;
    }

    await fs.rmdir(current);
    current = path.dirname(current);
  }
}
