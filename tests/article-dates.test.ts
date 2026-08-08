import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PostDate } from "@/app/(post)/post-date";
import { formatUpdatedDate } from "@/utils/article-dates";

test("formats an update date without shifting its calendar day", () => {
  assert.equal(formatUpdatedDate("2026-08-08"), "August 8, 2026");
});

test("shows an update date only when a post has one", () => {
  const withUpdate = renderToStaticMarkup(
    createElement(PostDate, {
      post: {
        date: "August 1, 2026",
        publishedAt: "2026-08-01",
        updatedAt: "2026-08-08",
      },
    })
  );
  const withoutUpdate = renderToStaticMarkup(
    createElement(PostDate, {
      post: {
        date: "August 1, 2026",
        publishedAt: "2026-08-01",
        updatedAt: null,
      },
    })
  );

  assert.match(withUpdate, /Updated August 8, 2026/);
  assert.match(withUpdate, /dateTime="2026-08-08"/);
  assert.doesNotMatch(withoutUpdate, /Updated/);
});
