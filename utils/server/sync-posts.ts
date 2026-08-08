import { promises as fs } from "fs";
import path from "path";
import {
  POSTS_MANIFEST_PATH,
  POSTS_REGISTRY_PATH,
  POSTS_ROOT,
  resolvePostFile,
  validatePostContent,
  writeFileAtomically,
} from "@/utils/server/post-files";
import {
  parseExportedMetadata,
  stripExportedMetadata,
} from "@/utils/shared/post-metadata";
import { validateContentQuality } from "@/utils/shared/content-quality";
import { createPostRegistrySource } from "@/utils/shared/post-registry";

type PostStatus = "draft" | "published" | "archived";

type SourceMetadata = {
  title?: unknown;
  description?: unknown;
  summary?: unknown;
  series?: unknown;
  seriesOrder?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  id?: unknown;
  status?: unknown;
  tags?: unknown;
  readingTimeMinutes?: unknown;
};

type ManifestPost = {
  id: string;
  title: string;
  description: string;
  summary: string;
  series: string | null;
  seriesOrder: number | null;
  publishedAt: string;
  updatedAt: string | null;
  status: PostStatus;
  tags: string[];
  readingTimeMinutes: number;
  path: string;
};

type SyncPostsMetadataOptions = {
  postsRoot?: string;
  manifestPath?: string;
  registryPath?: string;
  publishedOnly?: boolean;
};

type SourcePost = {
  relativePath: string;
  routePath: string;
  source: string;
  status: PostStatus;
  year: string;
  slug: string;
};

export async function syncPostsMetadata(
  options: SyncPostsMetadataOptions = {}
) {
  const postsRoot = options.postsRoot ?? POSTS_ROOT;
  const manifestPath = options.manifestPath ?? POSTS_MANIFEST_PATH;
  const registryPath =
    options.registryPath ?? (options.postsRoot ? null : POSTS_REGISTRY_PATH);
  const posts: ManifestPost[] = [];
  const sourcePosts: SourcePost[] = [];
  const years = (await safeReadDirectories(postsRoot)).filter(entry =>
    /^\d{4}$/.test(entry)
  );

  for (const year of years) {
    const yearDirectory = path.join(postsRoot, year);
    for (const slug of await safeReadDirectories(yearDirectory)) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        continue;
      }

      const relativePath = `app/(post)/${year}/${slug}/article.mdx`;
      const postFile = resolvePostFile(relativePath, postsRoot);
      const source = await readFileIfPresent(postFile.absolutePath);
      if (source === null) {
        continue;
      }

      validatePostContent(source, postFile);
      const metadata = parseExportedMetadata<SourceMetadata>(source);
      if (!metadata) {
        throw new Error(`Unable to parse metadata in ${relativePath}`);
      }

      const status = metadata.status as PostStatus;
      sourcePosts.push({
        relativePath,
        routePath: postFile.routePath,
        source,
        status,
        year,
        slug,
      });

      posts.push({
        id: slug,
        title: normalizeString(metadata.title),
        description: normalizeString(metadata.description),
        summary: normalizeString(metadata.summary),
        series: normalizeString(metadata.series) || null,
        seriesOrder: normalizePositiveInteger(metadata.seriesOrder) || null,
        publishedAt: metadata.publishedAt as string,
        updatedAt: normalizeDate(metadata.updatedAt),
        status,
        tags: normalizeTags(metadata.tags),
        readingTimeMinutes:
          normalizePositiveInteger(metadata.readingTimeMinutes) ||
          estimateReadingTimeMinutes(stripExportedMetadata(source)),
        path: postFile.routePath,
      });
    }
  }

  validateContentQualityForPosts(sourcePosts);
  validateUniqueSeriesOrders(posts);

  const outputPosts = options.publishedOnly
    ? posts.filter(post => post.status === "published")
    : posts;

  outputPosts.sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt)
  );
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFileAtomically(
    manifestPath,
    JSON.stringify({ posts: outputPosts }, null, 2)
  );

  if (registryPath) {
    await writeFileAtomically(
      registryPath,
      createPostRegistrySource(sourcePosts, {
        publishedOnly: options.publishedOnly,
      })
    );
  }

  return {
    stdout: `Synchronized ${outputPosts.length} posts.`,
    stderr: "",
  };
}

function validateContentQualityForPosts(posts: SourcePost[]) {
  const articlePaths = new Set(
    posts
      .filter(post => post.status === "published")
      .map(post => post.routePath)
  );
  const errors = posts.flatMap(post =>
    validateContentQuality(post.source, { articlePaths }).map(
      issue => `${post.relativePath} ${issue}`
    )
  );

  if (errors.length > 0) {
    throw new Error(
      "Post content quality validation failed.\n" +
        errors.map(error => ` - ${error}`).join("\n")
    );
  }
}

function validateUniqueSeriesOrders(posts: ManifestPost[]) {
  const occupiedPositions = new Map<string, string>();

  for (const post of posts) {
    if (post.status === "archived" || !post.series || !post.seriesOrder) {
      continue;
    }

    const key = `${post.series}:${post.seriesOrder}`;
    const existingPostId = occupiedPositions.get(key);
    if (existingPostId) {
      throw new Error(
        `Series "${post.series}" has duplicate position ${post.seriesOrder} ` +
          `for ${existingPostId} and ${post.id}.`
      );
    }

    occupiedPositions.set(key, post.id);
  }
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
  const tags = Array.isArray(value) ? value : [];

  return Array.from(
    new Set(
      tags
        .map(tag => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
    )
  );
}

function normalizePositiveInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
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
  return Math.max(
    1,
    Math.ceil((latinWords.length + cjkCharacters.length) / 220)
  );
}
