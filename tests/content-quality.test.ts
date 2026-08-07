import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  validateContentQuality,
}: {
  validateContentQuality: (
    source: string,
    options: { articlePaths: Set<string> }
  ) => string[];
} = require("../scripts/content/lib/content-quality.js");

const articlePaths = new Set(["/2024/real-post"]);

test("accepts accessible images, ordered headings, and real article links", () => {
  const issues = validateContentQuality(
    `## Introduction\n\n![Diagram](https://example.com/diagram.png)\n\n<Image src="/images/cover.png" alt={"Cover image"} />\n\n<Image alt={<span>Diagram detail</span>} src="/images/detail.png" />\n\n### Details\n\n[Read more](/2024/real-post#details)`,
    { articlePaths }
  );

  assert.deepEqual(issues, []);
});

test("reports missing alt text, invalid heading hierarchy, and missing articles", () => {
  const issues = validateContentQuality(
    `# Duplicate page title\n\n![ ](/images/missing-alt.png)\n\n<Image src="/images/other.png" alt="" />\n\n#### Skipped heading\n\n[Missing](/2024/missing-post)\n\n\`\`\`md\n# ignored code heading\n![ignored](/ignored.png)\n\`\`\``,
    { articlePaths }
  );

  assert.deepEqual(issues, [
    "line 3: image is missing alt text",
    "line 5: image is missing alt text",
    "line 1: do not use h1; article metadata renders the page h1",
    "line 7: heading level jumps from h1 to h4",
    'line 9: internal article link "/2024/missing-post" does not exist',
  ]);
});
