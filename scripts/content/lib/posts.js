const { join } = require("path");
const { readdir, readFile, writeFile, stat, mkdir } = require("fs/promises");

const POSTS_ROOT = join(process.cwd(), "app", "(post)");
const POSTS_MANIFEST_DIR = join(process.cwd(), "posts");
const POSTS_MANIFEST_PATH = join(POSTS_MANIFEST_DIR, "manifest.json");

async function collectPosts() {
  const entries = new Map();

  const years = await safeReadDir(POSTS_ROOT);
  for (const year of years) {
    const yearDir = join(POSTS_ROOT, year);
    if (!/^\d{4}$/.test(year) || !(await isDirectory(yearDir))) continue;

    const ids = await safeReadDir(yearDir);
    for (const id of ids) {
      const postDir = join(yearDir, id);
      if (!(await isDirectory(postDir))) continue;

      const articlePath = join(postDir, "article.mdx");
      const source = await readFileSafe(articlePath);
      if (!source) continue;

      const key = `${year}/${id}`;

      entries.set(key, {
        year,
        id,
        path: articlePath,
        source,
        metadata: parseMetadata(source),
        frontmatter: parseFrontmatter(source),
      });
    }
  }

  return entries;
}

function buildNormalizedMetadata(data, defaults) {
  const title =
    normalizeOptionalString(data.metadata.title) ||
    normalizeOptionalString(data.frontmatter.title) ||
    toTitle(defaults.id);

  const description = getDescription(data);
  const summary =
    normalizeOptionalString(data.metadata.summary) ||
    normalizeOptionalString(data.frontmatter.summary) ||
    "";
  const series =
    normalizeOptionalString(data.metadata.series) ||
    normalizeOptionalString(data.frontmatter.series) ||
    "";
  const seriesOrder =
    normalizePositiveInteger(data.metadata.seriesOrder) ||
    normalizePositiveInteger(data.frontmatter.seriesOrder) ||
    0;
  const updatedAt = normalizeDateString(
    data.metadata.updatedAt || data.frontmatter.updatedAt
  );
  const tags = normalizeTags(data.metadata.tags ?? data.frontmatter.tags);
  const status = normalizeStatus(
    data.metadata.status ?? data.frontmatter.status,
    data.metadata.draft ?? data.frontmatter.draft,
    data.metadata.archived ?? data.frontmatter.archived
  );
  const readingTimeMinutes =
    normalizePositiveInteger(data.metadata.readingTimeMinutes) ||
    estimateReadingTimeMinutes(getBodySource(data.source));

  const metadata = {
    title,
    description,
    publishedAt: defaults.publishedAt,
    id: defaults.postId,
    status,
    tags,
    readingTimeMinutes,
  };

  if (summary) {
    metadata.summary = summary;
  }

  if (series) {
    metadata.series = series;
    metadata.seriesOrder = seriesOrder;
  }

  if (updatedAt) {
    metadata.updatedAt = updatedAt;
  }

  return metadata;
}

function replaceMetadataBlock(source, metadataObject) {
  const keyword = "export const metadata";
  const index = source.indexOf(keyword);
  if (index === -1) return null;

  const literal = extractObjectLiteral(source, index);
  if (!literal) return null;

  const literalStart = source.indexOf("{", index);
  let end = literalStart + literal.length;

  while (end < source.length) {
    const char = source[end];
    if (char === ";" || /\s/.test(char)) {
      end += 1;
      continue;
    }
    break;
  }

  const newBlock = `export const metadata = ${JSON.stringify(
    metadataObject,
    null,
    2
  )};\n\n`;
  return source.slice(0, index) + newBlock + source.slice(end);
}

async function writeManifest(manifest) {
  await mkdir(POSTS_MANIFEST_DIR, { recursive: true });
  await writeFile(POSTS_MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function parseMetadata(source) {
  const keyword = "export const metadata";
  const index = source.indexOf(keyword);
  if (index === -1) return {};

  const literal = extractObjectLiteral(source, index);
  if (!literal) return {};

  try {
    const metadata = JSON.parse(literal);
    if (!metadata || typeof metadata !== "object") {
      return {};
    }
    return metadata;
  } catch {
    return {};
  }
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const [, body] = match;
  const data = {};
  const lines = body.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return data;
}

function extractObjectLiteral(source, exportIndex) {
  const braceStart = source.indexOf("{", exportIndex);
  if (braceStart === -1) {
    return null;
  }

  let depth = 0;
  let inString = null;
  let escaped = false;

  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      inString = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart, i + 1);
      }
    }
  }

  return null;
}

function getDescription(data) {
  return (
    normalizeOptionalString(data.metadata.description) ||
    normalizeOptionalString(data.metadata.summary) ||
    normalizeOptionalString(data.metadata.excerpt) ||
    normalizeOptionalString(data.frontmatter.description) ||
    normalizeOptionalString(data.frontmatter.summary) ||
    normalizeOptionalString(data.frontmatter.excerpt) ||
    ""
  );
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeDateString(value) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return "";
  }

  return Number.isNaN(new Date(normalized).getTime()) ? "" : normalized;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

function normalizeStatus(value, legacyDraft, legacyArchived) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "draft" ||
      normalized === "published" ||
      normalized === "archived"
    ) {
      return normalized;
    }
  }

  if (normalizeBoolean(legacyArchived)) {
    return "archived";
  }

  if (normalizeBoolean(value) || normalizeBoolean(legacyDraft)) {
    return "draft";
  }

  return "published";
}

function normalizeTags(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : [];

  return Array.from(
    new Set(
      source
        .map(item => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    )
  );
}

function normalizePositiveInteger(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  return 0;
}

function getBodySource(source) {
  let output = source.replace(/^---\n[\s\S]*?\n---\s*/u, "");
  output = output.replace(
    /export const metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*/u,
    ""
  );
  return output;
}

function estimateReadingTimeMinutes(source) {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~[\](){}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const latinWords = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) ?? [];
  const cjkChars = text.match(/[\u3400-\u9fff]/g) ?? [];
  const totalUnits = latinWords.length + cjkChars.length;

  if (totalUnits === 0) {
    return 1;
  }

  // Use a simple unit-based estimate so the script stays stable across
  // different kinds of technical writing.
  return Math.max(1, Math.ceil(totalUnits / 220));
}

async function safeReadDir(path) {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}

async function isDirectory(path) {
  try {
    const info = await stat(path);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function readFileSafe(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

function toTitle(slug) {
  return slug
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

module.exports = {
  POSTS_ROOT,
  POSTS_MANIFEST_PATH,
  collectPosts,
  buildNormalizedMetadata,
  replaceMetadataBlock,
  writeManifest,
  parseMetadata,
  parseFrontmatter,
  normalizeTags,
  normalizeBoolean,
  normalizePositiveInteger,
  normalizeStatus,
};
