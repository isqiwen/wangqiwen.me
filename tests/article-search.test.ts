import assert from "node:assert/strict";
import test from "node:test";
import { searchArticles, type SearchableArticle } from "@/utils/search/articles";

const articles: SearchableArticle[] = [
  {
    id: "web-performance",
    title: "Making the Web Faster",
    description: "Reducing latency for websites.",
    summary: "",
    tags: ["performance", "web"],
    publishedAt: "2021-06-23",
  },
  {
    id: "next-release",
    title: "Next for Vercel",
    description: "A company update.",
    summary: "Web framework and product growth.",
    tags: ["next.js"],
    publishedAt: "2020-12-16",
  },
  {
    id: "code-golf",
    title: "An ode to code golf",
    description: "Lessons from programming puzzles.",
    summary: "",
    tags: ["programming"],
    publishedAt: "2020-04-26",
  },
];

test("searches article titles, descriptions, summaries, and tags", () => {
  assert.deepEqual(
    searchArticles(articles, "web").map(article => article.id),
    ["web-performance", "next-release"],
  );
  assert.deepEqual(searchArticles(articles, "puzzles").map(article => article.id), ["code-golf"]);
  assert.deepEqual(searchArticles(articles, "next.js").map(article => article.id), ["next-release"]);
});

test("requires every search term and shows latest articles without a query", () => {
  assert.deepEqual(searchArticles(articles, "web latency").map(article => article.id), ["web-performance"]);
  assert.deepEqual(searchArticles(articles, "web puzzles"), []);
  assert.deepEqual(
    searchArticles(articles, "").map(article => article.id),
    ["web-performance", "next-release", "code-golf"],
  );
});
