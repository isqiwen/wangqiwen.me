const { join } = require("path");
const { readdir, readFile, writeFile, stat, mkdir } = require("fs/promises");
const { runInNewContext } = require("vm");

const SUPPORTED_LOCALES = ["zh", "en"];
const POSTS_ROOT = join(process.cwd(), "app", "(post)");
const POSTS_MANIFEST_DIR = join(process.cwd(), "posts");
const POSTS_MANIFEST_PATH = join(POSTS_MANIFEST_DIR, "manifest.json");

async function collectPosts() {
  const entries = new Map();

  for (const locale of SUPPORTED_LOCALES) {
    const localeDir = join(POSTS_ROOT, locale);
    const years = await safeReadDir(localeDir);

    for (const year of years) {
      const yearDir = join(localeDir, year);
      if (!(await isDirectory(yearDir))) continue;

      const slugs = await safeReadDir(yearDir);
      for (const slug of slugs) {
        const postDir = join(yearDir, slug);
        if (!(await isDirectory(postDir))) continue;

        const pagePath = join(postDir, "page.mdx");
        const source = await readFileSafe(pagePath);
        if (!source) continue;

        const metadata = parseMetadata(source);
        const frontmatter = parseFrontmatter(source);
        const key = `${year}/${slug}`;

        if (!entries.has(key)) {
          entries.set(key, {
            year,
            slug,
            locales: {},
          });
        }

        entries.get(key).locales[locale] = {
          path: pagePath,
          source,
          metadata,
          frontmatter,
        };
      }
    }
  }

  return entries;
}

function getFirstValue(entryLocales, getter) {
  for (const locale of SUPPORTED_LOCALES) {
    const data = entryLocales[locale];
    if (!data) continue;
    const value = getter(data);
    if (value) return value;
  }
  return null;
}

function buildNormalizedMetadata(data, defaults) {
  const title = data.metadata.title || data.frontmatter.title || toTitle(defaults.slug);
  const description =
    data.metadata.description ||
    data.metadata.summary ||
    data.metadata.excerpt ||
    data.frontmatter.description ||
    data.frontmatter.summary ||
    data.frontmatter.excerpt;

  return {
    title,
    description: description ?? "",
    publishedAt: defaults.publishedAt,
    id: defaults.postId,
  };
}

function replaceMetadataBlock(source, metadataObject) {
  const keyword = "export const metadata";
  const index = source.indexOf(keyword);
  if (index === -1) return null;

  const literal = extractObjectLiteral(source, index);
  if (!literal) return null;

  const literalStart = source.indexOf("{", index);
  let end = literalStart + literal.length;

  while (end < source.length && /\s/.test(source[end])) {
    end += 1;
  }

  if (source[end] === ";") {
    end += 1;
  }

  if (source[end] === "\r" && source[end + 1] === "\n") {
    end += 2;
  } else if (source[end] === "\n") {
    end += 1;
  }

  const newBlock = `export const metadata = ${JSON.stringify(metadataObject, null, 2)};\n\n`;
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
    const metadata = runInNewContext(`(${literal})`);
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
  SUPPORTED_LOCALES,
  POSTS_ROOT,
  POSTS_MANIFEST_PATH,
  collectPosts,
  getFirstValue,
  buildNormalizedMetadata,
  replaceMetadataBlock,
  writeManifest,
  parseMetadata,
  parseFrontmatter,
};
