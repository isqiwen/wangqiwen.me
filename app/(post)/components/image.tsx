import { join } from "path";
import { readFile } from "fs/promises";
import { Caption } from "./caption";
import NextImage from "next/image";
import { readImageMetadata } from "@/utils/server/image-metadata";
import { resolvePathInside } from "@/utils/server/path-safety";
import type { ReactNode } from "react";

const MAX_REMOTE_IMAGE_BYTES = 20 * 1024 * 1024;
const REMOTE_IMAGE_HOSTS = new Set(["pbs.twimg.com", "abs.twimg.com"]);

function formatImageFetchLabel(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

async function fetchImageBuffer(url: string) {
  const parsedUrl = new URL(url);
  if (
    parsedUrl.protocol !== "https:" ||
    !REMOTE_IMAGE_HOSTS.has(parsedUrl.hostname)
  ) {
    throw new Error(`Remote image host is not allowed: ${parsedUrl.hostname}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(parsedUrl, {
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image ${formatImageFetchLabel(url)}: ${
          response.status
        }`
      );
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error("Remote image exceeds the 20 MB limit.");
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Remote image response has no body.");
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_REMOTE_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error("Remote image exceeds the 20 MB limit.");
      }
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timeout);
  }
}

export async function Image({
  src,
  alt,
  title,
  width = null,
  height = null,
  caption,
}: {
  src: string;
  alt: string;
  title?: string;
  width?: number | null;
  height?: number | null;
  /** Visible explanatory text. Alt text is intentionally not reused as a caption. */
  caption?: ReactNode;
}) {
  const isDataImage = src.startsWith("data:");
  if (isDataImage) {
    /* eslint-disable @next/next/no-img-element */
    return <img src={src} alt={alt} title={title} />;
  } else {
    if (width === null || height === null) {
      let imageBuffer: Buffer | null = null;

      if (src.startsWith("http")) {
        imageBuffer = await fetchImageBuffer(src);
      } else {
        const publicRoot = join(process.cwd(), "public");
        const localImagePath = resolvePathInside(
          publicRoot,
          src.startsWith("/") ? src.slice(1) : src
        );
        imageBuffer = await readFile(localImagePath);
      }
      const dimensions = await readImageMetadata(imageBuffer);
      width = dimensions.width;
      height = dimensions.height;
    }

    return (
      <span className="my-5 flex flex-col items-center">
        <NextImage
          width={Math.max(1, Math.round(width))}
          height={Math.max(1, Math.round(height))}
          alt={alt}
          title={title}
          src={src}
          unoptimized={src.endsWith(".gif")}
        />

        {caption ? <Caption>{caption}</Caption> : null}
      </span>
    );
  }
}
