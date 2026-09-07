import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const execFileAsync = promisify(execFile);
const directories = new Set<string>();
let id: string;
let path: string;
const origin = "http://127.0.0.1:3101";
const initialBody = "## Introduction\n\nInitial saved text.\n";

function source(postId: string, body = initialBody, status = "draft") {
  return `export const metadata = ${JSON.stringify({ id: postId, title: "Save conflict fixture", description: "Tests versioned editor mutations.", publishedAt: "2091-01-01", status, tags: [] }, null, 2)};\n\n${body}`;
}

function filePath(postId: string) {
  directories.add(join(process.cwd(), "app", "(post)", "2091", postId));
  return `app/(post)/2091/${postId}/article.mdx`;
}

async function read(request: APIRequestContext, target = path) {
  const response = await request.get(`/api/editor?path=${encodeURIComponent(target)}`);
  expect(response.status()).toBe(200);
  const data = await response.json() as { content: string; version: string };
  expect(response.headers().etag).toBe(data.version);
  return data;
}

async function update(request: APIRequestContext, version: string, content: string, target = path) {
  return request.post("/api/editor", { headers: { Origin: origin, "If-Match": version }, data: { path: target, previousPath: path, content } });
}

async function open(page: Page) {
  await page.goto("/editor");
  await expect(page.locator("main[aria-busy='false']")).toBeVisible();
  await expect(page.getByLabel("ID", { exact: true })).toHaveValue(id);
}

async function clickSave(page: Page, expectedStatus = 200) {
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === "/api/editor" && r.request().method() === "POST"),
    page.getByRole("button", { name: "Save Draft", exact: true }).click(),
  ]);
  expect(response.status()).toBe(expectedStatus);
  if (expectedStatus === 200) {
    await expect(page.getByTestId("editor-save-status")).toHaveText("All changes saved to disk");
  }
}

test.beforeEach(async ({ request }) => {
  id = `save-conflict-${randomUUID().slice(0, 8)}`;
  path = filePath(id);
  const response = await request.post("/api/editor", {
    headers: { Origin: origin, "If-None-Match": "*" }, data: { path, content: source(id) },
  });
  expect(response.status(), await response.text()).toBe(200);
});

test.afterEach(async () => {
  for (const directory of directories) await rm(directory, { recursive: true, force: true });
  directories.clear();
  await execFileAsync(process.execPath, ["scripts/content/sync-posts.cjs", "--silent"], { cwd: process.cwd() });
});

test("two tabs cannot overwrite each other and conflict input can be downloaded or kept as a copy", async ({ page, context, request }) => {
  await open(page);
  const other = await context.newPage();
  await open(other);
  await page.getByLabel("Body (MDX)").fill("## Introduction\n\nSaved by tab A.\n");
  await clickSave(page);
  const myDraft = "## Introduction\n\nUnsaved work from tab B.\n";
  await other.getByLabel("Body (MDX)").fill(myDraft);
  await clickSave(other, 412);
  const conflict = other.getByRole("alert", { name: "Save conflict" });
  await expect(conflict).toBeVisible();
  await expect(other.getByLabel("Body (MDX)")).toHaveValue(myDraft);
  expect((await read(request)).content).toContain("Saved by tab A.");
  await conflict.getByRole("button", { name: "Compare with latest" }).click();
  await expect(other.getByTestId("conflict-latest")).toContainText("Saved by tab A.");
  await expect(other.getByTestId("conflict-local")).toContainText("Unsaved work from tab B.");
  const downloadPromise = other.waitForEvent("download");
  await conflict.getByRole("button", { name: "Download my draft" }).click();
  const download = await downloadPromise;
  expect(await readFile((await download.path())!, "utf8")).toContain("Unsaved work from tab B.");
  await conflict.getByRole("button", { name: "Keep as new draft" }).click();
  const copyId = await other.getByLabel("ID", { exact: true }).inputValue();
  expect(copyId).not.toBe(id);
  const copyPath = filePath(copyId);
  await clickSave(other);
  expect((await read(request, copyPath)).content).toContain("Unsaved work from tab B.");
  expect((await read(request)).content).toContain("Saved by tab A.");
});

