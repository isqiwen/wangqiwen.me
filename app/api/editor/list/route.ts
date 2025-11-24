import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "app", "(post)");
const ALLOWED_SUBDIRS = new Set(["zh", "en"]);

export async function GET() {
  try {
    const entries = await collectFiles();
    return NextResponse.json({ files: entries });
  } catch (error) {
    return NextResponse.json({ error: "failed to list files" }, { status: 500 });
  }
}

async function collectFiles() {
  const result: Array<{ path: string; label: string }> = [];

  for (const locale of ALLOWED_SUBDIRS) {
    const localeDir = path.join(BASE_DIR, locale);
    const exists = await safeExists(localeDir);
    if (!exists) continue;
    await walk(localeDir, result);
  }

  return result;
}

async function walk(dir: string, bucket: Array<{ path: string; label: string }>) {
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

  for (const { entry, abs } of enriched) {
    if (entry.isDirectory()) {
      await walk(abs, bucket);
    } else if (entry.isFile() && entry.name === "page.mdx") {
      const rel = path.relative(ROOT, abs);
      const normalizedRel = rel.replace(/\\/g, "/");
      const label = normalizedRel.replace(/^app\/\(post\)\//, "");

      // Debug logging to trace path normalization issues (especially on Windows).
      if (label === normalizedRel) {
        console.log("[api/editor/list] skipped prefix trim", { rel, normalizedRel });
      }

      bucket.push({ path: normalizedRel, label });
    }
  }
}

async function safeExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}
