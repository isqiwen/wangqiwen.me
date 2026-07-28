import redis from "./redis";
import commaNumber from "comma-number";
import { join } from "path";
import { readdir, readFile, stat } from "fs/promises";
import { logger } from "@/utils/logger";

export type PostStatus = "draft" | "published" | "archived";

export type Post = {
  id: string;
  postId: string;
  title: string;
  description: string;
  summary: string;
  series: string | null;
  date: string;
  publishedAt: string;
  updatedAt: string | null;
  status: PostStatus;
  featured: boolean;
  tags: string[];
  cover: string | null;
  readingTimeMinutes: number;
  views: number;
  viewsFormatted: string;
};

type Frontmatter = {
  title?: string;
  description?: string;
  summary?: string;
  excerpt?: string;
  series?: string;
  publishedAt?: string;
  updatedAt?: string;
  id?: string;
  status?: PostStatus | string;
  draft?: boolean | string;
  archived?: boolean | string;
  featured?: boolean | string;
  tags?: string[] | string;
  cover?: string;
  coverImage?: string;
  readingTimeMinutes?: number | string;
};

type PostMetadata = {
  id: string;
  title: string;
  description: string;
  summary: string;
  series: string | null;
  date: string;
  publishedAt: string;
  updatedAt: string | null;
  publishedAtTimestamp: number;
  postId: string;
  status: PostStatus;
  featured: boolean;
  tags: string[];
  cover: string | null;
  readingTimeMinutes: number;
};

type Manifest = {
  posts?: Array<{
    id: string;
    title: string;
    description?: string;
    summary?: string;
    series?: string | null;
    publishedAt: string;
    updatedAt?: string | null;
    status?: PostStatus | string;
    draft?: boolean;
    archived?: boolean;
    featured?: boolean;
    tags?: string[];
    cover?: string | null;
    readingTimeMinutes?: number;
    path: string;
  }>;
};

type Views = {
  [key: string]: string;
};

type GetPostsOptions = {
  includeDrafts?: boolean;
};

const POSTS_ROOT_DIR = join(process.cwd(), "app", "(post)");
const POSTS_MANIFEST_PATH = join(process.cwd(), "posts", "manifest.json");
const METADATA_CACHE_TTL_MS = 60 * 1000;

type MetadataCache = {
  timestamp: number;
  data: PostMetadata[];
};

let metadataCache: MetadataCache | null = null;
let manifestCache: { timestamp: number; data: Manifest | null } | null = null;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export const getPosts = async (options: GetPostsOptions = {}) => {
  const [metadata, allViews] = await Promise.all([loadManifestMetadata(options), loadViews()]);

  return metadata.map(post => buildPost(post, allViews));
};

export const getPostById = async (
  id: string,
  options: GetPostsOptions = {},
): Promise<Post | null> => {
  const views = await loadViews();
  const manifest = await getManifest();
  const match = manifest?.posts?.find(post => post.id === id);

  if (match) {
    const status = normalizeStatus(match.status, match.draft, match.archived);
    if (status !== "archived" && (options.includeDrafts || status !== "draft")) {
      return buildPost(
        {
          id: match.id,
          title: match.title,
          description: match.description ?? "",
          summary: match.summary ?? match.description ?? "",
          series: normalizeOptionalString(match.series) || null,
          date: DATE_FORMATTER.format(new Date(match.publishedAt)),
          publishedAt: match.publishedAt,
          updatedAt: normalizeDateString(match.updatedAt) || null,
          publishedAtTimestamp: new Date(match.publishedAt).getTime(),
          postId: match.id,
          status,
          featured: Boolean(match.featured),
          tags: normalizeTags(match.tags),
          cover: normalizeOptionalString(match.cover) || null,
          readingTimeMinutes: normalizePositiveInteger(match.readingTimeMinutes) || 1,
        },
        views,
      );
    }
  }

  const metadata = await loadPostsMetadata(options);
  const target = metadata.find(post => post.id === id);
  if (target) {
    return buildPost(target, views);
  }

  return null;
};

async function loadViews(): Promise<Views> {
  try {
    return (await redis.hgetall("views")) ?? {};
  } catch (error) {
    logger.warn("Failed to load view counts from Redis, defaulting to zeros.", error);
    return {};
  }
}

