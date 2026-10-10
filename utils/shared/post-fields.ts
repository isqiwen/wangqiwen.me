// Field-level rules shared by the site, the editor and the content scripts.
// Keep this module free of Node.js imports: the editor loads it in the browser.

export type PostStatus = "draft" | "published" | "archived";

export const POST_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_POST_SLUG_LENGTH = 100;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const READING_UNITS_PER_MINUTE = 220;

export function isPostSlug(value: string): boolean {
  return value.length <= MAX_POST_SLUG_LENGTH && POST_SLUG_PATTERN.test(value);
}

export function isPostStatus(value: unknown): value is PostStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function normalizeOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeDateString(value: unknown): string {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return "";
  }

  return Number.isNaN(new Date(normalized).getTime()) ? "" : normalized;
}

export function normalizeTags(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];

  return Array.from(
    new Set(
      source
        .map(item => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    )
  );
}

export function normalizePositiveInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
}

// A unit-based estimate stays stable across different kinds of technical
// writing: one Latin word or one CJK character counts as one unit.
export function estimateReadingTimeMinutes(body: string): number {
  const text = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~[\](){}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const latinWords = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) ?? [];
  const cjkCharacters = text.match(/[㐀-鿿]/g) ?? [];

  return Math.max(
    1,
    Math.ceil(
      (latinWords.length + cjkCharacters.length) / READING_UNITS_PER_MINUTE
    )
  );
}

// Article sources and their generated registry live outside `app/` on purpose.
// The development server rescans its routes whenever a file inside `app/`
// changes, and a request that arrives during a rescan can miss its route. The
// editor saves often, so it must not write there. See
// docs/editor-test-stability.md.
export const POSTS_DIRECTORY = "content/posts";
export const POST_FILE_NAME = "article.mdx";

export function getPostFilePath(year: string, slug: string): string {
  return `${POSTS_DIRECTORY}/${year}/${slug}/${POST_FILE_NAME}`;
}

// Accepts only `content/posts/YYYY/slug/article.mdx`, with forward slashes.
export function parsePostFilePath(
  filePath: string
): { year: string; slug: string } | null {
  const prefix = `${POSTS_DIRECTORY}/`;
  if (!filePath.startsWith(prefix)) {
    return null;
  }

  const segments = filePath.slice(prefix.length).split("/");
  if (segments.length !== 3 || segments[2] !== POST_FILE_NAME) {
    return null;
  }

  const [year, slug] = segments;
  return /^\d{4}$/.test(year) && POST_SLUG_PATTERN.test(slug)
    ? { year, slug }
    : null;
}

// The folder under /public/images that holds the uploads of one post.
export function toAssetFolderId(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "misc";
}
