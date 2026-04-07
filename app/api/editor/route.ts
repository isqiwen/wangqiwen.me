import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolvePathInside } from "@/utils/server/path-safety";
import { requireEditorAccess } from "@/utils/server/editor-auth";
import { syncPostsMetadata } from "@/utils/server/sync-posts";
import {
  createEditorJsonError,
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };
const METADATA_PATTERN = /export const metadata =\s*\{([\s\S]*?)\};?/;

function resolveSafe(inputPath: string) {
  return resolvePathInside(process.cwd(), inputPath);
}

export async function GET(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "read-file",
    limit: 180,
    windowMs: 60 * 1000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const denied = await requireEditorAccess();
  if (denied) {
    return denied;
  }

  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path is required" }, { status: 400, headers: NO_STORE });
  }

  try {
    const absolute = resolveSafe(filePath);
    const content = await fs.readFile(absolute, "utf8");
    logEditorInfo("read-file", "Loaded editor file.", { path: filePath });
    return NextResponse.json({ content }, { headers: NO_STORE });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
    }
    return createEditorJsonError("read-file", "failed to read file", 500, error);
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

  const denied = await requireEditorAccess();
  if (denied) {
    return denied;
  }

  try {
    const { path: filePath, content } = await req.json();

    if (!filePath || typeof content !== "string") {
      return NextResponse.json(
        { error: "path and content are required" },
        { status: 400, headers: NO_STORE },
      );
    }

    const absolute = resolveSafe(filePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content, "utf8");
    await syncPostsMetadata();
    logEditorInfo("save-file", "Saved editor file and synchronized posts.", {
      path: filePath,
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return createEditorJsonError("save-file", "failed to save file", 500, error);
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

  const denied = await requireEditorAccess();
  if (denied) {
    return denied;
  }

  try {
    const { path: filePath } = await req.json();

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400, headers: NO_STORE });
    }

    const absolute = resolveSafe(filePath);
    const content = await fs.readFile(absolute, "utf8");
    const metadata = extractMetadata(content);

    if (metadata.status === "published") {
      return NextResponse.json(
        { error: "published posts must be archived before deletion" },
        { status: 409, headers: NO_STORE },
      );
    }

    await fs.rm(absolute, { force: true });
    await cleanupEmptyParents(path.dirname(absolute));
    await syncPostsMetadata();
    logEditorInfo("delete-file", "Deleted editor file and synchronized posts.", {
      path: filePath,
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
    }

    return createEditorJsonError("delete-file", "failed to delete file", 500, error);
  }
}

function extractMetadata(content: string) {
  const match = content.match(METADATA_PATTERN);
  if (!match) {
    return { status: "published" as const };
  }

  try {
    // Editor files are local trusted MDX documents.
    // eslint-disable-next-line no-new-func
    const metadata = new Function(`return ({${match[1]}});`)() as Partial<{
      status: "draft" | "published" | "archived";
      draft: boolean;
      archived: boolean;
    }>;

    return {
      status: normalizeStatus(metadata.status, metadata.draft, metadata.archived),
    };
  } catch {
    return { status: "published" as const };
  }
}

function normalizeStatus(
  value: unknown,
  legacyDraft?: unknown,
  legacyArchived?: unknown,
): "draft" | "published" | "archived" {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "draft" || normalized === "published" || normalized === "archived") {
      return normalized;
    }
  }

  if (normalizeBoolean(legacyArchived)) {
    return "archived";
  }

  if (normalizeBoolean(value) || normalizeBoolean(legacyDraft)) {
    return "draft";
  }

  return "published";
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

async function cleanupEmptyParents(startDir: string) {
  const root = path.join(process.cwd(), "app", "(post)");
  let current = startDir;

  while (current.startsWith(root) && current !== root) {
    const entries = await fs.readdir(current);
    if (entries.length > 0) {
      return;
    }

    await fs.rmdir(current);
    current = path.dirname(current);
  }
}
