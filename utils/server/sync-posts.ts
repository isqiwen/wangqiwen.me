import { promises as fs } from "fs";
import path from "path";
import {
  collectPostContentIssues,
  POSTS_MANIFEST_PATH,
  POSTS_REGISTRY_PATH,
  POSTS_ROOT,
  readFileIfPresent,
  resolvePostFile,
  writeFileAtomically,
} from "@/utils/server/post-files";
import { getPostFilePath, isPostSlug } from "@/utils/shared/post-fields";
import {
  normalizePostMetadata,
  parseExportedMetadata,
  replaceExportedMetadata,
  type NormalizedPostMetadata,
} from "@/utils/shared/post-metadata";
import type { ManifestPost } from "@/utils/shared/post-manifest";
import { validateContentQuality } from "@/utils/shared/content-quality";
import { createPostRegistrySource } from "@/utils/shared/post-registry";

export type SyncPostsMetadataOptions = {
  postsRoot?: string;
  manifestPath?: string;
  registryPath?: string;
  publishedOnly?: boolean;
  // Rewrite each article's metadata block in its canonical form. The editor
  // leaves this off: a saved file must keep the exact bytes the author sent.
  normalizeSources?: boolean;
  // Report the files that are out of date instead of writing them.
  check?: boolean;
};

export type SourcePost = {
  // `YYYY/slug`, the identity used in validation messages.
  key: string;
  year: string;
  slug: string;
  absolutePath: string;
  relativePath: string;
  routePath: string;
  source: string;
};

export class PostsValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      "Post metadata validation failed.\n" +
        issues.map(issue => ` - ${issue}`).join("\n")
    );
    this.name = "PostsValidationError";
    this.issues = issues;
  }
}

// Articles are read in name order so the generated files do not depend on the
// directory order of the filesystem that happens to hold the checkout.
export async function collectSourcePosts(
  postsRoot = POSTS_ROOT
): Promise<{ posts: SourcePost[]; issues: string[] }> {
  const posts: SourcePost[] = [];
  const issues: string[] = [];
  const years = (await readDirectoryNames(postsRoot)).filter(entry =>
    /^\d{4}$/.test(entry)
  );

  for (const year of years) {
    const yearDirectory = path.join(postsRoot, year);
    for (const slug of await readDirectoryNames(yearDirectory)) {
      const key = `${year}/${slug}`;
      const source = await readFileIfPresent(
        path.join(yearDirectory, slug, "article.mdx")
      );
      if (source === null) {
        continue;
      }

      if (!isPostSlug(slug)) {
        issues.push(`${key} has an invalid directory slug`);
        continue;
      }

      const postFile = resolvePostFile(getPostFilePath(year, slug), postsRoot);
      posts.push({
        key,
        year,
        slug,
        absolutePath: postFile.absolutePath,
        relativePath: postFile.relativePath,
        routePath: postFile.routePath,
        source,
      });
    }
  }

  return { posts, issues };
}

export function validateSourcePosts(posts: SourcePost[]): string[] {
  const issues: string[] = [];
  const validPosts: Array<{ post: SourcePost; metadata: PostMetadata }> = [];

  for (const post of posts) {
    const postIssues = collectPostContentIssues(post.source, post);
    issues.push(...postIssues.map(issue => `${post.key} ${issue}`));

    const metadata = parseExportedMetadata<PostMetadata>(post.source);
    if (postIssues.length === 0 && metadata) {
      validPosts.push({ post, metadata });
    }
  }

  // Cross-article rules only make sense for articles that are valid alone.
  const articlePaths = new Set(
    validPosts
      .filter(({ metadata }) => metadata.status === "published")
      .map(({ post }) => post.routePath)
  );
  const postsById = new Map<string, string>();
  const seriesPositions = new Map<string, string>();

  for (const { post, metadata } of validPosts) {
    const existingKey = postsById.get(post.slug);
    if (existingKey) {
      issues.push(
        `id "${post.slug}" is duplicated by ${existingKey} and ${post.key}`
      );
    } else {
      postsById.set(post.slug, post.key);
    }

    const { series, seriesOrder } = normalizePostMetadata(
      metadata,
      post.source
    );
    if (series && metadata.status !== "archived") {
      const position = `${series}:${seriesOrder}`;
      const existingSlug = seriesPositions.get(position);
      if (existingSlug) {
        issues.push(
          `Series "${series}" has duplicate position ${seriesOrder} ` +
            `for ${existingSlug} and ${post.slug}.`
        );
      } else {
        seriesPositions.set(position, post.slug);
      }
    }

    issues.push(
      ...validateContentQuality(post.source, { articlePaths }).map(
        issue => `${post.key} ${issue}`
      )
    );
  }

  return issues;
}

