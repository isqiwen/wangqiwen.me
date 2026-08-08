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

test("requires citations to match one labeled bibliography item", () => {
  const issues = validateContentQuality(
    `<Citation refId="known-source" label="[1]" />\n<Citation refId="missing-source" label="[2]" />\n<Citation refId="known-source" label="[3]" />\n\n<Bibliography>\n  <BibliographyItem id="known-source" label="[1]" title="Known source" />\n  <BibliographyItem id="known-source" label="[2]" title="Duplicate source" />\n</Bibliography>`,
    { articlePaths }
  );

  assert.deepEqual(issues, [
    'line 7: bibliography item "known-source" is duplicated',
    'line 2: citation "missing-source" does not match a bibliography item',
    'line 3: citation "known-source" label "[3]" does not match bibliography label "[1]"',
  ]);
});

test("requires structured bibliography items without free child content", () => {
  const issues = validateContentQuality(
    `<Bibliography>
  <BibliographyItem id="missing-title" label="[1]" />
  <BibliographyItem id="annotation" label="[2]" title="Annotated source">A free-form annotation.</BibliographyItem>
</Bibliography>`,
    { articlePaths }
  );

  assert.deepEqual(issues, [
    "line 3: bibliography items must be self-closing; use the note prop for a necessary qualifier",
    'line 2: bibliography item "missing-title" is missing a title',
  ]);
});

test("accepts cross-references to stable article-local anchors", () => {
  const issues = validateContentQuality(
    `## Methods [#methods]

<Definition id="def-signal-model" title="Signal model" label="1">A measurement model.</Definition>
<TheoremBlock id="theorem-stability" kind="theorem">A stable update.</TheoremBlock>
<Algorithm id="alg-search" title="Search" steps={[{ statement: "return result" }]} />
<MathBlock id="eq-objective" tex="x = y" />
<EquationGroup equations={[{ id: "eq-update", tex: "x_{t+1} = x_t" }]} />
<Figure id="fig-reconstruction">A figure.</Figure>
<Table id="table-results"><TBody /></Table>
<RegressionTable id="table-estimates" title="Estimates" models={[]} panels={[]} />
<Chart id="fig-curve" series={[{ label: "Validation", data: [1, 2] }]} />
<SourceExcerpt id="source-minute" source="Synthetic fixture" transcription="Text" />
<ScatterPlot id="fig-scatter" series={[]} />
<Histogram id="fig-histogram" bins={[]} />
<BoxPlot id="fig-distribution" items={[]} />

See <CrossReference target="methods" label="Methods" />, <CrossReference target="def-signal-model" label="Definition 1" />, <CrossReference target="theorem-stability" label="Theorem 1" />, <CrossReference target="alg-search" label="Algorithm 1" />, <CrossReference target="eq-objective" label="Equation (1)" />, <CrossReference target="eq-update" label="Equation (2)" />, <CrossReference target="fig-reconstruction" label="Figure 1" />, <CrossReference target="table-results" label="Table 1" />, <CrossReference target="table-estimates" label="Table 2" />, <CrossReference target="fig-curve" label="Figure 2" />, <CrossReference target="source-minute" label="Source 1" />, <CrossReference target="fig-scatter" label="Figure 3" />, <CrossReference target="fig-histogram" label="Figure 4" />, and <CrossReference target="fig-distribution" label="Figure 5" />.`,
    { articlePaths }
  );

  assert.deepEqual(issues, []);
});

test("reports invalid academic cross-references before publication", () => {
  const issues = validateContentQuality(
    `<Definition title="Missing ID">A term without an anchor.</Definition>
<CrossReference target="missing-target" label="Missing" />
<CrossReference target="def-known" />
<Definition id="def-known" title="Known">A known term.</Definition>
<TheoremBlock id="def-known">A duplicate anchor.</TheoremBlock>`,
    { articlePaths }
  );

  assert.deepEqual(issues, [
    'line 5: reference target "def-known" is duplicated',
    "line 1: definition is missing a stable id",
    'line 2: cross reference target "missing-target" does not exist in this article',
    'line 3: cross reference "def-known" is missing a label',
  ]);
});

test("requires source excerpts to identify their witness and describe a facsimile", () => {
  const issues = validateContentQuality(
    `<SourceExcerpt transcription="A transcription" />
<SourceExcerpt source="Ledger" facsimile={{ src: "/ledger.jpg", alt: "" }} />`,
    { articlePaths }
  );

  assert.deepEqual(issues, [
    "line 1: source excerpt is missing a source identity",
    "line 2: source excerpt facsimile is missing alt text",
  ]);
});
