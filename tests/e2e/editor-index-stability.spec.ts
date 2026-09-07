import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { expect, test, type APIResponse } from "@playwright/test";

const execFileAsync = promisify(execFile);

async function expectResponse(response: APIResponse, status = 200, json = true) {
  expect(response.status(), (await response.text()).slice(0, 2_000)).toBe(status);
  if (json) expect(response.headers()["content-type"]).toContain("application/json");
}

test("index regeneration cannot turn editor and public API routes into HTML 404s", async ({ request, baseURL }) => {
  const id = `index-stability-${randomUUID().slice(0, 8)}`;
  const path = `app/(post)/2092/${id}/article.mdx`;
  const origin = new URL(baseURL!).origin;
  const content = (status: string, revision: number) =>
    `export const metadata = ${JSON.stringify({ id, title: "Index stability fixture", description: "Exercises live index regeneration without request retries.", publishedAt: "2092-01-01", status, tags: [] }, null, 2)};\n\n## Introduction\n\nRevision ${revision}.\n`;

  // Warm the same route set used by the editor, then immediately interleave
  // mutations and reads. No sleeps, polling for success or mutation retries.
  try {
    await expectResponse(await request.get("/editor"), 200, false);
    await expectResponse(await request.get("/api/editor/list"));
    await expectResponse(await request.get("/api/posts"));
    const created = await request.post("/api/editor", {
      headers: { Origin: origin, "If-None-Match": "*" },
      data: { path, content: content("draft", 0) },
    });
    await expectResponse(created);
    let version = (await created.json()).version as string;

    for (let revision = 1; revision <= 12; revision += 1) {
      const status = ["draft", "published", "archived"][revision % 3];
      const [saved, editor, list, posts] = await Promise.all([
        request.post("/api/editor", {
          headers: { Origin: origin, "If-Match": version },
          data: { path, previousPath: path, content: content(status, revision) },
        }),
        request.get("/editor"),
        request.get("/api/editor/list"),
        request.get("/api/posts"),
      ]);
      await expectResponse(saved);
      await expectResponse(editor, 200, false);
      await expectResponse(list);
      await expectResponse(posts);
      version = (await saved.json()).version as string;
    }

    const deleted = await request.delete("/api/editor", {
      headers: { Origin: origin, "If-Match": version }, data: { path },
    });
    await expectResponse(deleted);
    await expectResponse(await request.get(`/api/editor?path=${encodeURIComponent(path)}`), 404);
  } finally {
    // Remove only this test's unique fixture, including after an assertion fails.
    await rm(join(process.cwd(), "app", "(post)", "2092", id), { recursive: true, force: true });
    await execFileAsync(process.execPath, ["scripts/content/sync-posts.cjs", "--silent"]);
  }
});
