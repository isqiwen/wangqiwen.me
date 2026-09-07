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
const postPath = `app/(post)/2090/${postId}/article.mdx`;
const postDirectory = join(root, "app", "(post)", "2090", postId);
const articleBody = "## Introduction\n\nThis post exists only while the browser test runs.\n\n### Detail\n\nThe outline includes this section.\n";

test.beforeEach(async ({ page }) => {
  await page.goto("/editor");
  await expect(page.locator("main[aria-busy='false']")).toBeVisible();
});

test.afterEach(async () => {
  await rm(postDirectory, { force: true, recursive: true });
  await execFileAsync(process.execPath, ["scripts/content/sync-posts.cjs", "--silent"], { cwd: root });
});

// Independent UI journeys should not share one 30-second test budget.
test("shows advanced components and configures pseudocode steps", async ({ page }) => {
  await createDraft(page);
  // The article can contain component names; only inspect the library cards.
  await page.getByLabel("Body (MDX)").fill("## Components\n\n<AblationTable />\n\n<Algorithm />\n");
  await expect(page.getByTestId("mdx-syntax-highlight")).toContainText("AblationTable");
  const library = page.getByRole("heading", { name: "Component Library", exact: true }).locator("..");
  await expect(library.getByText(/^\d+ writing essentials$/)).toBeVisible();
  await expect(library.getByText("AblationTable", { exact: true })).not.toBeVisible();
  await expect(page.getByTestId("advanced-components-toggle")).toHaveText(/Show \d+ advanced components/);
  await page.getByTestId("advanced-components-toggle").click();
  await expect(library.getByText("AblationTable", { exact: true })).toBeVisible();
  const card = library.getByText("Algorithm", { exact: true }).locator("xpath=../../..");
  await card.getByRole("button", { name: "Configure" }).click();
  await expect(page.getByText("Pseudocode steps", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add step" }).click();
  await expect(page.getByRole("button", { name: "Move Step 6 up" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
});

test("edits, validates, formats and compares a draft", async ({ page }) => {
  await createDraft(page);
  const editor = page.getByLabel("Body (MDX)");
  const highlight = page.getByTestId("mdx-syntax-highlight");
  await expect(highlight).toContainText("## Introduction");
  expect(await highlight.locator("span").count()).toBeGreaterThan(0);
  const outline = page.getByRole("navigation", { name: "Article outline" });
  await expect(outline.getByRole("button", { name: /Introduction/ })).toBeVisible();
  await outline.getByRole("button", { name: /Detail/ }).click();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate(element => (element as HTMLTextAreaElement).selectionStart))
    .toBe(articleBody.indexOf("### Detail"));
  await editor.fill("#### Skipped heading");
  await expect(page.locator("[role='alert']").filter({ hasText: "Fix heading hierarchy" }))
    .toContainText("first heading must be h2");
  await editor.fill("selected text");
  await editor.selectText();
  await editor.press("ControlOrMeta+B");
  await expect(editor).toHaveValue("**selected text**");
  await editor.fill("link text");
  await editor.selectText();
  await editor.press("ControlOrMeta+K");
  await expect(editor).toHaveValue("[link text](https://)");
  await editor.fill(articleBody);
  await saveFromEditor(page, "Save Draft");
  await expect(page.getByRole("link", { name: "Open Preview" })).toBeVisible();
  await editor.fill("## Introduction\n\nThis line is not saved yet.\n");
  await page.getByRole("button", { name: "Changes" }).click();
  const changes = page.getByRole("dialog", { name: "Changes" });
  await expect(changes.locator("pre")).toContainText("+This line is not saved yet.");
  await page.getByRole("button", { name: "Saved file vs Git HEAD" }).click();
  await expect(changes.locator("pre")).toContainText("Browser editor lifecycle");
  await changes.getByRole("button", { name: "Close" }).click();
  await saveFromEditor(page, "Save Draft");
});

test("publishes, archives, restores and deletes a saved article", async ({ page }) => {
  await createDraft(page);
  await saveFromEditor(page, "Save Draft");
  await publishFromEditor(page);
  await expect(page.getByText("published", { exact: true })).toBeVisible();
  await saveFromEditor(page, "Move To Draft");
  await expect(page.getByText("draft", { exact: true })).toBeVisible();
  await publishFromEditor(page);
  await page.getByRole("button", { name: "Archive Post" }).click();
  await expectMutation(page, () => page.getByRole("button", { name: "Archive", exact: true }).click());
  await expect(page.getByText("archived", { exact: true })).toBeVisible();
  await saveFromEditor(page, "Restore To Draft");
  await expect(page.getByText("draft", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete Draft" }).click();
  await expectMutation(page, () =>
    page.getByRole("dialog", { name: "Delete Draft" })
      .getByRole("button", { name: "Delete", exact: true }).click(), "DELETE");
  // Reopening another draft can replace the short-lived deletion toast.
  const response = await page.request.get(`/api/editor?path=${encodeURIComponent(postPath)}`);
  expect(response.status(), await response.text()).toBe(404);
});

test("rejects cross-origin and originless editor mutations", async ({ page }) => {
  const cases: Record<string, string>[] = [{}, { Origin: "https://untrusted.example" }];
  for (const headers of cases) {
    const response = await page.request.post("/api/editor", { headers, data: {} });
    expect(response.status(), await response.text()).toBe(403);
  }
});

async function createDraft(page: Page) {
  await page.getByRole("button", { name: "New Draft" }).click();
  const discard = page.getByRole("dialog", { name: "Discard unsaved changes?" });
  if (await discard.isVisible()) {
    await discard.getByRole("button", { name: "Discard and start new" }).click();
  }
  await expect(page.getByLabel("Title")).toHaveValue("");
  await page.getByLabel("Title").fill("Browser editor lifecycle");
  await page.getByLabel("ID").fill(postId);
  await page.getByLabel("Published At (YYYY-MM-DD)").fill(publishedAt);
  await page.getByLabel("Search & sharing description").fill("Verifies authoring and publishing in a real browser.");
  await page.getByLabel("Body (MDX)").fill(articleBody);
}

async function expectMutation(page: Page, action: () => Promise<unknown>, method = "POST", endpoint = "/api/editor") {
  const [response] = await Promise.all([
    page.waitForResponse(response =>
      new URL(response.url()).pathname === endpoint && response.request().method() === method,
    { timeout: 15_000 }),
    action(),
  ]);
  // A dev response can expose headers before Playwright retrieves its body.
  // Successful writes need no body read; errors always report their status.
  if (!response.ok()) {
    const detail = await Promise.race([
      response.text().catch(() => "Response body unavailable."),
      new Promise<string>(resolve => setTimeout(() => resolve("Response body unavailable within 2s."), 2_000)),
    ]);
    throw new Error(`${method} ${endpoint}: HTTP ${response.status()} ${detail.slice(0, 2_000)}`);
  }
}

async function saveFromEditor(page: Page, name: string) {
  await expectMutation(page, () => page.getByRole("button", { name, exact: true }).click());
}

async function publishFromEditor(page: Page) {
  await page.getByRole("button", { name: "Publish Post" }).click();
  const confirmation = page.getByRole("dialog", { name: "Publish Post" });
  await expect(confirmation.getByText(/It remains local until you commit and deploy/)).toBeVisible();
  await expect(confirmation.getByRole("heading", { name: "Publish readiness" })).toBeVisible();
  await expect(confirmation.getByText("Description", { exact: true })).toBeVisible();
  await expect(confirmation.getByText("Heading hierarchy", { exact: true })).toBeVisible();
  await expectMutation(page, () => confirmation.getByRole("button", { name: "Publish", exact: true }).click(),
    "POST", "/api/editor");
}
