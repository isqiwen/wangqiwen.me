import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  createPostRegistrySource,
}: {
  createPostRegistrySource: (
    posts: Array<{ year: string; slug: string; status: string }>,
    options?: { publishedOnly?: boolean }
  ) => string;
} = require("../utils/shared/post-registry.js");

const posts = [
  { year: "2025", slug: "published-post", status: "published" },
  { year: "2026", slug: "draft-post", status: "draft" },
  { year: "2026", slug: "archived-post", status: "archived" },
];

test("build registry imports only published articles when requested", () => {
  const source = createPostRegistrySource(posts, { publishedOnly: true });

  assert.match(source, /published-post\/article\.mdx/);
  assert.doesNotMatch(source, /draft-post\/article\.mdx/);
  assert.doesNotMatch(source, /archived-post\/article\.mdx/);
});

test("local registry includes all lifecycle states for editor previews", () => {
  const source = createPostRegistrySource(posts);

  assert.match(source, /published-post\/article\.mdx/);
  assert.match(source, /draft-post\/article\.mdx/);
  assert.match(source, /archived-post\/article\.mdx/);
});
