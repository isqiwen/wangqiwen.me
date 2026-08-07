import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  resolvePostFile,
  writeFileAtomically,
} from "@/utils/server/post-files";
import { syncPostsMetadata } from "@/utils/server/sync-posts";

const relativePath = "app/(post)/2026/editor-lifecycle/article.mdx";

function postSource(
  status: "draft" | "published" | "archived",
  body = "## Introduction\n"
) {
  return `export const metadata = ${JSON.stringify(
    {
      id: "editor-lifecycle",
      title: "Editor lifecycle",
      description:
        "Verifies a post can move safely through the editor lifecycle.",
      publishedAt: "2026-08-08",
      status,
    },
    null,
    2
  )};\n\n${body}`;
}

async function readManifest(path: string) {
  const manifest = JSON.parse(await readFile(path, "utf8")) as {
    posts: Array<{ id: string; status: string }>;
  };

  return {
    posts: manifest.posts.map(post => ({ id: post.id, status: post.status })),
  };
}

test("synchronizes draft, publish, archive, and deletion transitions", async () => {
  const root = await mkdtemp(join(tmpdir(), "wangqiwen-editor-lifecycle-"));
  const postsRoot = join(root, "app", "(post)");
  const manifestPath = join(root, "posts", "manifest.json");
  const postFile = resolvePostFile(relativePath, postsRoot);

  try {
    await writeFileAtomically(postFile.absolutePath, postSource("draft"));
    await syncPostsMetadata({ postsRoot, manifestPath });
    assert.deepEqual(await readManifest(manifestPath), {
      posts: [{ id: "editor-lifecycle", status: "draft" }],
    });

    await writeFileAtomically(postFile.absolutePath, postSource("published"));
    await syncPostsMetadata({ postsRoot, manifestPath });
    assert.deepEqual(await readManifest(manifestPath), {
      posts: [{ id: "editor-lifecycle", status: "published" }],
    });

    await writeFileAtomically(postFile.absolutePath, postSource("archived"));
    await syncPostsMetadata({ postsRoot, manifestPath });
    assert.deepEqual(await readManifest(manifestPath), {
      posts: [{ id: "editor-lifecycle", status: "archived" }],
    });

    await rm(postFile.absolutePath);
    await syncPostsMetadata({ postsRoot, manifestPath });
    assert.deepEqual(await readManifest(manifestPath), { posts: [] });
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("rejects editor content that violates publishing quality rules", async () => {
  const root = await mkdtemp(join(tmpdir(), "wangqiwen-editor-quality-"));
  const postsRoot = join(root, "app", "(post)");
  const manifestPath = join(root, "posts", "manifest.json");
  const postFile = resolvePostFile(relativePath, postsRoot);

  try {
    await writeFileAtomically(
      postFile.absolutePath,
      postSource("draft", "# Duplicate title\n")
    );
    await assert.rejects(
      syncPostsMetadata({ postsRoot, manifestPath }),
      /do not use h1/
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
