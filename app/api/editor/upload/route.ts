import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import sizeOf from "image-size";
import { assertPathInside } from "@/utils/server/path-safety";
import { requireLocalEditor } from "@/utils/server/local-editor";
import { logger } from "@/utils/logger";
import { enforceEditorRateLimit, logEditorInfo } from "@/utils/server/editor-api";

export const runtime = "nodejs";

const ROOT = process.cwd();
const IMAGES_ROOT = path.join(ROOT, "public", "images");
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const DETECTED_IMAGE_TYPES: Record<string, { mime: string; extension: string }> = {
  png: { mime: "image/png", extension: ".png" },
  jpg: { mime: "image/jpeg", extension: ".jpg" },
  webp: { mime: "image/webp", extension: ".webp" },
  gif: { mime: "image/gif", extension: ".gif" },
};
const MAX_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_PIXELS = 100_000_000;

export async function POST(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "upload-asset",
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
    let dimensions;
    try {
      dimensions = sizeOf(buffer);
    } catch {
      return NextResponse.json({ error: "invalid image data" }, { status: 415 });
    }

    const detected = dimensions.type
      ? DETECTED_IMAGE_TYPES[dimensions.type]
      : undefined;
    const normalizedDeclaredType = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (!detected || detected.mime !== normalizedDeclaredType) {
      return NextResponse.json(
        { error: "file content does not match its declared image type" },
        { status: 415 },
      );
    }

    const width = dimensions.width ?? null;
    const height = dimensions.height ?? null;
    if (
      width === null ||
      height === null ||
      width <= 0 ||
      height <= 0 ||
      width * height > MAX_PIXELS
    ) {
      return NextResponse.json(
        { error: "image dimensions are invalid or too large" },
        { status: 413 },
      );
    }

    const filename = buildFilename(detected.extension);
    const targetDir = path.join(IMAGES_ROOT, safeId);
    assertPathInside(IMAGES_ROOT, targetDir);
    const targetPath = path.join(targetDir, filename);
    assertPathInside(IMAGES_ROOT, targetPath);

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, buffer, { flag: "wx", mode: 0o644 });
    logEditorInfo("upload-asset", "Uploaded image asset.", {
      path: `/images/${safeId}/${filename}`,
      bytes: buffer.byteLength,
    });

    return NextResponse.json({
      path: `/images/${safeId}/${filename}`,
      width,
      height,
    });
  } catch (error) {
    logger.error("[api/editor/upload] failed to upload image", error);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}

function buildFilename(ext: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

function normalizeId(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "misc";
}
