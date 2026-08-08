import assert from "node:assert/strict";
import test from "node:test";
import {
  getPostsForSeries,
  getSeries,
  getSeriesContext,
  getSeriesDefinition,
  isKnownSeries,
  type SeriesPost,
} from "@/utils/series";

const posts: SeriesPost[] = [
  {
    id: "third",
    publishedAt: "2026-08-03",
    series: "reliable-web-delivery",
    seriesOrder: 3,
  },
  {
    id: "first",
    publishedAt: "2026-08-01",
    series: "reliable-web-delivery",
    seriesOrder: 1,
  },
  {
    id: "second",
    publishedAt: "2026-08-02",
    series: "reliable-web-delivery",
    seriesOrder: 2,
  },
  {
    id: "standalone",
    publishedAt: "2026-08-04",
    series: null,
    seriesOrder: null,
  },
];

test("uses a controlled series catalog", () => {
  assert.equal(isKnownSeries("reliable-web-delivery"), true);
  assert.equal(isKnownSeries("Reliable Web Delivery"), false);
  assert.equal(
    getSeriesDefinition("reliable-web-delivery")?.title,
    "Reliable Web Delivery"
  );
  assert.equal(getSeriesDefinition("unknown"), null);
});

test("lists only populated series and preserves explicit reading order", () => {
  assert.deepEqual(getSeries(posts), [
    {
      slug: "reliable-web-delivery",
      title: "Reliable Web Delivery",
      description:
        "A practical sequence for defining, measuring, and protecting the reliability of a production web application.",
      count: 3,
    },
  ]);
  assert.deepEqual(
    getPostsForSeries(posts, "reliable-web-delivery").map(post => post.id),
    ["first", "second", "third"]
  );
});

test("provides the current position and neighboring articles", () => {
  const context = getSeriesContext(posts[2], posts);

  assert.equal(context?.position, 2);
  assert.equal(context?.posts.length, 3);
  assert.equal(context?.previous?.id, "first");
  assert.equal(context?.next?.id, "third");
  assert.equal(getSeriesContext(posts[3], posts), null);
});