export async function syncPostsMetadata(
  options: SyncPostsMetadataOptions = {}
) {
  const postsRoot = options.postsRoot ?? POSTS_ROOT;
  const manifestPath = options.manifestPath ?? POSTS_MANIFEST_PATH;
  const registryPath =
    options.registryPath ?? (options.postsRoot ? null : POSTS_REGISTRY_PATH);

  const { posts: sourcePosts, issues: scanIssues } = await collectSourcePosts(
    postsRoot
  );
  const issues = [...scanIssues, ...validateSourcePosts(sourcePosts)];
  if (issues.length > 0) {
    throw new PostsValidationError(issues);
  }

  const outputs: Array<{ path: string; content: string }> = [];
  const manifestPosts: ManifestPost[] = [];
  const registryPosts: Array<{ year: string; slug: string; status: string }> =
    [];

  for (const post of sourcePosts) {
    const metadata = normalizePostMetadata(
      parseExportedMetadata<PostMetadata>(post.source) ?? {},
      post.source
    );

    if (options.normalizeSources) {
      const normalizedSource = replaceExportedMetadata(post.source, metadata);
      if (normalizedSource !== null) {
        outputs.push({ path: post.absolutePath, content: normalizedSource });
      }
    }

    registryPosts.push({
      year: post.year,
      slug: post.slug,
      status: metadata.status,
    });
    if (!options.publishedOnly || metadata.status === "published") {
      manifestPosts.push(toManifestPost(post, metadata));
    }
  }

  manifestPosts.sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt)
  );
  outputs.push({
    path: manifestPath,
    content: JSON.stringify({ posts: manifestPosts }, null, 2),
  });

  if (registryPath) {
    outputs.push({
      path: registryPath,
      content: createPostRegistrySource(registryPosts, {
        publishedOnly: options.publishedOnly,
      }),
    });
  }

  // Unchanged files are left alone so a save does not wake the development
  // file watcher for output that is already current.
  const changedFiles: string[] = [];
  for (const output of outputs) {
    if ((await readFileIfPresent(output.path)) === output.content) {
      continue;
    }

    changedFiles.push(output.path);
    if (!options.check) {
      await writeFileAtomically(output.path, output.content);
    }
  }

  return {
    stdout: `Synchronized ${manifestPosts.length} posts.`,
    stderr: "",
    changedFiles,
  };
}

type PostMetadata = Record<string, unknown>;

function toManifestPost(
  post: SourcePost,
  metadata: NormalizedPostMetadata
): ManifestPost {
  return {
    id: post.slug,
    title: metadata.title,
    description: metadata.description,
    summary: metadata.summary ?? "",
    series: metadata.series ?? null,
    seriesOrder: metadata.seriesOrder ?? null,
    publishedAt: metadata.publishedAt,
    updatedAt: metadata.updatedAt ?? null,
    status: metadata.status,
    tags: metadata.tags,
    readingTimeMinutes: metadata.readingTimeMinutes,
    path: post.routePath,
  };
}

async function readDirectoryNames(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
