import type { PostStatus } from "@/utils/shared/post-fields";

// One entry of posts/manifest.json, which `pnpm sync:posts` generates from the
// article sources. Every reader of the manifest shares this shape.
export type ManifestPost = {
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
  // The public route, `/YYYY/slug`.
  path: string;
};

export type PostManifest = {
  posts: ManifestPost[];
};

export const POSTS_MANIFEST_FILE = "posts/manifest.json";
