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
