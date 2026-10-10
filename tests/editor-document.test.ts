import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMdxContent,
  buildWorkspaceSnapshot,
  createEmptyEditorDocument,
  parseEditorDocument,
  serializeWorkspaceSnapshot,
  toDocumentState,
} from "@/app/editor/workspace/document";
import type { EditorDocumentState } from "@/app/editor/workspace/types";

const path = "content/posts/2026/example-post/article.mdx";
const state: EditorDocumentState = {
  ...createEmptyEditorDocument(),
  title: "Example",
  description: "Summary.",
  publishedAt: "2026-03-04",
  id: "example-post",
  tagsInput: "Frontend, Product",
  body: "## Introduction\n\nBody.\n",
};

test("snapshots serialize identically whatever object supplied the fields", () => {
  const expected = serializeWorkspaceSnapshot(
    buildWorkspaceSnapshot(state, path)
  );
  const reordered = Object.fromEntries(
    Object.entries(state).reverse()
  ) as EditorDocumentState;
  // A previous snapshot carries activePath and targetPath as extra fields.
  const fromSnapshot = { ...buildWorkspaceSnapshot(state, "another/path.mdx") };

  assert.equal(
    serializeWorkspaceSnapshot(buildWorkspaceSnapshot(reordered, path)),
    expected
  );
  assert.equal(
    serializeWorkspaceSnapshot(buildWorkspaceSnapshot(fromSnapshot, path)),
    expected
  );
  assert.deepEqual(Object.keys(toDocumentState(fromSnapshot)), [
    "title",
    "description",
    "summary",
    "series",
    "seriesOrder",
    "publishedAt",
    "updatedAt",
    "id",
    "status",
    "tagsInput",
    "body",
  ]);
});

test("a saved document reloads as the state that produced it", () => {
  const saved = buildMdxContent(state);

  assert.deepEqual(parseEditorDocument(saved, path), state);
  assert.equal(
    serializeWorkspaceSnapshot(
      buildWorkspaceSnapshot(parseEditorDocument(saved, path), path)
    ),
    serializeWorkspaceSnapshot(buildWorkspaceSnapshot(state, path))
  );
  assert.equal(
    buildWorkspaceSnapshot(state, null).targetPath,
    "content/posts/2026/example-post/article.mdx"
  );
});
