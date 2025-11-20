#!/usr/bin/env node

const { join } = require("path");
const { readdir, stat, readFile, mkdir, writeFile } = require("fs/promises");
const { execSync } = require("child_process");
const { runInNewContext } = require("vm");

const SOURCE_DIR = join(process.cwd(), "app", "(post)", "zh");
const TARGET_DIR = join(process.cwd(), "app", "(post)", "en");
const CACHE_PATH = join(process.cwd(), ".translation-cache.json");

const TRANSLATABLE_FRONTMATTER_KEYS = new Set([
  "title",
  "description",
  "summary",
  "excerpt",
  "subtitle",
]);

const TRANSLATABLE_METADATA_KEYS = new Set(["description", "summary"]);

const translationCache = new Map();
let cacheDirty = false;

async function translateText(text, options) {
  const trimmed = text.trim();
  if (!trimmed) {
    return text;
  }

  const from = options.from ?? "auto";
  const key = `${from}:${options.to}:${trimmed}`;
  if (translationCache.has(key)) {
    return translationCache.get(key);
  }

  const params = new URLSearchParams({
    client: "gtx",
    sl: from,
    tl: options.to,
    dt: "t",
    q: trimmed,
  });

  const endpoint = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Translation request failed: ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      throw new Error("Unexpected translation payload");
    }

    const segments = payload[0];
    const translated = segments.map(segment => segment[0]).join("").trim();
    const normalized = translated.length > 0 ? translated : text;
    translationCache.set(key, normalized);
    cacheDirty = true;
    return normalized;
  } catch {
    return text;
  }
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  await loadTranslationCache();

  if (options.changed) {
    const changedTargets = detectChangedPosts();
    for (const target of changedTargets) {
      options.postTargets.add(target);
    }
  }

  const years =
    options.years.size > 0 ? Array.from(options.years) : await safeReadDir(SOURCE_DIR);

  let created = 0;
  let skipped = 0;

  for (const year of years) {
    const sourceYearDir = join(SOURCE_DIR, year);
    const targetYearDir = join(TARGET_DIR, year);

    if (!(await isDirectory(sourceYearDir))) {
      continue;
    }

    const posts = await safeReadDir(sourceYearDir);
    for (const slug of posts) {
      if (!shouldProcessPost(year, slug, options)) {
        continue;
      }

      const sourcePostDir = join(sourceYearDir, slug);
      const sourcePagePath = join(sourcePostDir, "page.mdx");

      if (!(await isDirectory(sourcePostDir))) {
        continue;
      }

      if (!(await fileExists(sourcePagePath))) {
        continue;
      }

      const targetPostDir = join(targetYearDir, slug);
      const targetPagePath = join(targetPostDir, "page.mdx");

      console.log(`Processing: ${sourcePagePath}`);

      if (!options.force && (await fileExists(targetPagePath))) {
        skipped += 1;
        continue;
      }

      const sourceContent = await readFile(sourcePagePath, "utf8");
      const translated = await buildEnglishDocument(sourceContent);

      if (!options.dryRun) {
        await mkdir(targetPostDir, { recursive: true });
        await writeFile(targetPagePath, translated, "utf8");
      }

      created += 1;
    }
  }

  const action = options.dryRun ? "would create" : "created";
  console.log(`English posts ${action}: ${created}`);
  if (skipped > 0) {
    console.log(`Skipped existing posts: ${skipped}`);
  }

  await persistTranslationCache();
}

async function buildEnglishDocument(source) {
  let workingSource = source;
  const context = {};
  let frontmatterBlock = "";

  const frontmatterMatch = workingSource.match(/^---\n([\s\S]*?)\n---\n?/);
  if (frontmatterMatch) {
    const [, frontmatterBody] = frontmatterMatch;
    const frontmatterLength = frontmatterMatch[0].length;
    const translation = await translateFrontmatter(frontmatterBody, context);
    frontmatterBlock = translation.block;

    if (translation.zhTitle) {
      context.zhTitle = translation.zhTitle;
    }
    if (translation.enTitle) {
      context.enTitle = translation.enTitle;
    }

    workingSource = workingSource.slice(frontmatterLength);
  }

  const metadataExtraction = extractMetadataBlock(workingSource);
  let metadataBlock = "";

  if (metadataExtraction.literal) {
    const translation = await translateMetadata(metadataExtraction.literal, context);
    metadataBlock = translation.block;

    if (translation.zhTitle) {
      context.zhTitle = translation.zhTitle;
    }
    if (translation.enTitle) {
      context.enTitle = translation.enTitle;
    }
  }

  const body = await translateBody(metadataExtraction.body);

  let output = "";

  if (frontmatterBlock) {
    output += ensureTrailingDoubleNewline(frontmatterBlock);
  }

  output += metadataExtraction.prefix;

  if (metadataBlock) {
    if (!output.endsWith("\n") && output.length > 0) {
      output += "\n";
    }
    output += ensureTrailingNewline(metadataBlock);
  }

  if (!output.endsWith("\n") && output.length > 0 && body.length > 0) {
    output += "\n";
  }

  output += body;

  if (!output.endsWith("\n")) {
    output += "\n";
  }

  return output;
}

