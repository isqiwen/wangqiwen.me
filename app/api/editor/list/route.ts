import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireEditorAccess } from "@/utils/server/editor-auth";
import {
  createEditorJsonError,
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "app", "(post)");
const ALLOWED_SUBDIRS = new Set(["zh", "en"]);
const METADATA_PATTERN = /export const metadata =\s*\{([\s\S]*?)\};?/;

type EditorFileEntry = {
  path: string;
  label: string;
  status: "draft" | "published" | "archived";
  updatedAt: number;
};

export async function GET(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "list-files",
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

  try {
    const entries = await collectFiles();
    logEditorInfo("list-files", "Loaded editor file list.", { count: entries.length });
    return NextResponse.json({ files: entries }, { headers: NO_STORE });
  } catch (error) {
    return createEditorJsonError("list-files", "failed to list files", 500, error);
  }
}

async function collectFiles() {
  const result: EditorFileEntry[] = [];

  for (const locale of ALLOWED_SUBDIRS) {
    const localeDir = path.join(BASE_DIR, locale);
    const exists = await safeExists(localeDir);
    if (!exists) continue;
    await walk(localeDir, result);
  }

  return result;
}

async function walk(dir: string, bucket: EditorFileEntry[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const enriched = await Promise.all(
    entries.map(async entry => {
      const abs = path.join(dir, entry.name);
      const stats = await fs.stat(abs);
      return { entry, abs, mtime: stats.mtimeMs };
    }),
  );

  enriched.sort((a, b) => {
    const aIsDir = a.entry.isDirectory();
    const bIsDir = b.entry.isDirectory();

    // 1) locale/level: year folders named as digits, sort by year desc
    const aYear = aIsDir && /^\d{4}$/.test(a.entry.name) ? Number(a.entry.name) : null;
    const bYear = bIsDir && /^\d{4}$/.test(b.entry.name) ? Number(b.entry.name) : null;
    if (aYear !== null || bYear !== null) {
      if (aYear === null) return 1;
      if (bYear === null) return -1;
      return bYear - aYear;
    }

    // 2) directories (slug) by mtime desc
    if (aIsDir && bIsDir) {
      return b.mtime - a.mtime;
    }

    // 3) directories before files
    if (aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1;
    }

    // 4) files by mtime desc
    return b.mtime - a.mtime;
  });

  for (const { entry, abs, mtime } of enriched) {
    if (entry.isDirectory()) {
      await walk(abs, bucket);
    } else if (entry.isFile() && entry.name === "page.mdx") {
      const rel = path.relative(ROOT, abs);
      const normalizedRel = rel.replace(/\\/g, "/");
      const label = normalizedRel.replace(/^app\/\(post\)\//, "");
      const content = await fs.readFile(abs, "utf8");
      const metadata = extractMetadata(content);

      bucket.push({
        path: normalizedRel,
        label,
        status: normalizeStatus(metadata?.status, metadata?.draft, metadata?.archived),
        updatedAt: mtime,
      });
    }
  }
}

function extractMetadata(content: string) {
  const match = content.match(METADATA_PATTERN);
  if (!match) {
    return null;
  }

  try {
    // Reuse the same loose metadata shape as the editor. Files are trusted local MDX.
    // eslint-disable-next-line no-new-func
    return new Function(`return ({${match[1]}});`)() as Partial<{
      status: "draft" | "published" | "archived";
      draft: boolean;
      archived: boolean;
    }>;
  } catch {
    return null;
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

async function safeExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}
