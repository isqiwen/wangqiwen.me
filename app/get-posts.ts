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
  seriesOrder: number | null;
  date: string;
  publishedAt: string;
  updatedAt: string | null;
  status: PostStatus;
  tags: string[];
  readingTimeMinutes: number;
  views: number;
  viewsFormatted: string;
};

type PostFileMetadata = {
  title?: string;
  description?: string;
  summary?: string;
  series?: string;
  seriesOrder?: number;
  publishedAt?: string;
  updatedAt?: string;
  id?: string;
  status?: PostStatus;
  tags?: string[];
  readingTimeMinutes?: number;
};

type PostMetadata = {
  id: string;
  title: string;
  description: string;
  summary: string;
  series: string | null;
  seriesOrder: number | null;
  date: string;
  publishedAt: string;
  updatedAt: string | null;
  publishedAtTimestamp: number;
  postId: string;
  status: PostStatus;
  tags: string[];
  readingTimeMinutes: number;
};

type Manifest = {
  posts?: Array<{
    id: string;
    title: string;
    description?: string;
    summary?: string;
    series?: string | null;
    seriesOrder?: number | null;
    publishedAt: string;
    updatedAt?: string | null;
    status?: PostStatus;
    tags?: string[];
    readingTimeMinutes?: number;
    path: string;
  }>;
};

type Views = {
  [key: string]: string;
};

type GetPostsOptions = {
  includeDrafts?: boolean;
  includeViews?: boolean;
};

const POSTS_ROOT_DIR = join(process.cwd(), "app", "(post)");
const POSTS_MANIFEST_PATH = join(process.cwd(), "posts", "manifest.json");
const METADATA_CACHE_TTL_MS = 60 * 1000;

type MetadataCache = {
  timestamp: number;
  data: PostMetadata[];
};

let metadataCache: MetadataCache | null = null;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export const getPosts = async (options: GetPostsOptions = {}) => {
  const [metadata, allViews] = await Promise.all([
    loadManifestMetadata(options),
    options.includeViews === false ? Promise.resolve({}) : loadViews(),
  ]);

  return metadata.map(post => buildPost(post, allViews));
};