async function translateFrontmatter(body, context) {
  const data = parseFrontmatter(body);
  if (!data) {
    return { block: `---\n${body}\n---\n\n` };
  }

  const orderedEntries = Object.entries(data);
  const zhTitle = data.zhTitle ?? data.title ?? context.zhTitle;
  let enTitle = context.enTitle;

  if (data.title) {
    enTitle = await translateText(data.title, { to: "en" });
  } else if (zhTitle && !enTitle) {
    enTitle = await translateText(zhTitle, { to: "en" });
  }

  const translated = {};

  for (const [key, value] of orderedEntries) {
    if (value === undefined) continue;

    if (key === "title" && enTitle) {
      translated.title = enTitle;
      continue;
    }

    if (key === "zhTitle") {
      translated.zhTitle = value;
      continue;
    }

    if (TRANSLATABLE_FRONTMATTER_KEYS.has(key)) {
      translated[key] = await translateText(value, { to: "en" });
      continue;
    }

    translated[key] = value;
  }

  if (zhTitle && !translated.zhTitle) {
    translated.zhTitle = zhTitle;
  }

  if (enTitle && !translated.title) {
    translated.title = enTitle;
  }

  const block = formatFrontmatter(translated);

  return {
    block,
    zhTitle,
    enTitle,
  };
}

async function translateMetadata(literal, context) {
  let metadata;

  try {
    metadata = runInNewContext(`(${literal})`);
  } catch {
    return { block: `export const metadata = ${literal};\n`, zhTitle: context.zhTitle };
  }

  if (!metadata || typeof metadata !== "object") {
    return { block: `export const metadata = ${literal};\n`, zhTitle: context.zhTitle };
  }

  const record = metadata;
  let zhTitle = typeof record.zhTitle === "string" ? record.zhTitle : context.zhTitle;
  const titleValue = getTitleValue(record.title);
  let enTitle = context.enTitle;

  const titleSource = zhTitle ?? titleValue;
  if (titleSource) {
    enTitle = await translateText(titleSource, { to: "en" });
  }

  const translated = { ...record };

  if (zhTitle) {
    translated.zhTitle = zhTitle;
  }

  if (enTitle) {
    if (
      record.title &&
      typeof record.title === "object" &&
      record.title !== null &&
      !Array.isArray(record.title)
    ) {
      translated.title = { ...record.title, default: enTitle };
    } else {
      translated.title = enTitle;
    }
  }

  for (const key of TRANSLATABLE_METADATA_KEYS) {
    const value = translated[key];
    if (typeof value === "string") {
      translated[key] = await translateText(value, { to: "en" });
    }
  }

  const block = `export const metadata = ${formatJsObject(translated)};\n`;

  return {
    block,
    zhTitle,
    enTitle,
  };
}

function getTitleValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (typeof value.default === "string") {
      return value.default;
    }
  }

  return undefined;
}

function extractMetadataBlock(source) {
  const keyword = "export const metadata";
  const index = source.indexOf(keyword);

  if (index === -1) {
    return {
      prefix: "",
      literal: undefined,
      body: source,
    };
  }

  const literal = extractObjectLiteral(source, index);
  if (!literal) {
    return {
      prefix: "",
      literal: undefined,
      body: source,
    };
  }

  const literalStart = source.indexOf("{", index);
  const literalEnd = literalStart + literal.length;
  let end = literalEnd;

  while (end < source.length && /\s/.test(source[end])) {
    end += 1;
  }

  if (source[end] === ";") {
    end += 1;
  }

  const prefix = source.slice(0, index);
  const body = source.slice(end);

  return {
    prefix,
    literal,
    body,
  };
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

function formatFrontmatter(data) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return "";
  }

  const lines = entries.map(([key, value]) => `${key}: ${quoteYaml(value ?? "")}`);
  return `---\n${lines.join("\n")}\n---\n\n`;
}