test("a delayed save acknowledges only submitted text and blocks overlapping lifecycle actions", async ({ page, request }) => {
  await open(page);
  let release!: () => void;
  let received!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const reached = new Promise<void>(resolve => { received = resolve; });
  await page.route("**/api/editor", async route => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    received();
    await held;
    await route.fulfill({ response });
  });
  const submitted = "## Introduction\n\nSubmitted text.\n";
  const newer = "## Introduction\n\nTyped while save was pending.\n";
  await page.getByLabel("Body (MDX)").fill(submitted);
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await reached;
  try {
    await expect(page.getByRole("button", { name: "Save Draft", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "New Draft", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Load", exact: true })).toBeDisabled();
    await page.getByLabel("Body (MDX)").fill(newer);
    await page.getByLabel("Title", { exact: true }).fill("Newer title");
  } finally { release(); }
  await expect(page.getByTestId("editor-save-status")).toHaveText("Unsaved changes");
  await expect(page.getByLabel("Body (MDX)")).toHaveValue(newer);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Newer title");
  expect((await read(request)).content).toContain("Submitted text.");
  await page.unroute("**/api/editor");
  await clickSave(page);
  const saved = await read(request);
  expect(saved.content).toContain("Typed while save was pending.");
  expect(saved.content).toContain("Newer title");
});

test("loading the latest conflicting file requires confirmation and cancellation keeps input", async ({ page, request }) => {
  await open(page);
  const original = await read(request);
  expect((await update(request, original.version, source(id, "## Introduction\n\nExternal revision.\n"))).status()).toBe(200);
  const local = "## Introduction\n\nMy local work.\n";
  await page.getByLabel("Body (MDX)").fill(local);
  await clickSave(page, 412);
  const conflict = page.getByRole("alert", { name: "Save conflict" });
  await conflict.getByRole("button", { name: "Reload latest" }).click();
  const dialog = page.getByRole("dialog", { name: "Discard unsaved changes?" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Body (MDX)")).toHaveValue(local);
  await conflict.getByRole("button", { name: "Reload latest" }).click();
  await dialog.getByRole("button", { name: "Discard and reload" }).click();
  await expect(conflict).not.toBeVisible();
  await expect(page.getByLabel("Body (MDX)")).toHaveValue("## Introduction\n\nExternal revision.\n");
  await clickSave(page);
});

test("a failed save keeps input dirty and allows a safe retry", async ({ page, request }) => {
  await open(page);
  const original = await read(request);
  await page.route("**/api/editor", route => route.fulfill({ status: 503, json: { error: "Simulated temporary failure" } }));
  const draft = "## Introduction\n\nKeep this after failure.\n";
  await page.getByLabel("Body (MDX)").fill(draft);
  await clickSave(page, 503);
  await expect(page.getByLabel("Body (MDX)")).toHaveValue(draft);
  await expect(page.getByTestId("editor-save-status")).toHaveText("Unsaved changes");
  expect((await read(request)).version).toBe(original.version);
  await page.unroute("**/api/editor");
  await clickSave(page);
});

test("autosave recovery retains its original base version instead of adopting a newer disk version", async ({ page, request }) => {
  await open(page);
  const original = await read(request);
  const draft = "## Introduction\n\nRecovered unsaved input.\n";
  await page.getByLabel("Body (MDX)").fill(draft);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("mdx-editor.local-autosave.v2") || "null")?.body)).toBe(draft);
  expect((await update(request, original.version, source(id, "## Introduction\n\nNew disk version.\n"))).status()).toBe(200);
  page.once("dialog", dialog => dialog.accept());
  await page.reload();
  await expect(page.locator("main[aria-busy='false']")).toBeVisible();
  await expect(page.getByLabel("Body (MDX)")).toHaveValue(draft);
  await clickSave(page, 412);
  await expect(page.getByRole("alert", { name: "Save conflict" })).toBeVisible();
  expect((await read(request)).content).toContain("New disk version.");
});

test("version checks cover missing headers, simultaneous updates, rename and delete conflicts", async ({ request }) => {
  const old = await read(request);
  const payload = { path, previousPath: path, content: source(id, "## Introduction\n\nNo precondition.\n") };
  expect((await request.post("/api/editor", { headers: { Origin: origin }, data: payload })).status()).toBe(428);
  expect((await request.post("/api/editor", { headers: { Origin: origin, "If-Match": "*" }, data: payload })).status()).toBe(400);
  const results = await Promise.all([
    update(request, old.version, source(id, "## Introduction\n\nWriter one.\n")),
    update(request, old.version, source(id, "## Introduction\n\nWriter two.\n")),
  ]);
  expect(results.map(r => r.status()).sort()).toEqual([200, 412]);
  const winner = await read(request);
  const movedId = `${id}-moved`;
  const movedPath = filePath(movedId);
  expect((await update(request, old.version, source(movedId), movedPath)).status()).toBe(412);
  expect((await request.delete("/api/editor", { headers: { Origin: origin, "If-Match": old.version }, data: { path } })).status()).toBe(412);
  expect((await read(request)).version).toBe(winner.version);
  expect((await update(request, winner.version, source(movedId), movedPath)).status()).toBe(200);
  expect((await update(request, winner.version, source(id))).status()).toBe(412);
  expect((await request.get(`/api/editor?path=${encodeURIComponent(path)}`)).status()).toBe(404);
  const moved = await read(request, movedPath);
  expect((await request.delete("/api/editor", { headers: { Origin: origin, "If-Match": moved.version }, data: { path: movedPath } })).status()).toBe(200);
  expect((await request.delete("/api/editor", { headers: { Origin: origin, "If-Match": moved.version }, data: { path: movedPath } })).status()).toBe(412);
});

test("external disk edits, create collisions and failed publication never destroy the saved version", async ({ request }) => {
  const old = await read(request);
  const external = source(id, "## Introduction\n\nWritten outside the editor.\n");
  await writeFile(join(process.cwd(), path), external, "utf8");
  expect((await update(request, old.version, source(id))).status()).toBe(412);
  const current = await read(request);
  expect((await request.post("/api/editor", { headers: { Origin: origin, "If-None-Match": "*" }, data: { path, content: source(id) } })).status()).toBe(412);
  expect((await update(request, current.version, source(id, "# Invalid heading\n", "published"))).status()).toBe(500);
  expect((await read(request)).content).toBe(external);
  expect((await read(request)).version).toBe(current.version);
});
