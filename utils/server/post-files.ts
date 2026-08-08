import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { resolvePathInside } from "@/utils/server/path-safety";
import { parseExportedMetadata } from "@/utils/shared/post-metadata";
import { getUnknownTopics, TOPIC_DEFINITIONS } from "@/utils/topics";
import { isKnownSeries, SERIES_DEFINITIONS } from "@/utils/series";

export const POSTS_ROOT = path.join(process.cwd(), "app", "(post)");
export const POSTS_MANIFEST_PATH = path.join(
  process.cwd(),
  "posts",
  "manifest.json"
);
export const POSTS_REGISTRY_PATH = path.join(
  process.cwd(),
  "app",
  "(post)",
  "post-registry.ts"
);

const POST_FILE_PATTERN =
  /^app\/\(post\)\/(\d{4})\/([a-z0-9]+(?:-[a-z0-9]+)*)\/article\.mdx$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
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
  id?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  status?: unknown;
  tags?: unknown;
  series?: unknown;
  seriesOrder?: unknown;
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
  const match = relativePath.match(POST_FILE_PATTERN);
  if (!match) {
    throw new PostFileValidationError(
      "path must match app/(post)/YYYY/slug/article.mdx"
    );
  }

  const [, year, slug] = match;
  if (slug.length > 100) {
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

export function validatePostContent(
  content: unknown,
  target: ResolvedPostFile
): string {
  if (typeof content !== "string") {
    throw new PostFileValidationError("content is required");
  }

  if (Buffer.byteLength(content, "utf8") > MAX_POST_BYTES) {
    throw new PostFileValidationError("post content exceeds the 2 MB limit");
  }

  const metadata = parseExportedMetadata<PostMetadata>(content);
  if (!metadata) {
    throw new PostFileValidationError(
      "content must contain JSON-compatible exported metadata"
    );
  }

  if (metadata.id !== target.slug) {
    throw new PostFileValidationError("metadata id must match the target slug");
  }

  if (typeof metadata.title !== "string" || !metadata.title.trim()) {
    throw new PostFileValidationError("title is required");
  }

  if (
    typeof metadata.publishedAt !== "string" ||
    !isIsoDate(metadata.publishedAt)
  ) {
    throw new PostFileValidationError("publishedAt must use YYYY-MM-DD");
  }

  if (metadata.publishedAt.slice(0, 4) !== target.year) {
    throw new PostFileValidationError(
      "publishedAt year must match the target directory"
    );
  }

  if (
    metadata.status !== "draft" &&
    metadata.status !== "published" &&
    metadata.status !== "archived"
  ) {
    throw new PostFileValidationError(
      "status must be draft, published, or archived"
    );
  }

  if (
    typeof metadata.description !== "string" ||
    !metadata.description.trim()
  ) {
    throw new PostFileValidationError("posts require a description");
  }

  if (
    metadata.updatedAt != null &&
    metadata.updatedAt !== "" &&
    (typeof metadata.updatedAt !== "string" ||
      Number.isNaN(Date.parse(metadata.updatedAt)))
  ) {
    throw new PostFileValidationError("updatedAt must be a valid date");
  }

  const unknownTopics = getUnknownTopics(normalizeTags(metadata.tags));
  if (unknownTopics.length > 0) {
    throw new PostFileValidationError(
      `unknown topics: ${unknownTopics.join(
        ", "
      )}. Choose from: ${TOPIC_DEFINITIONS.map(topic => topic.name).join(", ")}`
    );
  }

  if (metadata.series != null && typeof metadata.series !== "string") {
    throw new PostFileValidationError("series must be a string");
  }

  const series = normalizeOptionalString(metadata.series);
  const seriesOrder = normalizePositiveInteger(metadata.seriesOrder);
  if (series) {
    if (!isKnownSeries(series)) {
      throw new PostFileValidationError(
        `unknown series: ${series}. Choose from: ${SERIES_DEFINITIONS.map(
          definition => definition.slug
        ).join(", ")}`
      );
    }

    if (seriesOrder === 0) {
      throw new PostFileValidationError(
        "seriesOrder must be a positive integer when series is set"
      );
    }
  } else if (metadata.seriesOrder != null && metadata.seriesOrder !== "") {
    throw new PostFileValidationError("seriesOrder requires a series");
  }

  return content;
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

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function normalizeTags(value: unknown): string[] {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : [];

  return Array.from(
    new Set(
      rawTags
        .map(tag => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
    )
  );
}

function normalizeOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePositiveInteger(value: unknown): number {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isInteger(number) && number > 0
    ? number
    : 0;
}
