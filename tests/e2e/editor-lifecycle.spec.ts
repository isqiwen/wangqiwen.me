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
  await execFileAsync(
    process.execPath,
    ["scripts/content/sync-posts.cjs", "--silent"],
    {
      cwd: root,
    }
  );
});

test("creates, publishes, restores, and deletes a draft from the editor", async ({
  page,
}) => {
  const articleBody =
    "## Introduction\n\nThis post exists only while the browser test runs.\n\n### Detail\n\nThe outline includes this section.\n";

  await page.goto("/editor");
  await expect(page.locator("main[aria-busy='false']")).toBeVisible();
  await expect(
    page.getByText(/^\d+ writing essentials$/)
  ).toBeVisible();
  await expect(
    page.getByText("AblationTable", { exact: true })
  ).not.toBeVisible();
  await expect(page.getByTestId("advanced-components-toggle")).toHaveText(
    /Show \d+ advanced components/
  );
  await page.getByTestId("advanced-components-toggle").click();
  await expect(page.getByText("AblationTable", { exact: true })).toBeVisible();
  const algorithmCard = page
    .getByText("Algorithm", { exact: true })
    .locator("xpath=../../..");
  await algorithmCard.getByRole("button", { name: "Configure" }).click();
  await expect(
    page.getByText("Pseudocode steps", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Add step" }).click();
  await expect(
    page.getByRole("button", { name: "Move Step 6 up" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByTestId("advanced-components-toggle").click();

  await page.getByRole("button", { name: "New Draft" }).click();
  const discardConfirmation = page.getByRole("dialog", {
    name: "Discard unsaved changes?",
  });
  await expect(discardConfirmation).toBeVisible();
  await discardConfirmation
    .getByRole("button", { name: "Discard and start new" })
    .click();
  await expect(discardConfirmation).not.toBeVisible();
  await page.getByLabel("Title").fill("Browser editor lifecycle");
  await page.getByLabel("ID").fill(postId);
  await page.getByLabel("Published At (YYYY-MM-DD)").fill(publishedAt);
  await page
    .getByLabel("Search & sharing description")
    .fill("Verifies the complete editor lifecycle in a real browser.");
  const bodyEditor = page.getByLabel("Body (MDX)");
  await bodyEditor.fill(articleBody);
  const syntaxHighlight = page.getByTestId("mdx-syntax-highlight");
  await expect(syntaxHighlight).toContainText("## Introduction");
  expect(await syntaxHighlight.locator("span").count()).toBeGreaterThan(0);

  const outline = page.getByRole("navigation", { name: "Article outline" });
  await expect(
    outline.getByRole("button", { name: /Introduction/ })
  ).toBeVisible();
  await expect(outline.getByRole("button", { name: /Detail/ })).toBeVisible();
  await outline.getByRole("button", { name: /Detail/ }).click();
  await expect(bodyEditor).toBeFocused();
  const cursorPosition = await bodyEditor.evaluate(
    element => (element as HTMLTextAreaElement).selectionStart
  );
  expect(cursorPosition).toBe(articleBody.indexOf("### Detail"));

  await bodyEditor.fill("#### Skipped heading");
  await expect(
    page.locator("[role='alert']").filter({ hasText: "Fix heading hierarchy" })
  ).toContainText("first heading must be h2");
  await bodyEditor.fill(articleBody);
  await expect(bodyEditor).toHaveValue(articleBody);

  await bodyEditor.fill("selected text");
  await expect(bodyEditor).toHaveValue("selected text");
  await bodyEditor.selectText();
  await bodyEditor.press("ControlOrMeta+B");
  await expect(bodyEditor).toHaveValue("**selected text**");
  await bodyEditor.fill("link text");
  await expect(bodyEditor).toHaveValue("link text");
  await bodyEditor.selectText();
  await bodyEditor.press("ControlOrMeta+K");
  await expect(bodyEditor).toHaveValue("[link text](https://)");
  await bodyEditor.fill(articleBody);
  await expect(bodyEditor).toHaveValue(articleBody);

  await saveFromEditor(page, "Save Draft");
  await expect(page.getByText("draft", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Preview" })).toBeVisible();

  await bodyEditor.fill("## Introduction\n\nThis line is not saved yet.\n");
  await page.getByRole("button", { name: "Changes" }).click();
  const changes = page.getByRole("dialog", { name: "Changes" });
  await expect(changes).toBeVisible();
  await expect(changes.locator("pre")).toContainText(
    "+This line is not saved yet."
  );
  await page.getByRole("button", { name: "Saved file vs Git HEAD" }).click();
  await expect(changes.locator("pre")).toContainText(
    "Browser editor lifecycle"
  );
  await changes.getByRole("button", { name: "Close" }).click();
  await saveFromEditor(page, "Save Draft");

  await publishFromEditor(page);
  await expect(page.getByText("published", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Move To Draft" })
  ).toBeVisible();

  await saveFromEditor(page, "Move To Draft");
  await expect(page.getByText("draft", { exact: true })).toBeVisible();

  await publishFromEditor(page);
  await archiveFromEditor(page);
  await expect(page.getByText("archived", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Restore To Draft" })
  ).toBeVisible();

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
  await expect(
    page.getByText(`Deleted: app/(post)/2090/${postId}/article.mdx`)
  ).toBeVisible();
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
  const confirmation = page.getByRole("dialog", { name: "Publish Post" });
  await expect(confirmation).toBeVisible();
  await expect(
    confirmation.getByText(/It remains local until you commit and deploy/)
  ).toBeVisible();
  await expect(
    confirmation.getByRole("heading", { name: "Publish readiness" })
  ).toBeVisible();
  await expect(
    confirmation.getByText("Description", { exact: true })
  ).toBeVisible();
  await expect(
    confirmation.getByText("Heading hierarchy", { exact: true })
  ).toBeVisible();

  const published = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === "/api/editor/publish" &&
      response.request().method() === "POST" &&
      response.ok()
  );
  await confirmation
    .getByRole("button", { name: "Publish", exact: true })
    .click();
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
