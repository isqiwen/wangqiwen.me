import assert from "node:assert/strict";
import test from "node:test";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl } from "@/utils/site-config";

test("robots blocks non-public routes and advertises the sitemap", () => {
  const metadata = robots();

  assert.deepEqual(metadata.rules, {
    userAgent: "*",
    allow: "/",
    disallow: ["/api/", "/editor", "/links/"],
  });
  assert.equal(metadata.sitemap, getSiteUrl("/sitemap.xml"));
});

test("sitemap includes public pages and published posts only", async () => {
  const entries = await sitemap();
  const urls = entries.map(entry => entry.url);

  assert.ok(urls.includes(getSiteUrl("/")));
  assert.ok(urls.includes(getSiteUrl("/about")));
  assert.ok(urls.includes(getSiteUrl("/2021/making-the-web-faster")));
  assert.ok(urls.every(url => !url.includes("/editor") && !url.includes("/api/")));
});
