import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  PostFileValidationError,
  resolvePostFile,
  validatePostContent,
  withPostMutationLock,
  writeFileAtomically,
} from "@/utils/server/post-files";

const validPost = (overrides: Record<string, unknown> = {}) =>
  `export const metadata = ${JSON.stringify(
    {
      id: "safe-post",
      title: "Safe post",
      description: "A valid description.",
      publishedAt: "2024-01-02",
      status: "draft",
      ...overrides,
    },
    null,
    2
  )};\n\nPost body.`;

test("only resolves post files under the expected year and slug path", () => {
  const post = resolvePostFile("app/(post)/2024/safe-post/article.mdx");

  assert.equal(post.routePath, "/2024/safe-post");
  assert.equal(post.year, "2024");
  assert.equal(post.slug, "safe-post");
  assert.throws(
    () => resolvePostFile("app/(post)/2024/../../secret/article.mdx"),
    PostFileValidationError
  );
  assert.throws(
    () => resolvePostFile("app/(post)/2024/Unsafe_Post/article.mdx"),
    PostFileValidationError
  );
});

test("validates post metadata against its target file", () => {
  const target = resolvePostFile("app/(post)/2024/safe-post/article.mdx");

  assert.equal(validatePostContent(validPost(), target), validPost());
  assert.throws(
    () => validatePostContent(validPost({ id: "other-post" }), target),
    /metadata id must match/
  );
  assert.throws(
    () => validatePostContent(validPost({ publishedAt: "2025-01-02" }), target),
    /publishedAt year must match/
  );
  assert.throws(
    () => validatePostContent(validPost({ status: "private" }), target),
    /status must be draft, published, or archived/
  );
  assert.throws(
    () => validatePostContent(validPost({ description: "" }), target),
    /require a description/
  );
  assert.equal(
    validatePostContent(validPost({ tags: ["Frontend"] }), target),
    validPost({ tags: ["Frontend"] })
  );
  assert.throws(
    () => validatePostContent(validPost({ tags: "Frontend" }), target),
    /tags must be an array of strings/
  );
  assert.throws(
    () => validatePostContent(validPost({ tags: ["Uncategorized"] }), target),
    /unknown topics: Uncategorized/
  );
  assert.equal(
    validatePostContent(
      validPost({
        series: "reliable-web-delivery",
        seriesOrder: 1,
      }),
      target
    ),
    validPost({
      series: "reliable-web-delivery",
      seriesOrder: 1,
    })
  );
  assert.throws(
    () =>
      validatePostContent(
        validPost({ series: "unknown", seriesOrder: 1 }),
        target
      ),
    /unknown series: unknown/
  );
  assert.throws(
    () =>
      validatePostContent(
        validPost({ series: "reliable-web-delivery" }),
        target
      ),
    /seriesOrder must be a positive integer/
  );
  assert.throws(
    () => validatePostContent(validPost({ seriesOrder: 1 }), target),
    /seriesOrder requires a series/
  );
  assert.throws(
    () => validatePostContent(validPost({ seriesOrder: "1" }), target),
    /seriesOrder must be a positive integer/
  );
  assert.throws(
    () => validatePostContent(validPost({ draft: true }), target),
    /retired metadata field: draft/
  );
});

test("writes files atomically and serializes concurrent mutations", async () => {
  const directory = await mkdtemp(join(tmpdir(), "wangqiwen-post-files-"));
  const target = join(directory, "nested", "post.mdx");
  const order: string[] = [];

  try {
    await writeFileAtomically(target, "first version");
    await writeFileAtomically(target, "second version");
    assert.equal(await readFile(target, "utf8"), "second version");

    await Promise.all([
      withPostMutationLock(async () => {
        order.push("first:start");
        await new Promise(resolve => setTimeout(resolve, 20));
        order.push("first:end");
      }),
      withPostMutationLock(async () => {
        order.push("second");
      }),
    ]);

    assert.deepEqual(order, ["first:start", "first:end", "second"]);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
