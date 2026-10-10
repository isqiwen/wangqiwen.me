import assert from "node:assert/strict";
import test from "node:test";
import {
  findExportedMetadataBlock,
  formatExportedMetadata,
  normalizePostMetadata,
  parseExportedMetadata,
  replaceExportedMetadata,
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

test("replaces the metadata block with its canonical form and keeps the body", () => {
  const source =
    'export const metadata = {"id":"example","title":" Example ","description":"Summary.","publishedAt":"2026-01-02","status":"draft","series":"reliable-web-delivery","seriesOrder":2,"updatedAt":"2026-02-03"};\n\n\n## Body {braces}\n';
  const metadata = normalizePostMetadata(
    parseExportedMetadata<Record<string, unknown>>(source) ?? {},
    source
  );

  assert.deepEqual(Object.keys(metadata), [
    "title",
    "description",
    "publishedAt",
    "id",
    "status",
    "tags",
    "readingTimeMinutes",
    "series",
    "seriesOrder",
    "updatedAt",
  ]);
  assert.equal(metadata.title, "Example");
  assert.equal(
    replaceExportedMetadata(source, metadata),
    `${formatExportedMetadata(metadata)}## Body {braces}\n`
  );
  assert.equal(replaceExportedMetadata("## No metadata\n", metadata), null);
});
