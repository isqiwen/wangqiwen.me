import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  collectSourcePosts,
  PostsValidationError,
  syncPostsMetadata,
  validateSourcePosts,
} from "@/utils/server/sync-posts";

type Fixture = {
  postsRoot: string;
  manifestPath: string;
  articlePath: (key: string) => string;
  write: (
    key: string,
    metadata: Record<string, unknown>,
    body?: string
  ) => Promise<void>;
};

function metadataFor(key: string, overrides: Record<string, unknown> = {}) {
  const [year, slug] = key.split("/");
  return {
    id: slug,
    title: "Fixture post",
    description: "A valid description.",
    publishedAt: `${year}-03-04`,
    status: "draft",
    ...overrides,
  };
}

async function withFixture(run: (fixture: Fixture) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "wangqiwen-sync-posts-"));
  const postsRoot = join(root, "content", "posts");
  const articlePath = (key: string) => join(postsRoot, key, "article.mdx");

  try {
    await run({
      postsRoot,
      manifestPath: join(root, "posts", "manifest.json"),
      articlePath,
      async write(key, metadata, body = "## Introduction\n") {
        await mkdir(dirname(articlePath(key)), { recursive: true });
        // Deliberately not the canonical layout: one line, no trailing blank.
        await writeFile(
          articlePath(key),
          `export const metadata = ${JSON.stringify(metadata)};\n${body}`
        );
      },
    });
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

test("reports every problem in the content tree in one pass", async () => {
  await withFixture(async ({ postsRoot, manifestPath, write }) => {
    await write(
      "2026/broken-post",
      metadataFor("2026/broken-post", { title: " ", updatedAt: "not a date" })
    );
    await write("2026/Bad_Slug", metadataFor("2026/Bad_Slug"));
    await write("2025/twin-post", metadataFor("2025/twin-post"));
    await write("2026/twin-post", metadataFor("2026/twin-post"));

    const { posts, issues } = await collectSourcePosts(postsRoot);
    assert.deepEqual(issues, ["2026/Bad_Slug has an invalid directory slug"]);
    assert.deepEqual(validateSourcePosts(posts), [
      "2026/broken-post title is required",
      "2026/broken-post updatedAt must be a valid date",
      'id "twin-post" is duplicated by 2025/twin-post and 2026/twin-post',
    ]);

    await assert.rejects(
      syncPostsMetadata({ postsRoot, manifestPath }),
      (error: unknown) =>
        error instanceof PostsValidationError && error.issues.length === 4
    );
    await assert.rejects(readFile(manifestPath, "utf8"), { code: "ENOENT" });
  });
});

test("check mode reports stale files and writes nothing", async () => {
  await withFixture(async ({ postsRoot, manifestPath, articlePath, write }) => {
    await write("2026/first-post", metadataFor("2026/first-post"));
    const original = await readFile(articlePath("2026/first-post"), "utf8");

    const checked = await syncPostsMetadata({
      postsRoot,
      manifestPath,
      normalizeSources: true,
      check: true,
    });

    assert.deepEqual(checked.changedFiles, [
      articlePath("2026/first-post"),
      manifestPath,
    ]);
    assert.equal(
      await readFile(articlePath("2026/first-post"), "utf8"),
      original
    );
    await assert.rejects(readFile(manifestPath, "utf8"), { code: "ENOENT" });
  });
});

test("normalizing writes canonical metadata once and is then a no-op", async () => {
  await withFixture(async ({ postsRoot, manifestPath, articlePath, write }) => {
    await write(
      "2026/first-post",
      metadataFor("2026/first-post", {
        title: "  Padded title ",
        tags: ["Frontend", "Frontend"],
        summary: "",
      })
    );

    const first = await syncPostsMetadata({
      postsRoot,
      manifestPath,
      normalizeSources: true,
    });
    assert.equal(first.changedFiles.length, 2);
    assert.equal(
      await readFile(articlePath("2026/first-post"), "utf8"),
      `export const metadata = ${JSON.stringify(
        {
          title: "Padded title",
          description: "A valid description.",
          publishedAt: "2026-03-04",
          id: "first-post",
          status: "draft",
          tags: ["Frontend"],
          readingTimeMinutes: 1,
        },
        null,
        2
      )};\n\n## Introduction\n`
    );

    const second = await syncPostsMetadata({
      postsRoot,
      manifestPath,
      normalizeSources: true,
    });
    assert.deepEqual(second.changedFiles, []);
  });
});

test("the editor's sync never rewrites an article it was asked to save", async () => {
  await withFixture(async ({ postsRoot, manifestPath, articlePath, write }) => {
    await write("2026/first-post", metadataFor("2026/first-post"));
    const original = await readFile(articlePath("2026/first-post"), "utf8");

    const result = await syncPostsMetadata({ postsRoot, manifestPath });

    assert.deepEqual(result.changedFiles, [manifestPath]);
    assert.equal(
      await readFile(articlePath("2026/first-post"), "utf8"),
      original
    );
  });
});

test("orders the manifest by date, then by slug, and filters unpublished posts on request", async () => {
  await withFixture(async ({ postsRoot, manifestPath, write }) => {
    await write("2026/zebra", metadataFor("2026/zebra"));
    await write(
      "2026/alpha",
      metadataFor("2026/alpha", { status: "published" })
    );
    await write(
      "2025/older",
      metadataFor("2025/older", { status: "archived" })
    );
    await write(
      "2026/newest",
      metadataFor("2026/newest", { publishedAt: "2026-09-01" })
    );

    const ids = async () =>
      (
        JSON.parse(await readFile(manifestPath, "utf8")) as {
          posts: Array<{ id: string }>;
        }
      ).posts.map(post => post.id);

    await syncPostsMetadata({ postsRoot, manifestPath });
    assert.deepEqual(await ids(), ["newest", "alpha", "zebra", "older"]);

    await syncPostsMetadata({ postsRoot, manifestPath, publishedOnly: true });
    assert.deepEqual(await ids(), ["alpha"]);
  });
});
