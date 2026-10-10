import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPostById, getPostByRoute, getPosts } from "@/app/get-posts";
import type { PostManifest } from "@/utils/shared/post-manifest";

async function manifestPosts() {
  return (
    JSON.parse(await readFile("posts/manifest.json", "utf8")) as PostManifest
  ).posts;
}

test("lists published posts newest first and adds drafts only on request", async () => {
  const manifest = await manifestPosts();
  const published = manifest.filter(post => post.status === "published");
  const drafts = manifest.filter(post => post.status === "draft");
  assert.ok(published.length > 0, "the repository needs a published post");

  const posts = await getPosts();
  assert.deepEqual(
    posts.map(post => post.id),
    published.map(post => post.id)
  );
  assert.deepEqual(
    posts.map(post => post.publishedAt),
    [...posts.map(post => post.publishedAt)].sort().reverse()
  );

  const withDrafts = await getPosts({ includeDrafts: true });
  assert.equal(withDrafts.length, published.length + drafts.length);
  assert.equal(
    withDrafts.some(post => post.status === "archived"),
    false
  );
});

test("a post is rendered from the manifest alone, without view counts", async () => {
  const [first] = await getPosts();

  assert.match(first.date, /^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
  assert.ok(first.summary.length > 0);
  assert.equal("views" in first, false);
  assert.equal("path" in first, false);
});

test("finds a post only at its own year and only when it may be shown", async () => {
  const manifest = await manifestPosts();
  const published = manifest.find(post => post.status === "published")!;
  const year = published.publishedAt.slice(0, 4);

  assert.equal((await getPostByRoute(year, published.id))?.id, published.id);
  assert.equal(await getPostByRoute("1999", published.id), null);
  assert.equal(await getPostByRoute("20xx", published.id), null);
  assert.equal(await getPostById("no-such-post"), null);

  const draft = manifest.find(post => post.status === "draft");
  if (draft) {
    assert.equal(await getPostById(draft.id), null);
    assert.equal(
      (await getPostById(draft.id, { includeDrafts: true }))?.id,
      draft.id
    );
  }
});
