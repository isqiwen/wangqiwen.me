import assert from "node:assert/strict";
import test from "node:test";
import {
  findExportedMetadataBlock,
  parseExportedMetadata,
  stripExportedMetadata,
} from "@/utils/shared/post-metadata";

test("parses and removes exported JSON metadata", () => {
  const source = `export const metadata = {
  "id": "safe-post",
  "title": "A title with { braces }"
};

# Body`;

  assert.deepEqual(parseExportedMetadata(source), {
    id: "safe-post",
    title: "A title with { braces }",
  });
  assert.equal(stripExportedMetadata(source), "# Body");
});

test("returns null for missing or non-JSON metadata", () => {
  assert.equal(parseExportedMetadata("# Body"), null);
  assert.equal(
    parseExportedMetadata("export const metadata = { id: 'not-json' };"),
    null,
  );
});

test("finds the complete metadata block before the MDX body", () => {
  const source = `export const metadata = {"id":"post"};\n\nParagraph`;
  const block = findExportedMetadataBlock(source);

  assert.ok(block);
  assert.equal(block.literal, '{"id":"post"}');
  assert.equal(source.slice(block.end), "Paragraph");
});
