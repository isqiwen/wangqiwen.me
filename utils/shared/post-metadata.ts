import {
  estimateReadingTimeMinutes,
  normalizeDateString,
  normalizeOptionalString,
  normalizePositiveInteger,
  normalizeTags,
  type PostStatus,
} from "@/utils/shared/post-fields";

export type ExportedMetadataBlock = {
  start: number;
  end: number;
  literal: string;
};

const METADATA_EXPORT = "export const metadata";

export function findExportedMetadataBlock(source: string): ExportedMetadataBlock | null {
  const exportIndex = source.indexOf(METADATA_EXPORT);
  if (exportIndex === -1) {
    return null;
  }

  const braceStart = source.indexOf("{", exportIndex + METADATA_EXPORT.length);
  if (braceStart === -1) {
    return null;
  }

  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (let index = braceStart; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character !== "}") {
      continue;
    }

    depth -= 1;
    if (depth !== 0) {
      continue;
    }

    let end = index + 1;
    if (source[end] === ";") {
      end += 1;
    }
    while (end < source.length && /\s/.test(source[end])) {
      end += 1;
    }

    return {
      start: exportIndex,
      end,
      literal: source.slice(braceStart, index + 1),
    };
  }

  return null;
}

export function parseExportedMetadata<T extends object>(
  source: string,
): T | null {
  const block = findExportedMetadataBlock(source);
  if (!block) {
    return null;
  }

  try {
    const parsed = JSON.parse(block.literal);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export function stripExportedMetadata(source: string): string {
  const block = findExportedMetadataBlock(source);
  return block ? source.slice(0, block.start) + source.slice(block.end) : source;
}

export type NormalizedPostMetadata = {
  title: string;
  description: string;
  publishedAt: string;
  id: string;
  status: PostStatus;
  tags: string[];
  readingTimeMinutes: number;
  summary?: string;
  series?: string;
  seriesOrder?: number;
  updatedAt?: string;
};

// The canonical metadata block: trimmed values, a fixed key order and optional
// fields only when set. Call this for metadata that has passed validation.
export function normalizePostMetadata(
  metadata: Record<string, unknown>,
  source: string,
): NormalizedPostMetadata {
  const summary = normalizeOptionalString(metadata.summary);
  const series = normalizeOptionalString(metadata.series);
  const updatedAt = normalizeDateString(metadata.updatedAt);
  const normalized: NormalizedPostMetadata = {
    title: normalizeOptionalString(metadata.title),
    description: normalizeOptionalString(metadata.description),
    publishedAt: metadata.publishedAt as string,
    id: metadata.id as string,
    status: metadata.status as PostStatus,
    tags: normalizeTags(metadata.tags),
    readingTimeMinutes:
      normalizePositiveInteger(metadata.readingTimeMinutes) ||
      estimateReadingTimeMinutes(stripExportedMetadata(source)),
  };

  if (summary) {
    normalized.summary = summary;
  }

  if (series) {
    normalized.series = series;
    normalized.seriesOrder = normalizePositiveInteger(metadata.seriesOrder);
  }

  if (updatedAt) {
    normalized.updatedAt = updatedAt;
  }

  return normalized;
}

export function formatExportedMetadata(metadata: object): string {
  return `export const metadata = ${JSON.stringify(metadata, null, 2)};\n\n`;
}

export function replaceExportedMetadata(
  source: string,
  metadata: object,
): string | null {
  const block = findExportedMetadataBlock(source);
  return block
    ? source.slice(0, block.start) +
        formatExportedMetadata(metadata) +
        source.slice(block.end)
    : null;
}
