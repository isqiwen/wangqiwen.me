import assert from "node:assert/strict";
import test from "node:test";
import {
  getPostsForTopic,
  getRelatedPosts,
  getTopicSlug,
  getTopics,
  type TopicPost,
} from "@/utils/topics";

const posts: TopicPost[] = [
  {
    id: "first",
    publishedAt: "2020-01-01",
    series: "Web notes",
    tags: ["Frontend", "Web Performance"],
  },
  {
    id: "second",
    publishedAt: "2021-01-01",
    series: "Web notes",
    tags: ["Frontend"],
  },
  {
    id: "third",
    publishedAt: "2022-01-01",
    series: null,
    tags: ["Web Performance", "JavaScript"],
  },
  {
    id: "fourth",
    publishedAt: "2023-01-01",
    series: null,
    tags: ["Product"],
  },
];

test("creates stable topic slugs and counts unique article tags", () => {
  assert.equal(getTopicSlug(" Web Performance "), "web-performance");
  assert.deepEqual(getTopics([...posts, { ...posts[0], id: "duplicate", tags: ["Frontend", "Frontend"] }]), [
    { name: "Frontend", slug: "frontend", count: 3 },
    { name: "Web Performance", slug: "web-performance", count: 2 },
    { name: "JavaScript", slug: "javascript", count: 1 },
    { name: "Product", slug: "product", count: 1 },
  ]);
});

test("filters posts by topic and ranks shared tags before recency", () => {
  assert.deepEqual(
    getPostsForTopic(posts, "web-performance").map(post => post.id),
    ["first", "third"],
  );
  assert.deepEqual(
    getRelatedPosts(posts[0], posts).map(item => ({
      id: item.post.id,
      sharedTags: item.sharedTags,
    })),
    [
      { id: "second", sharedTags: ["Frontend"] },
      { id: "third", sharedTags: ["Web Performance"] },
    ],
  );
});
