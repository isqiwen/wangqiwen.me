import { loadManifestPosts } from "@/utils/server/post-manifest";
import type { PostStatus } from "@/utils/shared/post-fields";
import type { ManifestPost } from "@/utils/shared/post-manifest";

export type { PostStatus };

// A post as pages render it. View counts are not part of it: they change
// without a deployment, so the browser asks /api/view for them.
export type Post = Omit<ManifestPost, "path"> & {
  // `publishedAt` formatted for display, such as "August 5, 2026".
  date: string;
};

type GetPostsOptions = {
  // Drafts are listed only by the local editor preview.
  includeDrafts?: boolean;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

// Newest first, as the manifest is written. Archived posts are never listed.
export async function getPosts(options: GetPostsOptions = {}): Promise<Post[]> {
  return (await loadManifestPosts())
    .filter(post => isVisible(post, options))
    .map(toPost);
}

export async function getPostById(
  id: string,
  options: GetPostsOptions = {}
): Promise<Post | null> {
  const match = (await loadManifestPosts()).find(post => post.id === id);
  return match && isVisible(match, options) ? toPost(match) : null;
}

export async function getPostByRoute(
  year: string,
  id: string,
  options: GetPostsOptions = {}
): Promise<Post | null> {
  if (!/^\d{4}$/.test(year)) {
    return null;
  }

  const post = await getPostById(id, options);
  return post && post.publishedAt.slice(0, 4) === year ? post : null;
}

function isVisible(post: ManifestPost, options: GetPostsOptions): boolean {
  return (
    post.status === "published" ||
    (post.status === "draft" && Boolean(options.includeDrafts))
  );
}

function toPost({ path: _path, ...post }: ManifestPost): Post {
  return {
    ...post,
    // The reader-facing summary falls back to the search description.
    summary: post.summary || post.description,
    date: DATE_FORMATTER.format(new Date(post.publishedAt)),
  };
}