export const getPostById = async (
  id: string,
  options: GetPostsOptions = {}
): Promise<Post | null> => {
  const manifest = await getManifest();
  const match = manifest?.posts?.find(post => post.id === id);
  const views = options.includeViews === false ? {} : await loadViews();

  if (match) {
    const status = normalizeStatus(match.status);
    if (
      status !== "archived" &&
      (options.includeDrafts || status !== "draft")
    ) {
      return buildPost(
        {
          id: match.id,
          title: match.title,
          description: match.description ?? "",
          summary: match.summary ?? match.description ?? "",
          series: normalizeOptionalString(match.series) || null,
          seriesOrder: normalizePositiveInteger(match.seriesOrder) || null,
          date: DATE_FORMATTER.format(new Date(match.publishedAt)),
          publishedAt: match.publishedAt,
          updatedAt: normalizeDateString(match.updatedAt) || null,
          publishedAtTimestamp: new Date(match.publishedAt).getTime(),
          postId: match.id,
          status,
          tags: normalizeTags(match.tags),
          readingTimeMinutes:
            normalizePositiveInteger(match.readingTimeMinutes) || 1,
        },
        views
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

export const getPostByRoute = async (
  year: string,
  id: string,
  options: GetPostsOptions = {}
): Promise<Post | null> => {
  if (!/^\d{4}$/.test(year)) {
    return null;
  }

  const post = await getPostById(id, options);
  if (!post || post.publishedAt.slice(0, 4) !== year) {
    return null;
  }

  return post;
};

async function loadViews(): Promise<Views> {
  try {
    return (await redis.hgetall("views")) ?? {};
  } catch (error) {
    logger.warn(
      "Failed to load view counts from Redis, defaulting to zeros.",
      error
    );
    return {};
  }
}

async function loadManifestMetadata(
  options: GetPostsOptions
): Promise<PostMetadata[]> {
  const manifest = await getManifest();
  if (manifest?.posts) {
    return manifest.posts
      .map(post => {
        const status = normalizeStatus(post.status);
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
        seriesOrder: normalizePositiveInteger(post.seriesOrder) || null,
        date: DATE_FORMATTER.format(new Date(post.publishedAt)),
        publishedAt: post.publishedAt,
        updatedAt: normalizeDateString(post.updatedAt) || null,
        publishedAtTimestamp: new Date(post.publishedAt).getTime(),
        postId: post.id,
        status: post.status,
        tags: normalizeTags(post.tags),
        readingTimeMinutes:
          normalizePositiveInteger(post.readingTimeMinutes) || 1,
      }));
  }

  return loadPostsMetadata(options);
}

async function loadPostsMetadata(
  options: GetPostsOptions
): Promise<PostMetadata[]> {
  if (
    metadataCache &&
    Date.now() - metadataCache.timestamp < METADATA_CACHE_TTL_MS
  ) {
    return filterDrafts(metadataCache.data, options);
  }

  const posts: PostMetadata[] = [];
  const years = (await safeReadDir(POSTS_ROOT_DIR)).filter(year =>
    /^\d{4}$/.test(year)
  );

  // The generated manifest is the fast path. This scan stays as a resilient
  // fallback so local drafts still render even if metadata has not been synced.
  for (const year of years) {
    const yearPath = join(POSTS_ROOT_DIR, year);
    if (!(await isDirectory(yearPath))) continue;

    const ids = await safeReadDir(yearPath);
    for (const postId of ids) {
      const postDir = join(yearPath, postId);
      if (!(await isDirectory(postDir))) continue;

      const articlePath = join(postDir, "article.mdx");
      const file = await readFileSafe(articlePath);
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
        seriesOrder: normalizePositiveInteger(metadata.seriesOrder) || null,
        date: DATE_FORMATTER.format(publishedAt),
        publishedAt: publishedAtRaw,
        updatedAt: normalizeDateString(metadata.updatedAt) || null,
        publishedAtTimestamp: publishedAt.getTime(),
        postId: finalId,
        status: normalizeStatus(metadata.status),
        tags: normalizeTags(metadata.tags),
        readingTimeMinutes:
          normalizePositiveInteger(metadata.readingTimeMinutes) ||
          estimateReadingTimeMinutes(stripMetadata(file)),
      });
    }
  }

  posts.sort((a, b) => b.publishedAtTimestamp - a.publishedAtTimestamp);

  metadataCache = { timestamp: Date.now(), data: posts };
  return filterDrafts(posts, options);
}

export async function getManifest(): Promise<Manifest | null> {
  try {
    const raw = await readFile(POSTS_MANIFEST_PATH, "utf8");
    return JSON.parse(raw) as Manifest;
  } catch {
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
    seriesOrder: metadata.seriesOrder,
    date: metadata.date,
    publishedAt: metadata.publishedAt,
    updatedAt: metadata.updatedAt,
    status: metadata.status,
    tags: metadata.tags,
    readingTimeMinutes: metadata.readingTimeMinutes,
    views: viewValue,
    viewsFormatted: commaNumber(viewValue),
  };
}

function filterDrafts(
  posts: PostMetadata[],
  options: GetPostsOptions
): PostMetadata[] {
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

function parseFileMetadata(fileContents: string): PostFileMetadata {
  return parseExportedMetadata(fileContents);
}

function parseExportedMetadata(fileContents: string): PostFileMetadata {
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

    return metadata as PostFileMetadata;
  } catch {
    return {};
  }
}

function extractObjectLiteral(
  source: string,
  exportIndex: number
): string | null {
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

function normalizeStatus(value: unknown): PostStatus {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }

  return "archived";
}

function normalizeTags(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];

  return Array.from(
    new Set(
      source
        .map(item => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    )
  );
}

function normalizePositiveInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
}

function stripMetadata(source: string): string {
  return source.replace(
    /export const metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*/u,
    ""
  );
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
