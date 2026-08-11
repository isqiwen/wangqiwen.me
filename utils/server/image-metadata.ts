import sharp from "sharp";

const MAX_INPUT_PIXELS = 100_000_000;
const SUPPORTED_IMAGE_FORMATS = ["gif", "jpeg", "png", "svg", "webp"] as const;

export type SupportedImageFormat = (typeof SUPPORTED_IMAGE_FORMATS)[number];

export type ImageMetadata = {
  format: SupportedImageFormat;
  height: number;
  width: number;
};

export async function readImageMetadata(
  input: Buffer | string,
): Promise<ImageMetadata> {
  const metadata = await sharp(input, {
    animated: false,
    limitInputPixels: MAX_INPUT_PIXELS,
  }).metadata();

  if (
    !metadata.format ||
    !isSupportedImageFormat(metadata.format) ||
    !metadata.width ||
    !metadata.height
  ) {
    throw new Error("Unsupported image format or missing image dimensions.");
  }

  return {
    format: metadata.format,
    height: metadata.height,
    width: metadata.width,
  };
}

function isSupportedImageFormat(
  format: string,
): format is SupportedImageFormat {
  return SUPPORTED_IMAGE_FORMATS.includes(format as SupportedImageFormat);
}
