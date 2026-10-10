import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { resolvePathInside } from "@/utils/server/path-safety";
import {
  isIsoDate,
  isPostStatus,
  MAX_POST_SLUG_LENGTH,
  parsePostFilePath,
  POSTS_DIRECTORY,
  normalizeOptionalString,
  normalizePositiveInteger,
  normalizeTags,
} from "@/utils/shared/post-fields";
import { POSTS_MANIFEST_FILE } from "@/utils/shared/post-manifest";
import { parseExportedMetadata } from "@/utils/shared/post-metadata";
import { getUnknownTopics, TOPIC_DEFINITIONS } from "@/utils/topics";
import { isKnownSeries, SERIES_DEFINITIONS } from "@/utils/series";

export const POSTS_ROOT = path.join(
  process.cwd(),
  ...POSTS_DIRECTORY.split("/")
);
export const POSTS_MANIFEST_PATH = path.join(
  process.cwd(),
  ...POSTS_MANIFEST_FILE.split("/")
);
export const POSTS_REGISTRY_PATH = path.join(POSTS_ROOT, "post-registry.ts");

const MAX_POST_BYTES = 2 * 1024 * 1024;

export type ResolvedPostFile = {
  absolutePath: string;
  relativePath: string;
  routePath: string;
  year: string;
  slug: string;
};

type PostMetadata = {
  title?: unknown;
  description?: unknown;
  summary?: unknown;
  id?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  status?: unknown;
  tags?: unknown;
  series?: unknown;
  seriesOrder?: unknown;
  readingTimeMinutes?: unknown;
};

const globalForPostMutations = globalThis as typeof globalThis & {
  __postMutationQueue?: Promise<void>;
};

