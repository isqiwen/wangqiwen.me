import assert from "node:assert/strict";
import test from "node:test";

import {
  componentsPalette,
  getComponentDefaultValues,
  renderComponentInsert,
  type ComponentSnippetFormValues,
} from "../app/editor/snippets";

test("builds Algorithm MDX from an arbitrary ordered set of pseudocode steps", () => {
  const algorithm = componentsPalette.find(entry => entry.id === "algorithm");
  assert.ok(algorithm);

  const values: ComponentSnippetFormValues = {
    ...getComponentDefaultValues(algorithm),
    title: "Binary search",
    input: "A sorted array A and a target t",
    output: "The index of t, or not found",
    caption: "Halve the remaining search interval on every iteration.",
    emphasizedSteps: "5, 3, 3, not-a-step",
    steps: [
      { statement: "low ← 0", indent: "0", comment: "Inclusive lower bound" },
      {
        statement: "high ← length(A) − 1",
        indent: "0",
        comment: "Inclusive upper bound",
      },
      {
        statement: "while low ≤ high do",
        indent: "0",
        comment: "Continue while candidates remain",
      },
      {
        statement: "mid ← floor((low + high) / 2)",
        indent: "1",
        comment: "Split the interval",
      },
      {
        statement: "if A[mid] = t then return mid",
        indent: "1",
        comment: "Found the target",
      },
      {
        statement: "return not found",
        indent: "0",
        comment: "No candidate matched",
      },
    ],
  };

  const insert = renderComponentInsert(algorithm, values);

  assert.match(insert.content, /^<Algorithm/m);
  assert.match(insert.content, /title="Binary search"/);
  assert.match(insert.content, /input="A sorted array A and a target t"/);
  assert.match(insert.content, /emphasizedSteps=\{\[3, 5\]\}/);
  assert.match(
    insert.content,
    /statement: "mid ← floor\(\(low \+ high\) \/ 2\)", indent: 1, comment: "Split the interval"/
  );
  assert.match(
    insert.content,
    /statement: "return not found", indent: 0, comment: "No candidate matched"/
  );
  assert.equal((insert.content.match(/statement:/g) ?? []).length, 6);
});

test("builds a referenceable Definition and matching CrossReference", () => {
  const definition = componentsPalette.find(entry => entry.id === "definition");
  const crossReference = componentsPalette.find(
    entry => entry.id === "cross-reference"
  );
  assert.ok(definition);
  assert.ok(crossReference);

  const definitionInsert = renderComponentInsert(definition, {
    ...getComponentDefaultValues(definition),
    id: "def-relaxation-time",
    title: "Longitudinal relaxation time",
    label: "2.1",
    body: "T1 describes recovery of longitudinal magnetization after excitation.",
  });
  const referenceInsert = renderComponentInsert(crossReference, {
    ...getComponentDefaultValues(crossReference),
    target: "def-relaxation-time",
    label: "Definition 2.1",
  });

  assert.match(definitionInsert.content, /id="def-relaxation-time"/);
  assert.match(definitionInsert.content, /label="2.1"/);
  assert.match(
    definitionInsert.content,
    /T1 describes recovery of longitudinal magnetization/
  );
  assert.equal(
    referenceInsert.content,
    '<CrossReference target="def-relaxation-time" label="Definition 2.1" />'
  );
});

test("keeps FileTree focused on paths rather than component-level metadata", () => {
  const fileTree = componentsPalette.find(entry => entry.id === "file-tree");
  assert.ok(fileTree);

  assert.equal(fileTree.fields?.some(field => field.id === "title"), false);
  assert.equal(fileTree.fields?.some(field => field.id === "caption"), false);
  assert.equal(fileTree.fields?.some(field => field.id === "highlights"), false);

  const insert = renderComponentInsert(fileTree, {
    ...getComponentDefaultValues(fileTree),
    rootLabel: "research",
  });

  assert.match(insert.content, /rootLabel="research"/);
  assert.doesNotMatch(insert.content, /(?:title|caption|highlights)=/);
});

test("builds a regression table with arbitrary model columns and result panels", () => {
  const regressionTable = componentsPalette.find(
    entry => entry.id === "regression-table"
  );
  assert.ok(regressionTable);

  const insert = renderComponentInsert(regressionTable, {
    ...getComponentDefaultValues(regressionTable),
    id: "table-return-models",
    models: "market|Market model|Excess return\nff5|Five-factor model|Excess return",
    rows: "# Panel A. Coefficients\nMarket excess return|1.01|0.05|0.98|0.06\n# Panel B. Statistics\nObservations|240||240|",
  });

  assert.match(insert.content, /<RegressionTable/);
  assert.match(insert.content, /id="table-return-models"/);
  assert.match(insert.content, /key: "ff5", label: "Five-factor model"/);
  assert.match(insert.content, /title: "Panel A\. Coefficients"/);
  assert.match(insert.content, /standardError: 0\.05/);
  assert.match(insert.content, /label: "Observations", kind: "statistic"/);
});

test("builds a source excerpt with a source witness and readable transcription", () => {
  const sourceExcerpt = componentsPalette.find(
    entry => entry.id === "source-excerpt"
  );
  assert.ok(sourceExcerpt);

  const insert = renderComponentInsert(sourceExcerpt, {
    ...getComponentDefaultValues(sourceExcerpt),
    id: "source-ledger-12",
    layout: "reading",
    transcription: "sic transit\n[illeg.]",
    reading: "Thus it passes.\n[illegible]",
  });

  assert.match(insert.content, /<SourceExcerpt/);
  assert.match(insert.content, /id="source-ledger-12"/);
  assert.match(insert.content, /layout="reading"/);
  assert.match(insert.content, /facsimile=\{\{ src:/);
  assert.match(insert.content, /transcription=\{"sic transit\\n\[illeg\.\]"\}/);
  assert.match(insert.content, /reading=\{"Thus it passes\.\\n\[illegible\]"\}/);
});

test("builds scatter, histogram, and box-plot MDX from explicit research summaries", () => {
  const scatter = componentsPalette.find(entry => entry.id === "scatter-plot");
  const histogram = componentsPalette.find(entry => entry.id === "histogram");
  const boxPlot = componentsPalette.find(entry => entry.id === "box-plot");
  assert.ok(scatter);
  assert.ok(histogram);
  assert.ok(boxPlot);

  const scatterInsert = renderComponentInsert(scatter, {
    ...getComponentDefaultValues(scatter),
    series: "Validation|#2563eb|0.1:0.2, 0.4:0.5\nStress|#ea580c|0.2:0.1",
  });
  const histogramInsert = renderComponentInsert(histogram, {
    ...getComponentDefaultValues(histogram),
    bins: "0–1|12\n1–2|4",
  });
  const boxPlotInsert = renderComponentInsert(boxPlot, {
    ...getComponentDefaultValues(boxPlot),
    items: "Rule A|-0.2|-0.04|0.01|0.06|0.18|#2563eb",
  });

  assert.match(scatterInsert.content, /<ScatterPlot/);
  assert.match(scatterInsert.content, /label: "Stress", color: "#ea580c", points: \[\{ x: 0\.2, y: 0\.1 \}\]/);
  assert.match(histogramInsert.content, /\{ label: "0–1", count: 12 \}/);
  assert.match(boxPlotInsert.content, /lowerWhisker: -0\.2, q1: -0\.04, median: 0\.01, q3: 0\.06, upperWhisker: 0\.18/);
});
