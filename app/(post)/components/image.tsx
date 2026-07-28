import sizeOf from "image-size";
import { join } from "path";
import { readFile } from "fs/promises";
import { Caption } from "./caption";
import NextImage from "next/image";
import { resolvePathInside } from "@/utils/server/path-safety";

const MAX_REMOTE_IMAGE_BYTES = 20 * 1024 * 1024;
const REMOTE_IMAGE_HOSTS = new Set([
  "pbs.twimg.com",
  "abs.twimg.com",
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
]);

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
  const internalImageHost = process.env.VERCEL_URL?.trim().toLowerCase() ?? "";
  if (
    parsedUrl.protocol !== "https:" ||
    (!REMOTE_IMAGE_HOSTS.has(parsedUrl.hostname) &&
      parsedUrl.hostname.toLowerCase() !== internalImageHost)
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
        `Failed to fetch image ${formatImageFetchLabel(url)}: ${response.status}`,
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

function buildInternalImageUrl(src: string) {
  const url = new URL(src, `https://${process.env.VERCEL_URL}`);
  const imageBypassSecret = process.env.IMAGE_BOT_BYPASS_SECRET;
  const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  if (imageBypassSecret) {
    url.searchParams.set("image_bot_bypass", imageBypassSecret);
  }

  if (vercelBypassSecret) {
    url.searchParams.set("x-vercel-protection-bypass", vercelBypassSecret);
  }

  return url.toString();
}

export async function Image({
  src,
  alt: originalAlt,
  width = null,
  height = null,
}: {
  src: string;
  alt?: string;
  width: number | null;
  height: number | null;
}) {
  const isDataImage = src.startsWith("data:");
  if (isDataImage) {
    /* eslint-disable @next/next/no-img-element */
    return <img src={src} alt={originalAlt ?? ""} />;
  } else {
    if (width === null || height === null) {
      let imageBuffer: Buffer | null = null;

      if (src.startsWith("http")) {
        imageBuffer = await fetchImageBuffer(src);
      } else {
        if (
          !process.env.CI &&
          process.env.VERCEL_URL &&
          process.env.NODE_ENV === "production"
        ) {
          imageBuffer = await fetchImageBuffer(buildInternalImageUrl(src));
        } else {
          const publicRoot = join(process.cwd(), "public");
          const localImagePath = resolvePathInside(
            publicRoot,
            src.startsWith("/") ? src.slice(1) : src,
          );
          imageBuffer = await readFile(localImagePath);
        }
      }
      const computedSize = sizeOf(imageBuffer);
      if (
        computedSize.width === undefined ||
        computedSize.height === undefined
      ) {
        throw new Error("Could not compute image size");
      }
      width = computedSize.width;
      height = computedSize.height;
    }

    let alt: string | null = null;
    let dividedBy = 100;

    if ("string" === typeof originalAlt) {
      const match = originalAlt.match(/(.*) (\[(\d+)%\])?$/);
      if (match != null) {
        alt = match[1];
        dividedBy = match[3] ? parseInt(match[3]) : 100;
      }
    } else {
      alt = originalAlt ?? null;
    }

    const factor = dividedBy / 100;

    return (
      <span className="my-5 flex flex-col items-center">
        <NextImage
          width={width * factor}
          height={height * factor}
          alt={alt ?? ""}
          src={src}
          unoptimized={src.endsWith(".gif")}
        />

        {alt && <Caption>{alt}</Caption>}
      </span>
    );
  }
}