export function resolvePostFile(
  inputPath: unknown,
  postsRoot = POSTS_ROOT
): ResolvedPostFile {
  if (typeof inputPath !== "string") {
    throw new PostFileValidationError("path is required");
  }

  const relativePath = inputPath.replace(/\\/g, "/").replace(/^\.?\//, "");
  const match = parsePostFilePath(relativePath);
  if (!match) {
    throw new PostFileValidationError(
      `path must match ${POSTS_DIRECTORY}/YYYY/slug/article.mdx`
    );
  }

  const { year, slug } = match;
  if (slug.length > MAX_POST_SLUG_LENGTH) {
    throw new PostFileValidationError("slug must not exceed 100 characters");
  }

  return {
    absolutePath: resolvePathInside(postsRoot, `${year}/${slug}/article.mdx`),
    relativePath,
    routePath: `/${year}/${slug}`,
    year,
    slug,
  };
}

// Every problem with one article, in a stable order. The editor reports the
// first; the content scripts report them all.
export function collectPostContentIssues(
  content: unknown,
  target: ResolvedPostFile
): string[] {
  if (typeof content !== "string") {
    return ["content is required"];
  }

  if (Buffer.byteLength(content, "utf8") > MAX_POST_BYTES) {
    return ["post content exceeds the 2 MB limit"];
  }

  const metadata = parseExportedMetadata<PostMetadata>(content);
  if (!metadata) {
    return ["content must contain JSON-compatible exported metadata"];
  }

  const issues: string[] = [];

  if (metadata.id !== target.slug) {
    issues.push("metadata id must match the target slug");
  }

  if (typeof metadata.title !== "string" || !metadata.title.trim()) {
    issues.push("title is required");
  }

  if (
    typeof metadata.publishedAt !== "string" ||
    !isIsoDate(metadata.publishedAt)
  ) {
    issues.push("publishedAt must use YYYY-MM-DD");
  } else if (metadata.publishedAt.slice(0, 4) !== target.year) {
    issues.push("publishedAt year must match the target directory");
  }

  if (!isPostStatus(metadata.status)) {
    issues.push("status must be draft, published, or archived");
  }

  if (
    typeof metadata.description !== "string" ||
    !metadata.description.trim()
  ) {
    issues.push("posts require a description");
  }

  if (metadata.summary != null && typeof metadata.summary !== "string") {
    issues.push("summary must be a string");
  }

  if (
    metadata.updatedAt != null &&
    metadata.updatedAt !== "" &&
    (typeof metadata.updatedAt !== "string" ||
      Number.isNaN(Date.parse(metadata.updatedAt)))
  ) {
    issues.push("updatedAt must be a valid date");
  }

  if (
    metadata.tags != null &&
    (!Array.isArray(metadata.tags) ||
      metadata.tags.some(tag => typeof tag !== "string"))
  ) {
    issues.push("tags must be an array of strings");
  } else {
    const tags = normalizeTags(metadata.tags);
    if (
      Array.isArray(metadata.tags) &&
      metadata.tags.length > 0 &&
      tags.length === 0
    ) {
      issues.push("tags must not be blank");
    }

    const unknownTopics = getUnknownTopics(tags);
    if (unknownTopics.length > 0) {
      issues.push(
        `unknown topics: ${unknownTopics.join(
          ", "
        )}. Choose from: ${TOPIC_DEFINITIONS.map(topic => topic.name).join(
          ", "
        )}`
      );
    }
  }

  if (metadata.series != null && typeof metadata.series !== "string") {
    issues.push("series must be a string");
  }

  if (
    metadata.seriesOrder != null &&
    (typeof metadata.seriesOrder !== "number" ||
      !Number.isInteger(metadata.seriesOrder) ||
      metadata.seriesOrder < 1)
  ) {
    issues.push("seriesOrder must be a positive integer when series is set");
  }

  if (
    metadata.readingTimeMinutes != null &&
    (typeof metadata.readingTimeMinutes !== "number" ||
      !Number.isInteger(metadata.readingTimeMinutes) ||
      metadata.readingTimeMinutes < 1)
  ) {
    issues.push("readingTimeMinutes must be a positive integer");
  }

  for (const retiredField of ["draft", "archived", "excerpt"]) {
    if (Object.hasOwn(metadata, retiredField)) {
      issues.push(`retired metadata field: ${retiredField}`);
    }
  }

  const series = normalizeOptionalString(metadata.series);
  const seriesOrder = normalizePositiveInteger(metadata.seriesOrder);
  if (series) {
    if (!isKnownSeries(series)) {
      issues.push(
        `unknown series: ${series}. Choose from: ${SERIES_DEFINITIONS.map(
          definition => definition.slug
        ).join(", ")}`
      );
    }

    if (seriesOrder === 0) {
      issues.push("seriesOrder must be a positive integer when series is set");
    }
  } else if (metadata.seriesOrder != null) {
    issues.push("seriesOrder requires a series");
  }

  return [...new Set(issues)];
}

export function validatePostContent(
  content: unknown,
  target: ResolvedPostFile
): string {
  const [firstIssue] = collectPostContentIssues(content, target);
  if (firstIssue) {
    throw new PostFileValidationError(firstIssue);
  }

  return content as string;
}

export async function writeFileAtomically(targetPath: string, content: string) {
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${randomUUID()}.tmp`
  );

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  try {
    await fs.writeFile(temporaryPath, content, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644,
    });
    await fs.rename(temporaryPath, targetPath);
  } finally {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

export async function readFileIfPresent(
  filePath: string
): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

// Removes `startDirectory` and then each parent that became empty, stopping
// below `rootDirectory`, which is never removed.
export async function removeEmptyParents(
  startDirectory: string,
  rootDirectory: string
) {
  let current = startDirectory;

  while (current !== rootDirectory) {
    const relative = path.relative(rootDirectory, current);
    if (relative === ".." || relative.startsWith(`..${path.sep}`)) {
      return;
    }

    const entries = await fs.readdir(current);
    if (entries.length > 0) {
      return;
    }

    await fs.rmdir(current);
    current = path.dirname(current);
  }
}

export async function withPostMutationLock<T>(
  operation: () => Promise<T>
): Promise<T> {
  const previous =
    globalForPostMutations.__postMutationQueue ?? Promise.resolve();
  let release: (() => void) | undefined;
  globalForPostMutations.__postMutationQueue = new Promise<void>(resolve => {
    release = resolve;
  });

  await previous.catch(() => undefined);
  try {
    return await operation();
  } finally {
    release?.();
  }
}

export class PostFileValidationError extends Error {}
