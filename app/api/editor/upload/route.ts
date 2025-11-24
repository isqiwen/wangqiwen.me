import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sizeOf from "image-size";

export const runtime = "nodejs";

const ROOT = process.cwd();
const IMAGES_ROOT = path.join(ROOT, "public", "images");
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const EXT_FALLBACK: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const idInput = formData.get("id");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const safeId = normalizeId(typeof idInput === "string" ? idInput : "");

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "unsupported file type" }, { status: 415 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "file too large" }, { status: 413 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const ext =
      path.extname(file.name).toLowerCase() ||
      EXT_FALLBACK[file.type] ||
      ".png";
    const filename = buildFilename(ext);
    const targetDir = path.join(IMAGES_ROOT, safeId);
    assertPathInside(IMAGES_ROOT, targetDir);
    const targetPath = path.join(targetDir, filename);
    assertPathInside(IMAGES_ROOT, targetPath);

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, buffer);

    const dimensions = sizeOf(buffer);
    const width = dimensions.width ?? null;
    const height = dimensions.height ?? null;

    return NextResponse.json({
      path: `/images/${safeId}/${filename}`,
      width,
      height,
    });
  } catch (error) {
    console.error("[api/editor/upload] failed to upload image", error);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}

function buildFilename(ext: string) {
  const now = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${now}-${rand}${ext}`;
}

function normalizeId(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "misc";
}

function assertPathInside(rootDir: string, target: string) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(target);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error("Invalid path");
  }
}