async function loadManifestMetadata(options: GetPostsOptions): Promise<PostMetadata[]> {
  const manifest = await getManifest();
  if (manifest?.posts) {
    return manifest.posts
      .map(post => {
        const status = normalizeStatus(post.status, post.draft, post.archived);
        return { ...post, status };
      })
      .filter(post => post.status !== "archived")
      .filter(post => options.includeDrafts || post.status !== "draft")
      .map(post => ({
        id: post.id,
        title: post.title,
        description: post.description ?? "",
        summary: post.summary ?? post.description ?? "",
        series: normalizeOptionalString(post.series) || null,
        date: DATE_FORMATTER.format(new Date(post.publishedAt)),
        publishedAt: post.publishedAt,
        updatedAt: normalizeDateString(post.updatedAt) || null,
        publishedAtTimestamp: new Date(post.publishedAt).getTime(),
        postId: post.id,
        status: post.status,
        featured: Boolean(post.featured),
        tags: normalizeTags(post.tags),
        cover: normalizeOptionalString(post.cover) || null,
        readingTimeMinutes: normalizePositiveInteger(post.readingTimeMinutes) || 1,
      }));
  }

  return loadPostsMetadata(options);
}

async function loadPostsMetadata(options: GetPostsOptions): Promise<PostMetadata[]> {
  if (metadataCache && Date.now() - metadataCache.timestamp < METADATA_CACHE_TTL_MS) {
    return filterDrafts(metadataCache.data, options);
  }

  const posts: PostMetadata[] = [];
  const years = (await safeReadDir(POSTS_ROOT_DIR)).filter(year => /^\d{4}$/.test(year));

  // The generated manifest is the fast path. This scan stays as a resilient
  // fallback so local drafts still render even if metadata has not been synced.
  for (const year of years) {
    const yearPath = join(POSTS_ROOT_DIR, year);
    if (!(await isDirectory(yearPath))) continue;

    const ids = await safeReadDir(yearPath);
    for (const postId of ids) {
      const postDir = join(yearPath, postId);
      if (!(await isDirectory(postDir))) continue;

      const pagePath = join(postDir, "page.mdx");
      const file = await readFileSafe(pagePath);
      if (!file) continue;

      const metadata = parseFileMetadata(file);
      const title = metadata.title ?? postId;
      const publishedAtRaw = metadata.publishedAt;
      if (!publishedAtRaw) continue;

      const publishedAt = new Date(publishedAtRaw);
      if (Number.isNaN(publishedAt.getTime())) continue;

      const finalId = metadata.id ?? postId;

      posts.push({
        id: finalId,
        title,
        description: metadata.description ?? "",
        summary: metadata.summary || metadata.description || "",
        series: normalizeOptionalString(metadata.series) || null,
        date: DATE_FORMATTER.format(publishedAt),
        publishedAt: publishedAtRaw,
        updatedAt: normalizeDateString(metadata.updatedAt) || null,
        publishedAtTimestamp: publishedAt.getTime(),
        postId: finalId,
        status: normalizeStatus(metadata.status, metadata.draft, metadata.archived),
        featured: normalizeBoolean(metadata.featured),
        tags: normalizeTags(metadata.tags),
        cover: normalizeOptionalString(metadata.cover ?? metadata.coverImage) || null,
        readingTimeMinutes:
          normalizePositiveInteger(metadata.readingTimeMinutes) ||
          estimateReadingTimeMinutes(stripMetadataAndFrontmatter(file)),
      });
    }
  }

  posts.sort((a, b) => b.publishedAtTimestamp - a.publishedAtTimestamp);

  metadataCache = { timestamp: Date.now(), data: posts };
  return filterDrafts(posts, options);
}

export async function getManifest(): Promise<Manifest | null> {
  if (manifestCache && Date.now() - manifestCache.timestamp < METADATA_CACHE_TTL_MS) {
    return manifestCache.data;
  }

  try {
    const raw = await readFile(POSTS_MANIFEST_PATH, "utf8");
    const data = JSON.parse(raw) as Manifest;
    manifestCache = { timestamp: Date.now(), data };
    return data;
  } catch {
    manifestCache = { timestamp: Date.now(), data: null };
    return null;
  }
}