function quoteYaml(value) {
  const escaped = value.replace(/"/g, '\\"');
  return `"${escaped}"`;
}

async function translateBody(body) {
  const lines = body.split(/\r?\n/);
  const translatedLines = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      translatedLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      translatedLines.push(line);
      continue;
    }

    if (trimmed === "") {
      translatedLines.push(line);
      continue;
    }

    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export ") ||
      trimmed.startsWith("const ") ||
      trimmed.startsWith("let ") ||
      trimmed.startsWith("function ") ||
      trimmed.startsWith("type ") ||
      trimmed.startsWith("interface ")
    ) {
      translatedLines.push(line);
      continue;
    }

    if (trimmed.startsWith("<") || trimmed.startsWith("{")) {
      translatedLines.push(line);
      continue;
    }

    if (trimmed.includes("|")) {
      translatedLines.push(line);
      continue;
    }

    if (line.includes("`")) {
      translatedLines.push(line);
      continue;
    }

    const headingMatch = line.match(/^(\s*#{1,6}\s+)(.*)$/);
    if (headingMatch) {
      const [, prefix, content] = headingMatch;
      const translated = await translateText(content, { to: "en" });
      translatedLines.push(`${prefix}${translated}`);
      continue;
    }

    const listMatch = line.match(/^(\s*[-*+]\s+)(.*)$/);
    if (listMatch) {
      const [, prefix, content] = listMatch;
      const translated = await translateText(content, { to: "en" });
      translatedLines.push(`${prefix}${translated}`);
      continue;
    }

    const orderedMatch = line.match(/^(\s*\d+\.\s+)(.*)$/);
    if (orderedMatch) {
      const [, prefix, content] = orderedMatch;
      const translated = await translateText(content, { to: "en" });
      translatedLines.push(`${prefix}${translated}`);
      continue;
    }

    const quoteMatch = line.match(/^(\s*>\s?)(.*)$/);
    if (quoteMatch) {
      const [, prefix, content] = quoteMatch;
      const translated = await translateText(content, { to: "en" });
      translatedLines.push(`${prefix}${translated}`);
      continue;
    }

    const imageMatch = line.match(/^(\s*!\[)(.*?)(\]\(.*\))$/);
    if (imageMatch) {
      const [, prefix, alt, suffix] = imageMatch;
      const translated = await translateText(alt, { to: "en" });
      translatedLines.push(`${prefix}${translated}${suffix}`);
      continue;
    }

    if (line.includes("[")) {
      translatedLines.push(line);
      continue;
    }

    const leading = line.match(/^\s*/)?.[0] ?? "";
    const translated = await translateText(trimmed, { to: "en" });
    translatedLines.push(`${leading}${translated}`);
  }

  return translatedLines.join("\n");
}

function parseFrontmatter(body) {
  const lines = body.split(/\r?\n/);
  const data = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key) continue;

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return data;
}

function formatJsObject(value) {
  const json = JSON.stringify(value, null, 2);
  return json.replace(/"([^"\\]+)":/g, "$1:");
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

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function parseCliOptions(args) {
  let force = false;
  let dryRun = false;
  let changed = false;
  const years = new Set();
  const slugs = new Set();
  const postTargets = new Set();

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--changed") {
      changed = true;
      continue;
    }

    if (arg === "--year" && args[i + 1]) {
      years.add(args[i + 1]);
      i += 1;
      continue;
    }

    if (arg.startsWith("--year=")) {
      years.add(arg.slice(7));
      continue;
    }

    if (arg === "--slug" && args[i + 1]) {
      slugs.add(args[i + 1]);
      i += 1;
      continue;
    }

    if (arg.startsWith("--slug=")) {
      slugs.add(arg.slice(7));
      continue;
    }

    if (arg === "--post" && args[i + 1]) {
      const target = normalizePostTarget(args[i + 1]);
      if (target) {
        postTargets.add(target);
      }
      i += 1;
      continue;
    }

    if (arg.startsWith("--post=")) {
      const target = normalizePostTarget(arg.slice(7));
      if (target) {
        postTargets.add(target);
      }
    }
  }

  return { force, dryRun, years, slugs, changed, postTargets };
}

function normalizePostTarget(value) {
  const [year, slug] = value.split("/");
  if (year && slug) {
    return `${year}/${slug}`;
  }
  return null;
}

function shouldProcessPost(year, slug, options) {
  if (options.postTargets.size > 0 && !options.postTargets.has(`${year}/${slug}`)) {
    return false;
  }

  if (options.years.size > 0 && !options.years.has(year)) {
    return false;
  }

  if (options.slugs.size > 0 && !options.slugs.has(slug)) {
    return false;
  }

  return true;
}

function detectChangedPosts() {
  try {
    const output = execSync("git status --porcelain app/(post)/zh", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const matches = output.matchAll(/app\/\(post\)\/zh\/(\d{4})\/([^/]+)\/page\.mdx/g);
    const targets = new Set();
    for (const match of matches) {
      targets.add(`${match[1]}/${match[2]}`);
    }
    return targets;
  } catch {
    return new Set();
  }
}

function ensureTrailingNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function ensureTrailingDoubleNewline(value) {
  const withNewline = ensureTrailingNewline(value);
  return withNewline.endsWith("\n\n") ? withNewline : `${withNewline}\n`;
}

async function loadTranslationCache() {
  try {
    const file = await readFile(CACHE_PATH, "utf8");
    const data = JSON.parse(file);
    for (const [key, value] of Object.entries(data)) {
      translationCache.set(key, value);
    }
  } catch {
    // ignore missing cache
  }
}

async function persistTranslationCache() {
  if (!cacheDirty) return;
  const payload = JSON.stringify(Object.fromEntries(translationCache), null, 2);
  await writeFile(CACHE_PATH, payload, "utf8");
  cacheDirty = false;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
