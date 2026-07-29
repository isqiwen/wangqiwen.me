import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sizeOf from "image-size";
import { requireLocalEditor } from "@/utils/server/local-editor";
import { resolvePathInside } from "@/utils/server/path-safety";
import {
  createEditorJsonError,
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROOT = process.cwd();
const IMAGES_ROOT = path.join(ROOT, "public", "images");
const NO_STORE = { "Cache-Control": "no-store" };
const MAX_ASSETS_PER_FOLDER = 500;

type EditorAsset = {
  name: string;
  path: string;
  size: number;
  updatedAt: number;
  width: number | null;
  height: number | null;
};

export async function GET(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "list-assets",
    limit: 120,
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
    const { searchParams } = new URL(req.url);
    const id = normalizeId(searchParams.get("id") ?? "");
    const assets = await listAssets(id);
    logEditorInfo("list-assets", "Loaded asset list.", { id, count: assets.length });
    return NextResponse.json({ id, assets }, { headers: NO_STORE });
  } catch (error) {
    return createEditorJsonError("list-assets", "failed to list assets", 500, error);
  }
}

export async function DELETE(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "delete-asset",
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
    const { path: publicPath } = await req.json();

    if (!publicPath || typeof publicPath !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400, headers: NO_STORE });
    }

    const absolute = resolveAssetPath(publicPath);
    await fs.rm(absolute, { force: true });
    await cleanupEmptyParents(path.dirname(absolute));
    logEditorInfo("delete-asset", "Deleted image asset.", { path: publicPath });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
    }

    return createEditorJsonError("delete-asset", "failed to delete asset", 500, error);
  }
}

async function listAssets(id: string): Promise<EditorAsset[]> {
  const targetDir = resolvePathInside(IMAGES_ROOT, id);

  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter(entry => entry.isFile())
        .sort((left, right) => right.name.localeCompare(left.name))
        .slice(0, MAX_ASSETS_PER_FOLDER)
        .map(async entry => {
          const absolute = path.join(targetDir, entry.name);
          const stats = await fs.stat(absolute);
          let width: number | null = null;
          let height: number | null = null;

          try {
            const dimensions = sizeOf(absolute);
            width = dimensions.width ?? null;
            height = dimensions.height ?? null;
          } catch {
            width = null;
            height = null;
          }

          return {
            name: entry.name,
            path: `/images/${id}/${entry.name}`,
            size: stats.size,
            updatedAt: stats.mtimeMs,
            width,
            height,
          } satisfies EditorAsset;
        }),
    );

    files.sort((a, b) => b.updatedAt - a.updatedAt);
    return files;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function resolveAssetPath(publicPath: string) {
  const normalized = publicPath.replace(/\\/g, "/");
  const match = normalized.match(
    /^\/images\/([a-z0-9_-]+)\/([a-zA-Z0-9][a-zA-Z0-9._-]*)$/,
  );
  if (!match) {
    throw new Error("Invalid path");
  }

  const relative = `${match[1]}/${match[2]}`;
  return resolvePathInside(IMAGES_ROOT, relative);
}

async function cleanupEmptyParents(startDir: string) {
  let current = startDir;

  while (current !== IMAGES_ROOT) {
    const relative = path.relative(IMAGES_ROOT, current);
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

function normalizeId(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "misc";
}