function buildPost(metadata: PostMetadata, views: Views): Post {
  const viewValue = Number(views[metadata.id] ?? 0);
  return {
    id: metadata.id,
    postId: metadata.postId,
    title: metadata.title,
    description: metadata.description,
    summary: metadata.summary || metadata.description,
    series: metadata.series,
    date: metadata.date,
    publishedAt: metadata.publishedAt,
    updatedAt: metadata.updatedAt,
    status: metadata.status,
    featured: metadata.featured,
    tags: metadata.tags,
    cover: metadata.cover,
    readingTimeMinutes: metadata.readingTimeMinutes,
    views: viewValue,
    viewsFormatted: commaNumber(viewValue),
  };
}

function filterDrafts(posts: PostMetadata[], options: GetPostsOptions): PostMetadata[] {
  return posts.filter(post => {
    if (post.status === "archived") {
      return false;
    }

    if (!options.includeDrafts && post.status === "draft") {
      return false;
    }

    return true;
  });
}

function parseFileMetadata(fileContents: string): Frontmatter {
  const metadata = parseExportedMetadata(fileContents);
  const frontmatter = parseFrontmatter(fileContents);

  return {
    title: metadata.title ?? frontmatter.title,
    description:
      metadata.description ??
      metadata.summary ??
      metadata.excerpt ??
      frontmatter.description ??
      frontmatter.summary ??
      frontmatter.excerpt,
    summary: metadata.summary ?? frontmatter.summary,
    series: metadata.series ?? frontmatter.series,
    publishedAt: metadata.publishedAt ?? frontmatter.publishedAt,
    updatedAt: metadata.updatedAt ?? frontmatter.updatedAt,
    id: metadata.id ?? frontmatter.id,
    status:
      metadata.status ??
      frontmatter.status ??
      normalizeStatus(undefined, metadata.draft ?? frontmatter.draft, metadata.archived ?? frontmatter.archived),
    draft: metadata.draft ?? frontmatter.draft,
    archived: metadata.archived ?? frontmatter.archived,
    featured: metadata.featured ?? frontmatter.featured,
    tags: metadata.tags ?? frontmatter.tags,
    cover: metadata.cover ?? frontmatter.cover,
    coverImage: metadata.coverImage ?? frontmatter.coverImage,
    readingTimeMinutes: metadata.readingTimeMinutes ?? frontmatter.readingTimeMinutes,
  };
}

function parseExportedMetadata(fileContents: string): Frontmatter {
  const exportIndex = fileContents.indexOf("export const metadata");
  if (exportIndex === -1) {
    return {};
  }

  const objectLiteral = extractObjectLiteral(fileContents, exportIndex);
  if (!objectLiteral) {
    return {};
  }

  try {
    const metadata = JSON.parse(objectLiteral);
    if (!metadata || typeof metadata !== "object") {
      return {};
    }

    return metadata as Frontmatter;
  } catch {
    return {};
  }
}

function extractObjectLiteral(source: string, exportIndex: number): string | null {
  const braceStart = source.indexOf("{", exportIndex);
  if (braceStart === -1) {
    return null;
  }

  let depth = 0;
  let inString: string | null = null;
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

function parseFrontmatter(fileContents: string): Frontmatter {
  const match = fileContents.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const [, body] = match;
  const data: Frontmatter = {};
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

    (data as Record<string, string>)[key] = value;
  }

  return data;
}

function normalizeOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDateString(value: unknown): string {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return "";
  }

  return Number.isNaN(new Date(normalized).getTime()) ? "" : normalized;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

function normalizeStatus(
  value: unknown,
  legacyDraft?: unknown,
  legacyArchived?: unknown,
): PostStatus {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "draft" || normalized === "published" || normalized === "archived") {
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

function normalizeTags(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      source
        .map(item => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  );
}

function normalizePositiveInteger(value: unknown): number {
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

function stripMetadataAndFrontmatter(source: string): string {
  return source
    .replace(/^---\n[\s\S]*?\n---\s*/u, "")
    .replace(/export const metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*/u, "");
}

function estimateReadingTimeMinutes(source: string): number {
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

  return Math.max(1, Math.ceil(totalUnits / 220));
}

async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

async function safeReadDir(path: string): Promise<string[]> {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isDirectory();
  } catch {
    return false;
  }
}
