import sizeOf from "image-size";
import { join } from "path";
import { readFile } from "fs/promises";
import { Caption } from "./caption";
import NextImage from "next/image";

function formatImageFetchLabel(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

async function fetchImageBuffer(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image ${formatImageFetchLabel(url)}: ${response.status}`
    );
  }
  return Buffer.from(await response.arrayBuffer());
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
          const localImagePath = join(
            process.cwd(),
            "public",
            src.startsWith("/") ? src.slice(1) : src
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
