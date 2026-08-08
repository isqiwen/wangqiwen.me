import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const postId = `editor-e2e-${randomUUID().slice(0, 8)}`;
const publishedAt = "2090-01-01";
const postDirectory = join(root, "app", "(post)", "2090", postId);

test.afterEach(async () => {
  await rm(postDirectory, { force: true, recursive: true });
  await execFileAsync(process.execPath, ["scripts/content/sync-posts.cjs", "--silent"], {
    cwd: root,
  });
});

test("creates, publishes, restores, and deletes a draft from the editor", async ({
  page,
}) => {
  await page.goto("/editor");
  await expect(page.locator("main[aria-busy='false']")).toBeVisible();

  await page.getByRole("button", { name: "New Draft" }).click();
  await page.getByLabel("Title").fill("Browser editor lifecycle");
  await page.getByLabel("ID").fill(postId);
  await page
    .getByLabel("Published At (YYYY-MM-DD)")
    .fill(publishedAt);
  await page
    .getByLabel("Search & sharing description")
    .fill("Verifies the complete editor lifecycle in a real browser.");
  await page
    .getByLabel("Body (MDX)")
    .fill("## Introduction\n\nThis post exists only while the browser test runs.\n");

  await saveFromEditor(page, "Save Draft");
  await expect(page.getByText("draft", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Preview" })).toBeVisible();

  await publishFromEditor(page);
  await expect(page.getByText("published", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Move To Draft" })).toBeVisible();

  await saveFromEditor(page, "Move To Draft");
  await expect(page.getByText("draft", { exact: true })).toBeVisible();

  await publishFromEditor(page);
  await archiveFromEditor(page);
  await expect(page.getByText("archived", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore To Draft" })).toBeVisible();

  await saveFromEditor(page, "Restore To Draft");
  await expect(page.getByText("draft", { exact: true })).toBeVisible();

  const deletion = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === "/api/editor" &&
      response.request().method() === "DELETE" &&
      response.ok()
  );
  await page.getByRole("button", { name: "Delete Draft" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await deletion;
  await expect(page.getByText(`Deleted: app/(post)/2090/${postId}/article.mdx`)).toBeVisible();
});

async function saveFromEditor(page: Page, buttonName: string) {
  const saved = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === "/api/editor" &&
      response.request().method() === "POST" &&
      response.ok()
  );
  await page.getByRole("button", { name: buttonName }).click();
  await saved;
}

async function publishFromEditor(page: Page) {
  await page.getByRole("button", { name: "Publish Post" }).click();
  await expect(
    page.getByText(/It remains local until you commit and deploy/)
  ).toBeVisible();

  const published = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === "/api/editor/publish" &&
      response.request().method() === "POST" &&
      response.ok()
  );
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await published;
}

async function archiveFromEditor(page: Page) {
  await page.getByRole("button", { name: "Archive Post" }).click();

  const archived = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === "/api/editor" &&
      response.request().method() === "POST" &&
      response.ok()
  );
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await archived;
}
