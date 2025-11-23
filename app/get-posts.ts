import redis from "./redis";
import commaNumber from "comma-number";
import { join } from "path";
import { readdir, readFile, stat } from "fs/promises";
import { runInNewContext } from "vm";

export type PostLocale = "zh" | "en";

export type Post = {
  id: string;
  postId: string;
  title: string;
  date: string;
  locale: PostLocale;
  views: number;
  viewsFormatted: string;
};

type Frontmatter = {
  title?: string;
  publishedAt?: string;
  id?: string;
};

type PostMetadata = {
  id: string;
  locale: PostLocale;
  title: string;
  date: string;
  postId: string;
  publishedAt: Date;
};

type Manifest = {
  posts?: Record<
    PostLocale,
    Array<{
      id: string;
      title: string;
      description?: string;
      publishedAt: string;
      path: string;
    }>
  >;
};

const POSTS_ROOT_DIR = join(process.cwd(), "app", "(post)");
const POSTS_MANIFEST_PATH = join(process.cwd(), "posts", "manifest.json");
const SUPPORTED_LOCALES: PostLocale[] = ["zh", "en"];
const METADATA_CACHE_TTL_MS = 60 * 1000; // 1 minute cache for expensive disk scans

type MetadataCache = {
  timestamp: number;
  data: PostMetadata[];
};

const metadataCache = new Map<PostLocale, MetadataCache>();
let manifestCache: { timestamp: number; data: Manifest | null } | null = null;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export const getPosts = async (locale: PostLocale = "zh") => {
  const [metadata, allViews] = await Promise.all([
    loadManifestMetadata(locale),
    loadViews(),
  ]);

  return metadata.map(post => buildPost(post, allViews));
};

export const getPostById = async (id: string): Promise<Post | null> => {
  const views = await loadViews();
  const manifest = await getManifest();

  if (manifest?.posts) {
    for (const locale of SUPPORTED_LOCALES) {
      const list = manifest.posts[locale] ?? [];
      const match = list.find(post => post.id === id);
      if (match) {
        return buildPost(
          {
            id: match.id,
            locale,
            title: match.title,
            date: DATE_FORMATTER.format(new Date(match.publishedAt)),
            postId: match.id,
            publishedAt: new Date(match.publishedAt),
          },
          views,
        );
      }
    }
  }

  for (const locale of SUPPORTED_LOCALES) {
    const metadata = await loadPostsMetadata(locale);
    const target = metadata.find(post => post.id === id);
    if (target) {
      return buildPost(target, views);
    }
  }

  return null;
};

async function loadViews(): Promise<Views> {
  try {
    return (await redis.hgetall("views")) ?? {};
  } catch (error) {
    console.warn("Failed to load view counts from Redis, defaulting to zeros.", error);
    return {};
  }
}

async function loadManifestMetadata(locale: PostLocale): Promise<PostMetadata[]> {
  const manifest = await getManifest();
  if (manifest?.posts?.[locale]) {
    return manifest.posts[locale].map(post => ({
      id: post.id,
      locale,
      title: post.title,
      date: DATE_FORMATTER.format(new Date(post.publishedAt)),
      postId: post.id,
      publishedAt: new Date(post.publishedAt),
    }));
  }

  return loadPostsMetadata(locale);
}

async function loadPostsMetadata(locale: PostLocale): Promise<PostMetadata[]> {
  const cached = metadataCache.get(locale);
  if (cached && Date.now() - cached.timestamp < METADATA_CACHE_TTL_MS) {
    return cached.data;
  }
  const posts: PostMetadata[] = [];
  const years = await safeReadDir(getLocaleDir(locale));

  for (const year of years) {
    const yearPath = join(getLocaleDir(locale), year);
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
        locale,
        title,
        date: DATE_FORMATTER.format(publishedAt),
        postId: finalId,
        publishedAt,
      });
    }
  }

  posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  metadataCache.set(locale, { timestamp: Date.now(), data: posts });
  return posts;
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
    date: metadata.date,
    locale: metadata.locale,
    views: viewValue,
    viewsFormatted: commaNumber(viewValue),
  };
}

function getLocaleDir(locale: PostLocale): string {
  return join(POSTS_ROOT_DIR, locale);
}

function parseFileMetadata(fileContents: string): Frontmatter {
  const metadata = parseExportedMetadata(fileContents);
  const frontmatter = parseFrontmatter(fileContents);

  return {
    title: metadata.title ?? frontmatter.title,
    publishedAt: metadata.publishedAt ?? frontmatter.publishedAt,
    id: metadata.id ?? frontmatter.id,
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
    const metadata = runInNewContext(`(${objectLiteral})`);
    if (!metadata || typeof metadata !== "object") {
      return {};
    }

    const result: Frontmatter = {};

    const title = getTitleValue((metadata as Record<string, unknown>).title);
    if (title) {
      result.title = title;
    }

    const publishedAt = (metadata as Record<string, unknown>).publishedAt;
    if (typeof publishedAt === "string") {
      result.publishedAt = publishedAt;
    }

    const id = (metadata as Record<string, unknown>).id;
    if (typeof id === "string") {
      result.id = id;
    }

    return result;
  } catch {
    return {};
  }
}

function getTitleValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.default === "string") {
      return record.default;
    }
  }

  return undefined;
}

function extractObjectLiteral(
  source: string,
  exportIndex: number,
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

    if (!key) continue;

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

// shape of the HSET in redis
type Views = {
  [key: string]: string;
};
