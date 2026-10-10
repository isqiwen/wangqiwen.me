import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { editorRoute, logEditorInfo } from "@/utils/server/editor-api";
import { readImageMetadata } from "@/utils/server/image-metadata";
import { resolvePathInside } from "@/utils/server/path-safety";
import { removeEmptyParents } from "@/utils/server/post-files";
import { toAssetFolderId } from "@/utils/shared/post-fields";

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

export const GET = editorRoute(
  {
    action: "list-assets",
    limit: 120,
    failureMessage: "failed to list assets",
  },
  async req => {
    const { searchParams } = new URL(req.url);
    const id = toAssetFolderId(searchParams.get("id") ?? "");
    const assets = await listAssets(id);
    logEditorInfo("list-assets", "Loaded asset list.", {
      id,
      count: assets.length,
    });
    return NextResponse.json({ id, assets }, { headers: NO_STORE });
  }
);

export const DELETE = editorRoute(
  {
    action: "delete-asset",
    limit: 30,
    failureMessage: "failed to delete asset",
    missingFileIsNotFound: true,
  },
  async req => {
    const { path: publicPath } = await req.json();

    if (!publicPath || typeof publicPath !== "string") {
      return NextResponse.json(
        { error: "path is required" },
        { status: 400, headers: NO_STORE }
      );
    }

    const absolute = resolveAssetPath(publicPath);
    await fs.rm(absolute, { force: true });
    await removeEmptyParents(path.dirname(absolute), IMAGES_ROOT);
    logEditorInfo("delete-asset", "Deleted image asset.", { path: publicPath });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }
);

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
            const dimensions = await readImageMetadata(absolute);
            width = dimensions.width;
            height = dimensions.height;
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
        })
    );

    files.sort((a, b) => b.updatedAt - a.updatedAt);
    return files;
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function resolveAssetPath(publicPath: string) {
  const normalized = publicPath.replace(/\\/g, "/");
  const match = normalized.match(
    /^\/images\/([a-z0-9_-]+)\/([a-zA-Z0-9][a-zA-Z0-9._-]*)$/
  );
  if (!match) {
    throw new Error("Invalid path");
  }

  const relative = `${match[1]}/${match[2]}`;
  return resolvePathInside(IMAGES_ROOT, relative);
}
