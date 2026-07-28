import { promises as fs } from "fs";
import path from "path";
import {
  POSTS_MANIFEST_PATH,
  POSTS_ROOT,
  resolvePostFile,
  validatePostContent,
  writeFileAtomically,
} from "@/utils/server/post-files";
import {
  parseExportedMetadata,
  stripExportedMetadata,
} from "@/utils/shared/post-metadata";

type PostStatus = "draft" | "published" | "archived";

type SourceMetadata = {
  title?: unknown;
  description?: unknown;
  summary?: unknown;
  series?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  id?: unknown;
  status?: unknown;
  featured?: unknown;
  tags?: unknown;
  cover?: unknown;
  readingTimeMinutes?: unknown;
};

type ManifestPost = {
  id: string;
  title: string;
  description: string;
  summary: string;
  series: string | null;
  publishedAt: string;
  updatedAt: string | null;
  status: PostStatus;
  featured: boolean;
  tags: string[];
  cover: string | null;
  readingTimeMinutes: number;
  path: string;
};

export async function syncPostsMetadata() {
  const posts: ManifestPost[] = [];
  const years = (await safeReadDirectories(POSTS_ROOT)).filter(entry =>
    /^\d{4}$/.test(entry),
  );

  for (const year of years) {
    const yearDirectory = path.join(POSTS_ROOT, year);
    for (const slug of await safeReadDirectories(yearDirectory)) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        continue;
      }

      const relativePath = `app/(post)/${year}/${slug}/page.mdx`;
      const postFile = resolvePostFile(relativePath);
      const source = await readFileIfPresent(postFile.absolutePath);
      if (source === null) {
        continue;
      }

      validatePostContent(source, postFile);
      const metadata = parseExportedMetadata<SourceMetadata>(source);
      if (!metadata) {
        throw new Error(`Unable to parse metadata in ${relativePath}`);
      }

      posts.push({
        id: slug,
        title: normalizeString(metadata.title) || toTitle(slug),
        description: normalizeString(metadata.description),
        summary: normalizeString(metadata.summary),
        series: normalizeString(metadata.series) || null,
        publishedAt: metadata.publishedAt as string,
        updatedAt: normalizeDate(metadata.updatedAt),
        status: metadata.status as PostStatus,
        featured: metadata.featured === true,
        tags: normalizeTags(metadata.tags),
        cover: normalizeString(metadata.cover) || null,
        readingTimeMinutes:
          normalizePositiveInteger(metadata.readingTimeMinutes) ||
          estimateReadingTimeMinutes(stripExportedMetadata(source)),
        path: postFile.routePath,
      });
    }
  }

  posts.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  await fs.mkdir(path.dirname(POSTS_MANIFEST_PATH), { recursive: true });
  await writeFileAtomically(
    POSTS_MANIFEST_PATH,
    JSON.stringify({ posts }, null, 2),
  );

  return {
    stdout: `Synchronized ${posts.length} posts.`,
    stderr: "",
  };
}

async function safeReadDirectories(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function readFileIfPresent(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value: unknown): string | null {
  const date = normalizeString(value);
  return date && !Number.isNaN(Date.parse(date)) ? date : null;
}

function normalizeTags(value: unknown): string[] {
  const tags = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      tags
        .map(tag => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean),
    ),
  );
}

function normalizePositiveInteger(value: unknown): number {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number > 0
    ? Math.round(number)
    : 0;
}

function estimateReadingTimeMinutes(source: string): number {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~[\](){}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const latinWords = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) ?? [];
  const cjkCharacters = text.match(/[\u3400-\u9fff]/g) ?? [];
  return Math.max(1, Math.ceil((latinWords.length + cjkCharacters.length) / 220));
}

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
