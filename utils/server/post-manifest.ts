import { readFile } from "fs/promises";
import path from "path";
import { logger } from "@/utils/logger";
import {
  POSTS_MANIFEST_FILE,
  type ManifestPost,
  type PostManifest,
} from "@/utils/shared/post-manifest";

export async function loadManifestPosts(): Promise<ManifestPost[]> {
  if (process.env.NODE_ENV === "production") {
    // A deployed artifact never changes its content, so the manifest is
    // compiled in. Nothing reads the file while serving requests.
    const { default: manifest } = await import("@/posts/manifest.json");
    return (manifest as unknown as PostManifest).posts;
  }

  // The editor rewrites the file while the development server is running.
  try {
    const manifest = JSON.parse(
      await readFile(path.join(process.cwd(), POSTS_MANIFEST_FILE), "utf8")
    ) as Partial<PostManifest>;
    return manifest.posts ?? [];
  } catch (error) {
    logger.warn(
      `Could not read ${POSTS_MANIFEST_FILE}; run pnpm sync:posts to generate it.`,
      error
    );
    return [];
  }
}
