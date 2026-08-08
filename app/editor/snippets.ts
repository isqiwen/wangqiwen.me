import { siteConfig } from "@/utils/site-config";

export type ComponentSnippetFieldOption = {
  label: string;
  value: string;
};

export type ComponentSnippetRepeatableRow = Record<string, string>;

export type ComponentSnippetFormValue =
  | string
  | boolean
  | ComponentSnippetRepeatableRow[];

export type ComponentSnippetField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean" | "repeatable";
  required?: boolean;
  defaultValue?: ComponentSnippetFormValue;
  placeholder?: string;
  help?: string;
  example?: string;
  rows?: number;
  options?: ComponentSnippetFieldOption[];
  itemFields?: Array<{
    id: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
  }>;
  itemLabel?: string;
  addLabel?: string;
  minItems?: number;
};

export type ComponentSnippetFormValues = Record<
  string,
  ComponentSnippetFormValue
>;

export type ComponentSnippetInsert = {
  content: string;
  selectionStart: number | null;
  selectionEnd: number | null;
};

export type ComponentSnippet = {
  id: string;
  category: string;
  label: string;
  hint: string;
  snippet: string;
  template?: string;
  notes?: string[];
  searchTerms?: string[];
  fields?: ComponentSnippetField[];
  buildInsert?: (values: ComponentSnippetFormValues) => string;
};

const DEFAULT_AVATAR = siteConfig.author.images.avatarMuted;
const DEFAULT_IMAGE = "/images/avatar-placeholder.svg";
const DEFAULT_MUTED_IMAGE = "/images/avatar-placeholder-muted.svg";
const DEFAULT_VIDEO_SRC =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const DEFAULT_AUDIO_SRC =
  "https://file-examples.com/storage/fe1afdf45b8e85b2e1fae03/2017/11/file_example_MP3_700KB.mp3";
const DEFAULT_YOUTUBE_ID = "dQw4w9WgXcQ";
const DEFAULT_CALLOUT_BODY =
  "State the condition readers need to keep in mind when interpreting the argument.";
const DEFAULT_PULL_QUOTE =
  "Writing gets easier when the structure helps instead of fights you.";
const DEFAULT_COMPARE_LEFT = "A fast summary of the first option.";
const DEFAULT_DIFF_BEFORE = 'console.log("before");';
const DEFAULT_VIDEO_TITLE = "Release walkthrough";
const DEFAULT_AUDIO_TITLE = "Audio sample";
const DEFAULT_AUDIO_SUBTITLE = "Short supporting context";
const DEFAULT_IMAGE_ALT = "Describe the image";
const DEFAULT_INLINE_MATH = "\\mathcal{L}(x, y) = \\lVert Ax - y \\rVert_2^2";
const DEFAULT_MATH_BLOCK =
  "\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)";
const DEFAULT_PAPER_TITLE =
  "Recurrent Variational Networks for MRI Reconstruction";
const DEFAULT_PAPER_SUMMARY =
  "Summarize the main contribution, the evaluation setting, and the one result readers should remember.";
const DEFAULT_PAPER_AUTHORS = "Hammernik et al.";
const DEFAULT_CITATION_TITLE = "Learning to see in k-space";
const DEFAULT_CHART_TITLE = "Validation PSNR across epochs";
const DEFAULT_CHART_ID = "fig-validation-psnr";
const DEFAULT_ABLATION_TITLE = "Ablation on mask ratio and recurrent depth";
const DEFAULT_THEOREM_ID = "theorem-data-consistency";
const DEFAULT_THEOREM_TITLE = "Data consistency step";
const DEFAULT_THEOREM_BODY =
  "State the definition, theorem, or assumption in the most compact form you can defend.";
const DEFAULT_DEFINITION_ID = "def-signal-model";
const DEFAULT_DEFINITION_TITLE = "Signal model";
const DEFAULT_DEFINITION_BODY =
  "A signal model specifies how the observed measurements relate to the latent quantity being estimated.";
const DEFAULT_CROSS_REFERENCE_LABEL = "Definition 1";
const DEFAULT_PROOF_TITLE = "Convergence sketch";
const DEFAULT_PROOF_BODY =
  "Outline the core argument and skip the algebra that does not change the main idea.";
const DEFAULT_DERIVATION_TITLE = "Gradient update derivation";
const DEFAULT_EQUATION_GROUP_TITLE = "Core equations";
const DEFAULT_TASK_TITLE = "Pick-and-place task";
const DEFAULT_EXPERIMENT_TITLE = "fastMRI validation protocol";
const DEFAULT_HEATMAP_TITLE = "Ablation heatmap";
const DEFAULT_CONFUSION_TITLE = "Policy error breakdown";
const DEFAULT_MULTI_PANEL_TITLE = "Reconstruction comparison";
const DEFAULT_KSPACE_TITLE = "k-space inspection";
const DEFAULT_METRIC_TABLE_TITLE = "Validation benchmark";
const DEFAULT_LEADERBOARD_TITLE = "Strategy leaderboard";
const DEFAULT_REGRESSION_TABLE_TITLE = "Factor-regression disclosure";
const DEFAULT_SOURCE_EXCERPT_TITLE = "Minute from a committee meeting";
const DEFAULT_SCATTER_TITLE = "Observed versus estimated quantity";
const DEFAULT_HISTOGRAM_TITLE = "Residual distribution";
const DEFAULT_BOX_PLOT_TITLE = "Monthly return distribution";
const DEFAULT_MULTI_PANEL_PANELS = `A|Zero-filled|/images/posts/recon/zero-filled.png|Zero-filled reconstruction|Baseline reconstruction
B|Reference|/images/posts/recon/reference.png|Reference reconstruction|Ground-truth target
C|VarNet|/images/posts/recon/varnet.png|VarNet reconstruction|Recurrent baseline
D|Ours|/images/posts/recon/ours.png|Our reconstruction|Sharper structure in the target region`;
const DEFAULT_KSPACE_PANELS = `Acquired magnitude|/images/posts/mri/kspace-magnitude.png|Log magnitude of the acquired k-space|kspace|Use this panel to show aliasing or energy concentration.
Sampling mask|/images/posts/mri/mask.png|Sampling mask visualization|mask|State the acceleration factor or variable-density pattern.
Reconstruction|/images/posts/mri/reconstruction.png|Reconstructed MRI image|reconstruction|Highlight the main anatomical structures that are preserved.
Error map|/images/posts/mri/error-map.png|Absolute error map|error|Use the error panel to reveal subtle residual artifacts.`;
const DEFAULT_METRIC_TABLE_METRICS = `psnr|PSNR|higher|number
ssim|SSIM|higher|number
nmse|NMSE|lower|number`;
const DEFAULT_METRIC_TABLE_ROWS = `VarNet|33.12|0.928|0.065|Baseline|Classic recurrent baseline
Cascade Transformer|34.08|0.941|0.051|Featured|Best overall validation result
Prompted Diffusion|33.74|0.936|0.058|Candidate|Sharper details with slower inference`;
const DEFAULT_LEADERBOARD_ENTRIES = `Cross-sectional momentum|1.48|0.12|Live candidate|Monthly rebalance, top 300 universe
Residual mean reversion|1.31|0.07|Stable|Lower turnover and shallower drawdown
Sector-neutral blend|1.22|-0.03|Watchlist|Improves robustness but trails the leader`;
const DEFAULT_REGRESSION_MODELS = `market|Market model|Excess return
three-factor|Three-factor model|Excess return`;
const DEFAULT_REGRESSION_ROWS = `# Panel A. Estimated exposures
Market excess return|1.02|0.06|0.96|0.07
Size factor|||0.21|0.08
Value factor|||−0.14|0.09
# Panel B. Model statistics
Observations|240||240|
Adjusted R²|0.18||0.24|`;
const DEFAULT_SCATTER_SERIES = `Held-out fixture|#2563eb|0.12:0.16, 0.25:0.23, 0.37:0.39, 0.48:0.44, 0.64:0.66, 0.81:0.76`;
const DEFAULT_HISTOGRAM_BINS = `0–0.02|42
0.02–0.04|31
0.04–0.06|16
0.06–0.08|7
>0.08|4`;
const DEFAULT_BOX_PLOT_ITEMS = `Trend|-0.14|-0.03|0.01|0.05|0.16|#2563eb
Value|-0.12|-0.02|0.008|0.04|0.13|#0f766e
Control|-0.09|-0.025|0.002|0.028|0.08|#64748b`;
const DEFAULT_MERMAID_CHART = `flowchart LR
  raw["Raw k-space"] --> mask["Sampling mask"]
  mask --> recon["Reconstruction model"]
  recon --> metrics["Metrics and review"]`;
const DEFAULT_TERMINAL_TITLE = "Training session";
const DEFAULT_BACKTEST_TITLE = "Strategy vs. benchmark";
const DEFAULT_ALGORITHM_TITLE = "Greedy selection";
const DEFAULT_ALGORITHM_ID = "alg-greedy-selection";
const DEFAULT_ALGORITHM_LABEL = "1";
const DEFAULT_ALGORITHM_STEPS: ComponentSnippetRepeatableRow[] = [
  {
    statement: "selected ← ∅",
    indent: "0",
    comment: "Initialize the solution set",
  },
  {
    statement: "for each candidate c in candidates do",
    indent: "0",
    comment: "Evaluate candidates in order",
  },
  {
    statement: "if improves(selected, c) then",
    indent: "1",
    comment: "Keep only beneficial choices",
  },
  {
    statement: "selected ← selected ∪ {c}",
    indent: "2",
    comment: "Commit the selection",
  },
  {
    statement: "return selected",
    indent: "0",
    comment: "Return the final solution",
  },
];

const selectionPattern = /\[\[([\s\S]+?)\]\]/g;

function markEditable(value: string) {
  return `[[${value}]]`;
}

function escapeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeSingleQuoted(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, "\\n");
}

function asString(
  values: ComponentSnippetFormValues,
  key: string,
  fallback = ""
) {
  const value = values[key];
  return typeof value === "string" ? value : fallback;
}

function asBoolean(
  values: ComponentSnippetFormValues,
  key: string,
  fallback = false
) {
  const value = values[key];
  return typeof value === "boolean" ? value : fallback;
}

function asRepeatableRows(
  values: ComponentSnippetFormValues,
  key: string,
  fallback: ComponentSnippetRepeatableRow[]
) {
  const value = values[key];
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map(row => ({ ...row }));
}

function hasText(value: string) {
  return value.trim().length > 0;
}

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map(entry => entry.trim())
    .filter(Boolean);
}

function splitMatrixRows(value: string) {
  return splitLines(value).map(row =>
    row
      .split(",")
      .map(entry => entry.trim())
      .filter(Boolean)
  );
}

function splitPipedRows(value: string) {
  return splitLines(value).map(row =>
    row.split("|").map(entry => entry.trim())
  );
}

function parseNumberValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function formatMatrix(matrix: string[][]) {
  return `[\n${matrix.map(row => `    [${row.join(", ")}],`).join("\n")}\n  ]`;
}

function formatStringArray(values: string[]) {
  return `[${values.map(value => `"${escapeAttribute(value)}"`).join(", ")}]`;
}

function formatLinks(
  links: Array<{ label: string; href: string }>,
  indent = "  "
) {
  if (!links.length) {
    return "";
  }

  const lines = [`${indent}links={[`];

  for (const link of links) {
    lines.push(
      `${indent}  { label: "${escapeAttribute(
        link.label
      )}", href: "${escapeAttribute(link.href)}" },`
    );
  }

  lines.push(`${indent}]}`);
  return lines.join("\n");
}

function withDefaultSelection(value: string, defaultValue: string) {
  return value === defaultValue ? markEditable(value) : value;
}

function buildAlgorithmInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", DEFAULT_ALGORITHM_ID);
  const label = asString(values, "label", DEFAULT_ALGORITHM_LABEL);
  const title = asString(values, "title", DEFAULT_ALGORITHM_TITLE);
  const input = asString(values, "input", "Candidates C");
  const output = asString(values, "output", "Selected set S");
  const caption = asString(
    values,
    "caption",
    "State the invariant or decision rule in the surrounding prose."
  );
  const emphasizedSteps = Array.from(
    new Set(
      splitCommaSeparated(asString(values, "emphasizedSteps"))
        .map(value => Number(value))
        .filter(value => Number.isInteger(value) && value > 0)
    )
  ).sort((left, right) => left - right);
  const emphasizedStepsProp = emphasizedSteps.length
    ? `\n  emphasizedSteps={[${emphasizedSteps.join(", ")}]}`
    : "";
  const steps = asRepeatableRows(values, "steps", DEFAULT_ALGORITHM_STEPS)
    .map((step, index) => {
      const statement = step.statement?.trim() || "Describe the next step";
      const indent = Math.max(0, Math.min(Number(step.indent) || 0, 8));
      const comment = step.comment?.trim();
      const selectedStatement =
        index === 0
          ? withDefaultSelection(
              statement,
              DEFAULT_ALGORITHM_STEPS[0].statement
            )
          : statement;
      const commentProperty = comment
        ? `, comment: "${escapeAttribute(comment)}"`
        : "";

      return `    { statement: "${escapeAttribute(
        selectedStatement
      )}", indent: ${indent}${commentProperty} },`;
    })
    .join("\n");

  return `<Algorithm
  id="${escapeAttribute(id)}"
  label="${escapeAttribute(label)}"
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_ALGORITHM_TITLE)
  )}"
  input="${escapeAttribute(input)}"
  output="${escapeAttribute(output)}"
  caption="${escapeAttribute(caption)}"${emphasizedStepsProp}
  steps={[
${steps}
  ]}
/>`;
}

function buildCalloutInsert(values: ComponentSnippetFormValues) {
  const type = asString(values, "type", "note");
  const title = asString(values, "title", "Methodological note");
  const body = asString(values, "body", DEFAULT_CALLOUT_BODY);
  const titleProp = hasText(title) ? ` title="${escapeAttribute(title)}"` : "";

  return `<Callout type="${escapeAttribute(type)}"${titleProp}>
  ${withDefaultSelection(body, DEFAULT_CALLOUT_BODY)}
</Callout>`;
}

function buildFigureInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", "fig-example");
  const src = asString(values, "src", DEFAULT_AVATAR);
  const alt = asString(values, "alt", DEFAULT_IMAGE_ALT);
  const wide = asBoolean(values, "wide");
  const srcValue = withDefaultSelection(src, DEFAULT_AVATAR);

  return `<Figure id="${escapeAttribute(id)}"${wide ? " wide" : ""}>
  <Image src="${escapeAttribute(srcValue)}" alt="${escapeAttribute(
    alt
  )}" width={null} height={null} />
</Figure>`;
}

function buildPullQuoteInsert(values: ComponentSnippetFormValues) {
  const author = asString(values, "author", "Author name");
  const quote = asString(values, "quote", DEFAULT_PULL_QUOTE);

  return `<PullQuote author="${escapeAttribute(author)}">
  ${withDefaultSelection(quote, DEFAULT_PULL_QUOTE)}
</PullQuote>`;
}

function buildCompareInsert(values: ComponentSnippetFormValues) {
  const leftTitle = asString(values, "leftTitle", "Approach A");
  const rightTitle = asString(values, "rightTitle", "Approach B");
  const left = asString(values, "left", DEFAULT_COMPARE_LEFT);
  const right = asString(
    values,
    "right",
    "A fast summary of the second option."
  );

  return `<Compare
  leftTitle="${escapeAttribute(leftTitle)}"
  rightTitle="${escapeAttribute(rightTitle)}"
  left="${escapeAttribute(withDefaultSelection(left, DEFAULT_COMPARE_LEFT))}"
  right="${escapeAttribute(right)}"
/>`;
}

function buildDiffInsert(values: ComponentSnippetFormValues) {
  const beforeTitle = asString(values, "beforeTitle", "Before");
  const afterTitle = asString(values, "afterTitle", "After");
  const before = asString(values, "before", DEFAULT_DIFF_BEFORE);
  const after = asString(values, "after", 'console.log("after");');

  return `<Diff
  beforeTitle="${escapeAttribute(beforeTitle)}"
  afterTitle="${escapeAttribute(afterTitle)}"
  before={'${escapeSingleQuoted(
    withDefaultSelection(before, DEFAULT_DIFF_BEFORE)
  )}'}
  after={'${escapeSingleQuoted(after)}'}
/>`;
}

function buildYouTubeInsert(values: ComponentSnippetFormValues) {
  const videoId = asString(values, "videoId", DEFAULT_YOUTUBE_ID);
  return `<YouTube videoId="${escapeAttribute(
    withDefaultSelection(videoId, DEFAULT_YOUTUBE_ID)
  )}" />`;
}

function buildVideoInsert(values: ComponentSnippetFormValues) {
  const src = asString(values, "src", DEFAULT_VIDEO_SRC);
  const title = asString(values, "title", DEFAULT_VIDEO_TITLE);
  const poster = asString(values, "poster", "");
  const chapterLabel = asString(values, "chapterLabel", "Intro");
  const chapterTime = asString(values, "chapterTime", "0");
  const body = asString(values, "body", "");

  const lines = [
    "<VideoPlayer",
    `  src="${escapeAttribute(withDefaultSelection(src, DEFAULT_VIDEO_SRC))}"`,
  ];

  if (hasText(poster)) {
    lines.push(`  poster="${escapeAttribute(poster)}"`);
  }

  if (hasText(title)) {
    lines.push(`  title="${escapeAttribute(title)}"`);
  }

  if (hasText(chapterLabel)) {
    lines.push("  chapters={[");
    lines.push(
      `    { label: "${escapeAttribute(chapterLabel)}", time: ${
        chapterTime || "0"
      } },`
    );
    lines.push("  ]}");
  }

  if (hasText(body)) {
    lines.push(">");
    lines.push(`  ${body}`);
    lines.push("</VideoPlayer>");
  } else {
    lines.push("/>");
  }

  return lines.join("\n");
}

function buildAudioInsert(values: ComponentSnippetFormValues) {
  const src = asString(values, "src", DEFAULT_AUDIO_SRC);
  const title = asString(values, "title", DEFAULT_AUDIO_TITLE);
  const subtitle = asString(values, "subtitle", DEFAULT_AUDIO_SUBTITLE);
  const cover = asString(values, "cover", "");
  const body = asString(values, "body", "");

  const lines = [
    "<AudioPlayer",
    `  src="${escapeAttribute(withDefaultSelection(src, DEFAULT_AUDIO_SRC))}"`,
  ];

  if (hasText(title)) {
    lines.push(`  title="${escapeAttribute(title)}"`);
  }

  if (hasText(subtitle)) {
    lines.push(`  subtitle="${escapeAttribute(subtitle)}"`);
  }

  if (hasText(cover)) {
    lines.push(`  cover="${escapeAttribute(cover)}"`);
  }

  if (hasText(body)) {
    lines.push(">");
    lines.push(`  ${body}`);
    lines.push("</AudioPlayer>");
  } else {
    lines.push("/>");
  }

  return lines.join("\n");
}

function buildInlineMathInsert(values: ComponentSnippetFormValues) {
  const tex = asString(values, "tex", DEFAULT_INLINE_MATH);

  return `<InlineMath tex="${escapeAttribute(
    withDefaultSelection(tex, DEFAULT_INLINE_MATH)
  )}" />`;
}

function buildMathBlockInsert(values: ComponentSnippetFormValues) {
  const tex = asString(values, "tex", DEFAULT_MATH_BLOCK);
  const id = asString(values, "id", "eq-main");
  const caption = asString(
    values,
    "caption",
    "Reference this equation from the surrounding text. The page-level numbering system will fill the label automatically."
  );
  const lines = [
    `Mention the objective again with <AutoEquationRef target="${escapeAttribute(
      id
    )}" />.`,
    "",
    "<MathBlock",
  ];

  if (hasText(id)) {
    lines.push(`  id="${escapeAttribute(id)}"`);
  }

  lines.push(
    `  tex="${escapeAttribute(withDefaultSelection(tex, DEFAULT_MATH_BLOCK))}"`
  );

  if (hasText(caption)) {
    lines.push(`  caption="${escapeAttribute(caption)}"`);
  }

  lines.push("/>");
  return lines.join("\n");
}

function buildPaperCardInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_PAPER_TITLE);
  const authors = splitCommaSeparated(
    asString(values, "authors", DEFAULT_PAPER_AUTHORS)
  );
  const venue = asString(values, "venue", "MICCAI");
  const year = asString(values, "year", "2018");
  const summary = asString(values, "summary", DEFAULT_PAPER_SUMMARY);
  const tags = splitCommaSeparated(
    asString(values, "tags", "MRI, Reconstruction, Variational")
  );
  const status = asString(values, "status", "Must read");
  const links = [
    {
      label: "Paper",
      href: asString(values, "paperUrl", "https://arxiv.org/"),
    },
    { label: "Code", href: asString(values, "codeUrl", "https://github.com/") },
    { label: "Project", href: asString(values, "projectUrl", "") },
  ].filter(link => hasText(link.href));

  const lines = [
    "<PaperCard",
    `  title="${escapeAttribute(
      withDefaultSelection(title, DEFAULT_PAPER_TITLE)
    )}"`,
  ];

  if (authors.length) {
    lines.push(`  authors={${formatStringArray(authors)}}`);
  }

  if (hasText(venue)) {
    lines.push(`  venue="${escapeAttribute(venue)}"`);
  }

  if (hasText(year)) {
    lines.push(`  year="${escapeAttribute(year)}"`);
  }

  if (tags.length) {
    lines.push(`  tags={${formatStringArray(tags)}}`);
  }

  if (hasText(status)) {
    lines.push(`  status="${escapeAttribute(status)}"`);
  }

  const linkBlock = formatLinks(links);
  if (linkBlock) {
    lines.push(linkBlock);
  }

  lines.push(">");
  lines.push(`  ${withDefaultSelection(summary, DEFAULT_PAPER_SUMMARY)}`);
  lines.push("</PaperCard>");

  return lines.join("\n");
}

function buildCitationInsert(values: ComponentSnippetFormValues) {
  const refId = asString(values, "refId", "paper-1");
  const label = asString(values, "label", "[1]");
  const title = asString(values, "title", DEFAULT_CITATION_TITLE);
  const authors = splitCommaSeparated(
    asString(values, "authors", DEFAULT_PAPER_AUTHORS)
  );
  const venue = asString(values, "venue", "arXiv");
  const year = asString(values, "year", "2024");
  const note = asString(
    values,
    "note",
    "Use this note for one sentence on why the citation matters."
  );
  const links = [
    {
      label: "Paper",
      href: asString(values, "paperUrl", "https://arxiv.org/"),
    },
    { label: "Code", href: asString(values, "codeUrl", "") },
  ].filter(link => hasText(link.href));

  const bibliographyLines = [
    "<Bibliography>",
    "  <BibliographyItem",
    `    id="${escapeAttribute(refId)}"`,
    `    label="${escapeAttribute(label)}"`,
    `    title="${escapeAttribute(title)}"`,
  ];

  if (authors.length) {
    bibliographyLines.push(`    authors={${formatStringArray(authors)}}`);
  }

  if (hasText(venue)) {
    bibliographyLines.push(`    venue="${escapeAttribute(venue)}"`);
  }

  if (hasText(year)) {
    bibliographyLines.push(`    year="${escapeAttribute(year)}"`);
  }

  if (hasText(note)) {
    bibliographyLines.push(`    note="${escapeAttribute(note)}"`);
  }

  const linkBlock = formatLinks(links, "    ");
  if (linkBlock) {
    bibliographyLines.push(linkBlock);
  }

  bibliographyLines.push("  />");
  bibliographyLines.push("</Bibliography>");

  return `Reference the method inline with <Citation refId="${escapeAttribute(
    refId
  )}" label="${escapeAttribute(label)}" />.\n\n${bibliographyLines.join("\n")}`;
}

function buildChartInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", DEFAULT_CHART_ID);
  const title = asString(values, "title", DEFAULT_CHART_TITLE);
  const description = asString(
    values,
    "description",
    "Show the one trend that matters and keep the axis labels short."
  );
  const xLabels = splitCommaSeparated(
    asString(values, "xLabels", "0, 10, 20, 30, 40")
  );
  const primaryLabel = asString(values, "primaryLabel", "Ours");
  const primaryData = splitCommaSeparated(
    asString(values, "primaryData", "29.1, 31.4, 32.5, 33.1, 33.4")
  );
  const secondaryLabel = asString(values, "secondaryLabel", "Baseline");
  const secondaryData = splitCommaSeparated(
    asString(values, "secondaryData", "28.4, 29.7, 30.2, 30.6, 30.9")
  );
  const primaryLower = splitCommaSeparated(asString(values, "primaryLower"));
  const primaryUpper = splitCommaSeparated(asString(values, "primaryUpper"));
  const intervalDisplay = asString(values, "intervalDisplay", "band");
  const barMode = asString(values, "barMode", "grouped");
  const yFormat = asString(values, "yFormat", "number");
  const primaryInterval =
    primaryLower.length && primaryLower.length === primaryUpper.length
      ? `, interval: { label: "95% interval", display: "${escapeAttribute(
          intervalDisplay
        )}", lower: [${primaryLower.join(", ")}], upper: [${primaryUpper.join(", ")}] }`
      : "";

  return `<Chart
  id="${escapeAttribute(id)}"
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_CHART_TITLE))}"
  description="${escapeAttribute(description)}"
  xLabels={${formatStringArray(xLabels)}}
  yFormat="${escapeAttribute(yFormat)}"
  barMode="${escapeAttribute(barMode)}"
  series={[
    { label: "${escapeAttribute(
      primaryLabel
    )}", type: "line", data: [${primaryData.join(", ")}]${primaryInterval} },
    { label: "${escapeAttribute(
      secondaryLabel
    )}", type: "area", data: [${secondaryData.join(", ")}] },
  ]}
/>`;
}

function buildScatterPlotInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", "fig-observed-estimated");
  const title = asString(values, "title", DEFAULT_SCATTER_TITLE);
  const xLabel = asString(values, "xLabel", "Reference quantity");
  const yLabel = asString(values, "yLabel", "Estimated quantity");
  const series = splitPipedRows(asString(values, "series", DEFAULT_SCATTER_SERIES))
    .map((parts, index) => {
      const points = (parts[2] || "")
        .split(",")
        .map(value => value.trim().split(":"))
        .map(([x, y]) => ({ x: Number(x), y: Number(y) }))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
      return {
        label: parts[0] || `Series ${index + 1}`,
        color: parts[1] || "",
        points,
      };
    })
    .filter(entry => entry.points.length);
  const usableSeries = series.length
    ? series
    : [{ label: "Held-out fixture", color: "#2563eb", points: [{ x: 0.12, y: 0.16 }] }];
  const seriesLines = usableSeries
    .map(entry => {
      const color = hasText(entry.color) ? `, color: "${escapeAttribute(entry.color)}"` : "";
      const points = entry.points.map(point => `{ x: ${point.x}, y: ${point.y} }`).join(", ");
      return `    { label: "${escapeAttribute(entry.label)}"${color}, points: [${points}] },`;
    })
    .join("\n");

  return `<ScatterPlot
  id="${escapeAttribute(id)}"
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_SCATTER_TITLE))}"
  xLabel="${escapeAttribute(xLabel)}"
  yLabel="${escapeAttribute(yLabel)}"
  series={[
${seriesLines}
  ]}
  caption="State the unit, reference, and any repeated-measurement structure."
/>`;
}

function buildHistogramInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", "fig-residual-distribution");
  const title = asString(values, "title", DEFAULT_HISTOGRAM_TITLE);
  const xLabel = asString(values, "xLabel", "Absolute residual");
  const yLabel = asString(values, "yLabel", "Cases");
  const bins = splitPipedRows(asString(values, "bins", DEFAULT_HISTOGRAM_BINS))
    .map(parts => ({ label: parts[0] || "Bin", count: Number(parts[1]) }))
    .filter(bin => Number.isFinite(bin.count));
  const binLines = bins
    .map(bin => `    { label: "${escapeAttribute(bin.label)}", count: ${bin.count} },`)
    .join("\n");

  return `<Histogram
  id="${escapeAttribute(id)}"
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_HISTOGRAM_TITLE))}"
  xLabel="${escapeAttribute(xLabel)}"
  yLabel="${escapeAttribute(yLabel)}"
  bins={[
${binLines}
  ]}
  caption="State the bin edges, denominator, and excluded observations."
/>`;
}

function buildBoxPlotInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", "fig-return-distribution");
  const title = asString(values, "title", DEFAULT_BOX_PLOT_TITLE);
  const yLabel = asString(values, "yLabel", "Monthly net return");
  const yFormat = asString(values, "yFormat", "percent");
  const items = splitPipedRows(asString(values, "items", DEFAULT_BOX_PLOT_ITEMS))
    .map(parts => ({
      label: parts[0] || "Series",
      lowerWhisker: Number(parts[1]),
      q1: Number(parts[2]),
      median: Number(parts[3]),
      q3: Number(parts[4]),
      upperWhisker: Number(parts[5]),
      color: parts[6] || "",
    }))
    .filter(item => [item.lowerWhisker, item.q1, item.median, item.q3, item.upperWhisker].every(Number.isFinite));
  const itemLines = items
    .map(item => {
      const color = hasText(item.color) ? `, color: "${escapeAttribute(item.color)}"` : "";
      return `    { label: "${escapeAttribute(item.label)}", lowerWhisker: ${item.lowerWhisker}, q1: ${item.q1}, median: ${item.median}, q3: ${item.q3}, upperWhisker: ${item.upperWhisker}${color} },`;
    })
    .join("\n");

  return `<BoxPlot
  id="${escapeAttribute(id)}"
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_BOX_PLOT_TITLE))}"
  yLabel="${escapeAttribute(yLabel)}"
  yFormat="${escapeAttribute(yFormat)}"
  items={[
${itemLines}
  ]}
  caption="State the observation frequency and whisker convention."
/>`;
}

function formatMdxValue(value: string) {
  const parsed = parseNumberValue(value);
  return typeof parsed === "number"
    ? String(parsed)
    : `"${escapeAttribute(String(parsed))}"`;
}

function parseRegressionModels(value: string) {
  const models = splitPipedRows(value)
    .map((parts, index) => ({
      key: parts[0] || `model-${index + 1}`,
      label: parts[1] || parts[0] || `Model ${index + 1}`,
      detail: parts[2] || "",
    }))
    .filter(model => hasText(model.key) && hasText(model.label));

  return models.length
    ? models
    : [
        { key: "market", label: "Market model", detail: "Excess return" },
        {
          key: "three-factor",
          label: "Three-factor model",
          detail: "Excess return",
        },
      ];
}

function parseRegressionPanels(value: string, models: ReturnType<typeof parseRegressionModels>) {
  const panels: Array<{
    title: string;
    rows: Array<{
      label: string;
      values: Array<{ value: string; standardError: string }>;
    }>;
  }> = [];
  let current = { title: "Panel A. Estimates", rows: [] as Array<{ label: string; values: Array<{ value: string; standardError: string }> }> };

  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#")) {
      if (current.rows.length) panels.push(current);
      current = { title: trimmed.replace(/^#+\s*/, "") || "Results", rows: [] };
      continue;
    }

    const parts = trimmed.split("|").map(part => part.trim());
    if (!parts[0]) continue;
    current.rows.push({
      label: parts[0],
      values: models.map((_, index) => ({
        value: parts[index * 2 + 1] || "",
        standardError: parts[index * 2 + 2] || "",
      })),
    });
  }

  if (current.rows.length) panels.push(current);
  return panels.length ? panels : [{ title: "Panel A. Estimates", rows: [] }];
}

function buildRegressionTableInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", "table-factor-estimates");
  const label = asString(values, "label", "Table 1");
  const title = asString(values, "title", DEFAULT_REGRESSION_TABLE_TITLE);
  const models = parseRegressionModels(
    asString(values, "models", DEFAULT_REGRESSION_MODELS)
  );
  const panels = parseRegressionPanels(
    asString(values, "rows", DEFAULT_REGRESSION_ROWS),
    models
  );
  const modelLines = models
    .map(
      model =>
        `    { key: "${escapeAttribute(model.key)}", label: "${escapeAttribute(
          model.label
        )}"${model.detail ? `, detail: "${escapeAttribute(model.detail)}"` : ""} },`
    )
    .join("\n");
  const panelLines = panels
    .map(panel => {
      const rows = panel.rows
        .map(row => {
          const hasStandardError = row.values.some(entry => hasText(entry.standardError));
          const values = row.values
            .map((entry, index) => {
              const key = models[index].key;
              if (!hasText(entry.value)) return `"${escapeAttribute(key)}": null`;
              const estimate = hasText(entry.standardError)
                ? `{ value: ${formatMdxValue(entry.value)}, standardError: ${formatMdxValue(entry.standardError)} }`
                : formatMdxValue(entry.value);
              return `"${escapeAttribute(key)}": ${estimate}`;
            })
            .join(", ");
          return `        { label: "${escapeAttribute(row.label)}"${
            hasStandardError ? "" : ', kind: "statistic"'
          }, values: { ${values} } },`;
        })
        .join("\n");
      return `    {\n      title: "${escapeAttribute(panel.title)}",\n      rows: [\n${rows}\n      ],\n    },`;
    })
    .join("\n");

  return `<RegressionTable
  id="${escapeAttribute(id)}"
  label="${escapeAttribute(label)}"
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_REGRESSION_TABLE_TITLE))}"
  models={[
${modelLines}
  ]}
  panels={[
${panelLines}
  ]}
  caption="State the estimand, sample period, and dependent variable."
  source="Identify the dataset or calculation."
  notes="Parentheses contain supplied standard errors; annotations are author supplied."
/>`;
}

function buildSourceExcerptInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", "source-committee-minute");
  const title = asString(values, "title", DEFAULT_SOURCE_EXCERPT_TITLE);
  const layout = asString(values, "layout", "compact");
  const source = asString(values, "source", "Committee minute, synthetic fixture");
  const repository = asString(values, "repository", "Example repository");
  const locator = asString(values, "locator", "Collection A, item 12, fol. 3r");
  const date = asString(values, "date", "1851-03-14");
  const src = asString(values, "src", "/images/posts/source-facsimile.jpg");
  const alt = asString(values, "alt", "Describe the source image");
  const transcription = asString(
    values,
    "transcription",
    "the [illeg.] commttee\\nmet at 3 o'Clocke"
  );
  const reading = asString(
    values,
    "reading",
    "The [illegible] committee\\nmet at 3 o'clock."
  );

  return `<SourceExcerpt
  id="${escapeAttribute(id)}"
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_SOURCE_EXCERPT_TITLE))}"
  layout="${escapeAttribute(layout)}"
  source="${escapeAttribute(source)}"
  repository="${escapeAttribute(repository)}"
  locator="${escapeAttribute(locator)}"
  date="${escapeAttribute(date)}"
  facsimile={{ src: "${escapeAttribute(src)}", alt: "${escapeAttribute(alt)}" }}
  transcription={${JSON.stringify(transcription)}}
  reading={${JSON.stringify(reading)}}
  note="State transcription, normalisation, translation, and derivative choices that change the evidence."
/>`;
}

function buildAblationTableInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_ABLATION_TITLE);
  const caption = asString(
    values,
    "caption",
    "Use the caption to explain the dataset split, protocol, or metric direction."
  );
  const variantLabel = asString(values, "variantLabel", "Setting");
  const metricOneLabel = asString(values, "metricOneLabel", "PSNR");
  const metricOneKey = asString(values, "metricOneKey", "psnr");
  const metricOneDirection = asString(values, "metricOneDirection", "higher");
  const metricTwoLabel = asString(values, "metricTwoLabel", "SSIM");
  const metricTwoKey = asString(values, "metricTwoKey", "ssim");
  const metricTwoDirection = asString(values, "metricTwoDirection", "higher");
  const rowOneLabel = asString(values, "rowOneLabel", "No recurrence");
  const rowOneMetricOne = asString(values, "rowOneMetricOne", "31.4");
  const rowOneMetricTwo = asString(values, "rowOneMetricTwo", "0.912");
  const rowTwoLabel = asString(values, "rowTwoLabel", "With recurrence");
  const rowTwoMetricOne = asString(values, "rowTwoMetricOne", "33.0");
  const rowTwoMetricTwo = asString(values, "rowTwoMetricTwo", "0.927");

  return `<AblationTable
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_ABLATION_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  variantLabel="${escapeAttribute(variantLabel)}"
  metrics={[
    { key: "${escapeAttribute(metricOneKey)}", label: "${escapeAttribute(
    metricOneLabel
  )}", direction: "${escapeAttribute(metricOneDirection)}" },
    { key: "${escapeAttribute(metricTwoKey)}", label: "${escapeAttribute(
    metricTwoLabel
  )}", direction: "${escapeAttribute(metricTwoDirection)}" },
  ]}
  rows={[
    { label: "${escapeAttribute(rowOneLabel)}", values: { "${escapeAttribute(
    metricOneKey
  )}": ${rowOneMetricOne}, "${escapeAttribute(
    metricTwoKey
  )}": ${rowOneMetricTwo} } },
    { label: "${escapeAttribute(rowTwoLabel)}", values: { "${escapeAttribute(
    metricOneKey
  )}": ${rowTwoMetricOne}, "${escapeAttribute(
    metricTwoKey
  )}": ${rowTwoMetricTwo} } },
  ]}
/>`;
}

function buildTheoremBlockInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", DEFAULT_THEOREM_ID);
  const kind = asString(values, "kind", "theorem");
  const label = asString(values, "label", "1");
  const title = asString(values, "title", DEFAULT_THEOREM_TITLE);
  const body = asString(values, "body", DEFAULT_THEOREM_BODY);
  const footer = asString(
    values,
    "footer",
    "Sketch why this statement matters before moving on."
  );
  const lines = [
    "<TheoremBlock",
    `  id="${escapeAttribute(id)}"`,
    `  kind="${escapeAttribute(kind)}"`,
  ];

  if (hasText(label)) {
    lines.push(`  label="${escapeAttribute(label)}"`);
  }

  if (hasText(title)) {
    lines.push(`  title="${escapeAttribute(title)}"`);
  }

  if (hasText(footer)) {
    lines.push(`  footer="${escapeAttribute(footer)}"`);
  }

  lines.push(">");
  lines.push(`  ${withDefaultSelection(body, DEFAULT_THEOREM_BODY)}`);
  lines.push("</TheoremBlock>");
  return lines.join("\n");
}

function buildDefinitionInsert(values: ComponentSnippetFormValues) {
  const id = asString(values, "id", DEFAULT_DEFINITION_ID);
  const title = asString(values, "title", DEFAULT_DEFINITION_TITLE);
  const label = asString(values, "label", "1");
  const body = asString(values, "body", DEFAULT_DEFINITION_BODY);
  const footer = asString(values, "footer", "");
  const lines = [
    "<Definition",
    `  id="${escapeAttribute(id)}"`,
    `  title="${escapeAttribute(
      withDefaultSelection(title, DEFAULT_DEFINITION_TITLE)
    )}"`,
  ];

  if (hasText(label)) {
    lines.push(`  label="${escapeAttribute(label)}"`);
  }

  if (hasText(footer)) {
    lines.push(`  footer="${escapeAttribute(footer)}"`);
  }

  lines.push(
    ">",
    `  ${withDefaultSelection(body, DEFAULT_DEFINITION_BODY)}`,
    "</Definition>"
  );
  return lines.join("\n");
}

function buildCrossReferenceInsert(values: ComponentSnippetFormValues) {
  const target = asString(values, "target", DEFAULT_DEFINITION_ID);
  const label = asString(values, "label", DEFAULT_CROSS_REFERENCE_LABEL);

  return `<CrossReference target="${escapeAttribute(
    withDefaultSelection(target, DEFAULT_DEFINITION_ID)
  )}" label="${escapeAttribute(
    withDefaultSelection(label, DEFAULT_CROSS_REFERENCE_LABEL)
  )}" />`;
}

function buildMermaidDiagramInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", "System flow");
  const caption = asString(
    values,
    "caption",
    "Use Mermaid when the relationship between steps matters more than polished illustration."
  );
  const theme = asString(values, "theme", "neutral");
  const chart = asString(values, "chart", DEFAULT_MERMAID_CHART);

  return `<MermaidDiagram
  title="${escapeAttribute(title)}"
  caption="${escapeAttribute(caption)}"
  theme="${escapeAttribute(theme)}"
  chart={\`${withDefaultSelection(chart, DEFAULT_MERMAID_CHART)}\`}
/>`;
}

function buildArchitectureDiagramInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", "MRI training pipeline");
  const caption = asString(
    values,
    "caption",
    "Summarize the stages, then let the nodes and edges make the system boundary obvious."
  );
  const direction = asString(values, "direction", "LR");

  return `<ArchitectureDiagram
  title="${escapeAttribute(title)}"
  caption="${escapeAttribute(caption)}"
  direction="${escapeAttribute(direction)}"
  nodes={[
    { id: "scanner", label: "Scanner data", group: "Acquisition", shape: "rounded", tone: "accent" },
    { id: "loader", label: "Dataset loader", group: "Acquisition", shape: "rect", tone: "default" },
    { id: "model", label: "VarNet", group: "Model", shape: "subroutine", tone: "success" },
    { id: "metrics", label: "Metrics", group: "Evaluation", shape: "diamond", tone: "muted" },
  ]}
  edges={[
    { from: "scanner", to: "loader", label: "shards" },
    { from: "loader", to: "model", label: "mini-batches", style: "thick" },
    { from: "model", to: "metrics", label: "reconstructions" },
  ]}
/>`;
}

function buildFileTreeInsert(values: ComponentSnippetFormValues) {
  const rootLabel = asString(values, "rootLabel", "workspace");
  const paths = splitLines(
    asString(
      values,
      "paths",
      "app/api/inference/route.ts\nlib/mri/reconstruct.cpp\nlib/mri/reconstruct.hpp\nconfig/CMakeLists.txt\nconfig/research.yaml\ndata/manifest.json\nreport/methods.md\npublic/coil-sensitivity.svg\nworkers/train/index.py"
    )
  );

  return `<FileTree
  rootLabel="${escapeAttribute(rootLabel)}"
  paths={${formatStringArray(paths)}}
/>`;
}

function buildTerminalBlockInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_TERMINAL_TITLE);
  const caption = asString(
    values,
    "caption",
    "Mix commands and structured status lines to show what actually happened during the run."
  );
  const lines = splitLines(
    asString(
      values,
      "lines",
      "$ uv run train.py --config fastmri.yaml\n[info] Loaded 973 volumes\n[success] Validation PSNR 33.4\n[warn] GPU memory reached 90%"
    )
  );

  return `<TerminalBlock
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_TERMINAL_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  lines={${formatStringArray(lines)}}
/>`;
}

function buildBacktestChartInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_BACKTEST_TITLE);
  const caption = asString(
    values,
    "caption",
    "Use the caption for rebalancing cadence, transaction costs, and benchmark definition."
  );
  const labels = splitCommaSeparated(
    asString(values, "labels", "Jan, Feb, Mar, Apr, May")
  );
  const equity = splitCommaSeparated(
    asString(values, "equity", "1.0, 1.05, 1.08, 1.11, 1.16")
  );
  const benchmark = splitCommaSeparated(
    asString(values, "benchmark", "1.0, 1.02, 1.03, 1.07, 1.09")
  );
  const strategyLabel = asString(values, "strategyLabel", "Strategy");
  const benchmarkLabel = asString(values, "benchmarkLabel", "Benchmark");

  return `<BacktestChart
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_BACKTEST_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  labels={${formatStringArray(labels)}}
  equity={[${equity.join(", ")}]}
  benchmark={[${benchmark.join(", ")}]}
  strategyLabel="${escapeAttribute(strategyLabel)}"
  benchmarkLabel="${escapeAttribute(benchmarkLabel)}"
/>`;
}

function buildProofBlockInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_PROOF_TITLE);
  const strategy = asString(values, "strategy", "Induction");
  const body = asString(values, "body", DEFAULT_PROOF_BODY);
  const conclusion = asString(
    values,
    "conclusion",
    "Close with the one-line consequence the reader should carry into the next section."
  );

  return `<ProofBlock
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_PROOF_TITLE))}"
  strategy="${escapeAttribute(strategy)}"
  conclusion="${escapeAttribute(conclusion)}"
>
  ${withDefaultSelection(body, DEFAULT_PROOF_BODY)}
</ProofBlock>`;
}

function buildDerivationBlockInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_DERIVATION_TITLE);
  const caption = asString(
    values,
    "caption",
    "Split a long derivation into a few steps the reader can verify locally."
  );
  const stepOneLabel = asString(values, "stepOneLabel", "Step 1");
  const stepOneTitle = asString(
    values,
    "stepOneTitle",
    "Start from the objective"
  );
  const stepOneEquation = asString(
    values,
    "stepOneEquation",
    "\\mathcal{L}(x) = \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)"
  );
  const stepOneNote = asString(
    values,
    "stepOneNote",
    "State the objective before taking derivatives so the reader has the full context."
  );
  const stepTwoLabel = asString(values, "stepTwoLabel", "Step 2");
  const stepTwoTitle = asString(values, "stepTwoTitle", "Differentiate");
  const stepTwoEquation = asString(
    values,
    "stepTwoEquation",
    "\\nabla_x \\mathcal{L}(x) = 2A^\\top(Ax - y) + \\lambda \\nabla R(x)"
  );
  const stepTwoNote = asString(
    values,
    "stepTwoNote",
    "Keep only the derivative that changes the update rule."
  );

  return `<DerivationBlock
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_DERIVATION_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  steps={[
    {
      label: "${escapeAttribute(stepOneLabel)}",
      title: "${escapeAttribute(stepOneTitle)}",
      equation: "${escapeAttribute(stepOneEquation)}",
      note: "${escapeAttribute(stepOneNote)}",
    },
    {
      label: "${escapeAttribute(stepTwoLabel)}",
      title: "${escapeAttribute(stepTwoTitle)}",
      equation: "${escapeAttribute(stepTwoEquation)}",
      note: "${escapeAttribute(stepTwoNote)}",
    },
  ]}
/>`;
}

function buildEquationGroupInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_EQUATION_GROUP_TITLE);
  const caption = asString(
    values,
    "caption",
    "AutoEquationRef will pick up the rendered labels from the group below."
  );
  const eqOneId = asString(values, "eqOneId", "eq-objective");
  const eqOneTitle = asString(values, "eqOneTitle", "Objective");
  const eqOneTex = asString(
    values,
    "eqOneTex",
    "\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)"
  );
  const eqOneNote = asString(values, "eqOneNote", "Reconstruction objective.");
  const eqTwoId = asString(values, "eqTwoId", "eq-update");
  const eqTwoTitle = asString(values, "eqTwoTitle", "Update");
  const eqTwoTex = asString(
    values,
    "eqTwoTex",
    "x_{t+1} = x_t - \\eta \\nabla_x \\mathcal{L}(x_t)"
  );
  const eqTwoNote = asString(values, "eqTwoNote", "Gradient descent update.");

  return `Mention the update again with <AutoEquationRef target="${escapeAttribute(
    eqTwoId
  )}" />.\n\n<EquationGroup
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_EQUATION_GROUP_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  equations={[
    {
      id: "${escapeAttribute(eqOneId)}",
      title: "${escapeAttribute(eqOneTitle)}",
      tex: "${escapeAttribute(eqOneTex)}",
      note: "${escapeAttribute(eqOneNote)}",
    },
    {
      id: "${escapeAttribute(eqTwoId)}",
      title: "${escapeAttribute(eqTwoTitle)}",
      tex: "${escapeAttribute(eqTwoTex)}",
      note: "${escapeAttribute(eqTwoNote)}",
    },
  ]}
/>`;
}

function buildTaskSpecCardInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_TASK_TITLE);
  const domain = asString(values, "domain", "Embodied control");
  const environment = asString(values, "environment", "Simulated tabletop");
  const goal = asString(
    values,
    "goal",
    "Move the target object from the source bin to the destination zone without collisions."
  );
  const observations = splitLines(
    asString(
      values,
      "observations",
      "RGB wrist camera\nRobot state\nGripper width"
    )
  );
  const actions = splitLines(
    asString(
      values,
      "actions",
      "Cartesian delta pose\nOpen gripper\nClose gripper"
    )
  );
  const rewards = splitLines(
    asString(
      values,
      "rewards",
      "Dense shaping on distance\nSuccess bonus\nCollision penalty"
    )
  );
  const successCriteria = splitLines(
    asString(
      values,
      "successCriteria",
      "Object in goal zone\nNo collision\nEpisode under 10 seconds"
    )
  );
  const notes = asString(
    values,
    "notes",
    "Use this section to state reset randomness or safety constraints."
  );

  return `<TaskSpecCard
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_TASK_TITLE))}"
  domain="${escapeAttribute(domain)}"
  environment="${escapeAttribute(environment)}"
  goal="${escapeAttribute(goal)}"
  observations={${formatStringArray(observations)}}
  actions={${formatStringArray(actions)}}
  rewards={${formatStringArray(rewards)}}
  successCriteria={${formatStringArray(successCriteria)}}
  notes="${escapeAttribute(notes)}"
/>`;
}

function buildExperimentSetupInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_EXPERIMENT_TITLE);
  const dataset = asString(values, "dataset", "fastMRI knee multicoil");
  const split = asString(
    values,
    "split",
    "Train 973 volumes / Val 199 volumes"
  );
  const compute = asString(values, "compute", "4x A100 80GB");
  const metrics = splitLines(asString(values, "metrics", "PSNR\nSSIM\nNMSE"));
  const settings = splitLines(
    asString(
      values,
      "settings",
      "Optimizer: AdamW\nBatch size: 8\nLearning rate: 3e-4\nEpochs: 120"
    )
  ).map(line => {
    const [label, ...rest] = line.split(":");
    return {
      label: label.trim(),
      value: rest.join(":").trim() || "TBD",
    };
  });
  const notes = asString(
    values,
    "notes",
    "Mention augmentation, seed count, or evaluation caveats here."
  );

  return `<ExperimentSetup
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_EXPERIMENT_TITLE)
  )}"
  dataset="${escapeAttribute(dataset)}"
  split="${escapeAttribute(split)}"
  compute="${escapeAttribute(compute)}"
  metrics={${formatStringArray(metrics)}}
  settings={[
${settings
  .map(
    setting =>
      `    { label: "${escapeAttribute(
        setting.label
      )}", value: "${escapeAttribute(setting.value)}" },`
  )
  .join("\n")}
  ]}
  notes="${escapeAttribute(notes)}"
/>`;
}

function buildHeatmapInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_HEATMAP_TITLE);
  const caption = asString(
    values,
    "caption",
    "Use a heatmap when a matrix pattern matters more than the exact decimal precision."
  );
  const rows = splitLines(
    asString(values, "rows", "Mask 0.05\nMask 0.10\nMask 0.15")
  );
  const columns = splitLines(
    asString(values, "columns", "Depth 4\nDepth 6\nDepth 8")
  );
  const matrix = splitMatrixRows(
    asString(
      values,
      "values",
      "31.1, 31.8, 32.0\n32.5, 33.1, 33.4\n32.7, 33.0, 33.2"
    )
  );
  const format = asString(values, "format", "number");

  return `<Heatmap
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_HEATMAP_TITLE))}"
  caption="${escapeAttribute(caption)}"
  rows={${formatStringArray(rows)}}
  columns={${formatStringArray(columns)}}
  values={${formatMatrix(matrix)}}
  format="${escapeAttribute(format)}"
/>`;
}

function buildConfusionMatrixInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_CONFUSION_TITLE);
  const caption = asString(
    values,
    "caption",
    "Normalize rows when you want each actual class to sum to 100%."
  );
  const labels = splitLines(asString(values, "labels", "Reach\nGrasp\nPlace"));
  const matrix = splitMatrixRows(
    asString(values, "values", "82, 12, 6\n9, 75, 16\n5, 11, 84")
  );
  const normalize = asBoolean(values, "normalize", true);

  return `<ConfusionMatrix
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_CONFUSION_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  labels={${formatStringArray(labels)}}
  values={${formatMatrix(matrix)}}
  ${normalize ? "normalize" : "normalize={false}"}
/>`;
}

function buildMultiPanelFigureInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_MULTI_PANEL_TITLE);
  const caption = asString(
    values,
    "caption",
    "Use matching crops and panel labels when the comparison matters more than decorative layout."
  );
  const columns = asString(values, "columns", "2");
  const panels = splitPipedRows(
    asString(values, "panels", DEFAULT_MULTI_PANEL_PANELS)
  ).map(row => ({
    label: row[0] || "A",
    title: row[1] || "Panel",
    src: row[2] || "/images/posts/recon/panel.png",
    alt: row[3] || "Panel image",
    note: row[4] || "",
  }));

  return `<MultiPanelFigure
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_MULTI_PANEL_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  columns={${columns || "2"}}
  panels={[
${panels
  .map(
    panel => `    {
      label: "${escapeAttribute(panel.label)}",
      title: "${escapeAttribute(panel.title)}",
      src: "${escapeAttribute(panel.src)}",
      alt: "${escapeAttribute(panel.alt)}"${
      panel.note ? `,\n      note: "${escapeAttribute(panel.note)}"` : ""
    },
    },`
  )
  .join("\n")}
  ]}
/>`;
}

function buildKSpaceViewerInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_KSPACE_TITLE);
  const caption = asString(
    values,
    "caption",
    "Pair k-space, mask, reconstruction, and error panels so readers can connect acquisition choices to visible artifacts."
  );
  const columns = asString(values, "columns", "2");
  const panels = splitPipedRows(
    asString(values, "panels", DEFAULT_KSPACE_PANELS)
  ).map(row => ({
    label: row[0] || "Panel",
    src: row[1] || "/images/posts/mri/panel.png",
    alt: row[2] || "MRI panel",
    kind: row[3] || "kspace",
    note: row[4] || "",
  }));

  return `<KSpaceViewer
  title="${escapeAttribute(withDefaultSelection(title, DEFAULT_KSPACE_TITLE))}"
  caption="${escapeAttribute(caption)}"
  columns={${columns || "2"}}
  panels={[
${panels
  .map(
    panel => `    {
      label: "${escapeAttribute(panel.label)}",
      src: "${escapeAttribute(panel.src)}",
      alt: "${escapeAttribute(panel.alt)}",
      kind: "${escapeAttribute(panel.kind)}"${
      panel.note ? `,\n      note: "${escapeAttribute(panel.note)}"` : ""
    },
    },`
  )
  .join("\n")}
  ]}
/>`;
}

function buildMetricTableInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_METRIC_TABLE_TITLE);
  const caption = asString(
    values,
    "caption",
    "Use this for benchmark sections where each row is a model or strategy and each column is a metric that readers compare directly."
  );
  const rowLabel = asString(values, "rowLabel", "Model");
  const metrics = splitPipedRows(
    asString(values, "metrics", DEFAULT_METRIC_TABLE_METRICS)
  ).map(row => ({
    key: row[0] || "metric",
    label: row[1] || row[0] || "Metric",
    direction: row[2] || "higher",
    format: row[3] || "number",
  }));
  const rows = splitPipedRows(
    asString(values, "rows", DEFAULT_METRIC_TABLE_ROWS)
  ).map(row => {
    const label = row[0] || "Entry";
    const tagIndex = 1 + metrics.length;
    const noteIndex = tagIndex + 1;
    const formattedValues = metrics
      .map((metric, index) => {
        const value = parseNumberValue(row[index + 1] || "0");
        return `        ${metric.key}: ${
          typeof value === "number" ? value : `"${escapeAttribute(value)}"`
        },`;
      })
      .join("\n");

    return `    {
      label: "${escapeAttribute(label)}",
      values: {
${formattedValues}
      },${
        row[tagIndex] ? `\n      tag: "${escapeAttribute(row[tagIndex])}",` : ""
      }${
      row[noteIndex]
        ? `\n      note: "${escapeAttribute(row[noteIndex])}",`
        : ""
    }${
      row[tagIndex]?.toLowerCase() === "featured"
        ? "\n      featured: true,"
        : ""
    }
    },`;
  });

  return `<MetricTable
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_METRIC_TABLE_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  rowLabel="${escapeAttribute(rowLabel)}"
  metrics={[
${metrics
  .map(
    metric => `    {
      key: "${escapeAttribute(metric.key)}",
      label: "${escapeAttribute(metric.label)}",
      direction: "${escapeAttribute(metric.direction)}",
      format: "${escapeAttribute(metric.format)}",
    },`
  )
  .join("\n")}
  ]}
  rows={[
${rows.join("\n")}
  ]}
/>`;
}

function buildLeaderboardTableInsert(values: ComponentSnippetFormValues) {
  const title = asString(values, "title", DEFAULT_LEADERBOARD_TITLE);
  const caption = asString(
    values,
    "caption",
    "Use this when ranking matters more than showing every metric, such as strategy selection or benchmark leaderboards."
  );
  const scoreLabel = asString(values, "scoreLabel", "Sharpe");
  const deltaLabel = asString(values, "deltaLabel", "Delta vs baseline");
  const scoreFormat = asString(values, "scoreFormat", "number");
  const higherIsBetter = asBoolean(values, "higherIsBetter", true);
  const entries = splitPipedRows(
    asString(values, "entries", DEFAULT_LEADERBOARD_ENTRIES)
  ).map(row => {
    const score = parseNumberValue(row[1] || "0");
    const delta = parseNumberValue(row[2] || "0");

    return `    {
      label: "${escapeAttribute(row[0] || "Entry")}",
      score: ${
        typeof score === "number" ? score : `"${escapeAttribute(score)}"`
      },${
      row[2]
        ? `\n      delta: ${
            typeof delta === "number" ? delta : `"${escapeAttribute(delta)}"`
          },`
        : ""
    }${row[3] ? `\n      tag: "${escapeAttribute(row[3])}",` : ""}${
      row[4] ? `\n      note: "${escapeAttribute(row[4])}",` : ""
    }
    },`;
  });

  return `<LeaderboardTable
  title="${escapeAttribute(
    withDefaultSelection(title, DEFAULT_LEADERBOARD_TITLE)
  )}"
  caption="${escapeAttribute(caption)}"
  scoreLabel="${escapeAttribute(scoreLabel)}"
  deltaLabel="${escapeAttribute(deltaLabel)}"
  scoreFormat="${escapeAttribute(scoreFormat)}"
  ${higherIsBetter ? "higherIsBetter" : "higherIsBetter={false}"}
  entries={[
${entries.join("\n")}
  ]}
/>`;
}

export function getComponentDefaultValues(
  entry: ComponentSnippet
): ComponentSnippetFormValues {
  return (entry.fields ?? []).reduce<ComponentSnippetFormValues>(
    (values, field) => {
      const defaultValue = field.defaultValue;
      values[field.id] = Array.isArray(defaultValue)
        ? defaultValue.map(row => ({ ...row }))
        : defaultValue ??
          (field.type === "boolean"
            ? false
            : field.type === "repeatable"
            ? []
            : "");
      return values;
    },
    {}
  );
}

export function getComponentCategories(
  entries: ComponentSnippet[] = componentsPalette
) {
  const categories: string[] = [];

  for (const entry of entries) {
    if (!categories.includes(entry.category)) {
      categories.push(entry.category);
    }
  }

  return categories;
}

export function renderComponentInsert(
  entry: ComponentSnippet,
  values: ComponentSnippetFormValues = getComponentDefaultValues(entry)
): ComponentSnippetInsert {
  const rawSnippet = entry.buildInsert
    ? entry.buildInsert(values)
    : entry.template ?? entry.snippet;
  let content = "";
  let selectionStart: number | null = null;
  let selectionEnd: number | null = null;
  let cursor = 0;

  for (const match of rawSnippet.matchAll(selectionPattern)) {
    const matchIndex = match.index ?? 0;
    const [fullMatch, editableValue] = match;

    content += rawSnippet.slice(cursor, matchIndex);
    const start = content.length;
    content += editableValue;

    if (selectionStart == null) {
      selectionStart = start;
      selectionEnd = start + editableValue.length;
    }

    cursor = matchIndex + fullMatch.length;
  }

  content += rawSnippet.slice(cursor);

  return {
    content,
    selectionStart,
    selectionEnd,
  };
}

export const componentsPalette: ComponentSnippet[] = [
  {
    id: "markdown-basics",
    category: "Basics",
    label: "Markdown Basics",
    hint: "Headings, paragraphs, lists, and inline code",
    searchTerms: ["markdown", "heading", "list", "paragraph"],
    snippet: `## Section heading
### Subsection heading
#### Detail heading

Write a paragraph with inline code like \`const ready = true;\`.

- Bullet item one
- Bullet item two

1. Ordered step one
2. Ordered step two`,
    template: `## [[Section heading]]
### Subsection heading
#### Detail heading

Write a paragraph with inline code like \`const ready = true;\`.

- Bullet item one
- Bullet item two

1. Ordered step one
2. Ordered step two`,
    notes: [
      "Article metadata renders the page title, so start body headings at ##. Use regular Markdown first; reach for custom components only when plain prose is no longer enough.",
    ],
  },
  {
    id: "link-blockquote",
    category: "Basics",
    label: "Link & Blockquote",
    hint: "Styled links and callout-style quotes",
    searchTerms: ["link", "quote", "blockquote"],
    snippet: `This paragraph links to [Next.js](https://nextjs.org).

> A short blockquote that stands out from the main article flow.`,
    template: `This paragraph links to [Next.js](https://nextjs.org).

> [[A short blockquote that stands out from the main article flow.]]`,
  },
  {
    id: "callout",
    category: "Basics",
    label: "Callout",
    hint: "Methodological note, caution, or important boundary",
    searchTerms: ["note", "caution", "important", "limitation", "warning"],
    snippet: `<Callout type="note" title="Methodological note">
  State the condition readers need to keep in mind when interpreting the argument.
</Callout>`,
    fields: [
      {
        id: "type",
        label: "Type",
        type: "select",
        required: true,
        defaultValue: "note",
        options: [
          { label: "Note", value: "note" },
          { label: "Caution", value: "caution" },
          { label: "Important", value: "important" },
        ],
      },
      {
        id: "title",
        label: "Title",
        type: "text",
        defaultValue: "Methodological note",
        example: "Scope and evidence",
      },
      {
        id: "body",
        label: "Body",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_CALLOUT_BODY,
        example:
          "Explain the one thing readers should notice before they continue.",
        rows: 4,
      },
    ],
    buildInsert: buildCalloutInsert,
    notes: [
      'Supported types: `"note"`, `"caution"`, and `"important"`.',
      "Use this for an interpretive boundary or a condition that the surrounding prose should not bury.",
    ],
  },
  {
    id: "snippet",
    category: "Code & Structure",
    label: "Snippet",
    hint: "Referenceable code or configuration listing",
    searchTerms: ["code", "terminal", "shell", "listing", "line numbers"],
    snippet: `<Snippet label="Listing 1 · protocol.yaml" language="yaml" lineNumbers caption="State what this listing demonstrates.">
  <code className="language-yaml">{\`assumptions:
  signal_lag: 21 trading days
  execution: next tradable open
  costs: 25 bps one way\`}</code>
</Snippet>`,
    template: `<Snippet label="Listing 1 · protocol.yaml" language="yaml" lineNumbers caption="State what this listing demonstrates.">
  <code className="language-yaml">{\`[[assumptions:
  signal_lag: 21 trading days
  execution: next tradable open
  costs: 25 bps one way]]\`}</code>
</Snippet>`,
  },
  {
    id: "tabs",
    category: "Code & Structure",
    label: "Tabs",
    hint: "Switch between code or content variants",
    searchTerms: ["tab", "comparison", "variants"],
    snippet: `<Tabs lineNumbers caption="Choose the version you need">
  <Tab title="TypeScript">

\`\`\`ts
export function formatViews(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
\`\`\`

  </Tab>
  <Tab title="JavaScript">

\`\`\`js
export function formatViews(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
\`\`\`

  </Tab>
</Tabs>`,
    template: `<Tabs lineNumbers caption="[[Choose the version you need]]">
  <Tab title="TypeScript">

\`\`\`ts
export function formatViews(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
\`\`\`

  </Tab>
  <Tab title="JavaScript">

\`\`\`js
export function formatViews(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
\`\`\`

  </Tab>
</Tabs>`,
    notes: [
      "Tabs can render either prose or code blocks.",
      "Code tabs automatically reuse the Snippet renderer.",
    ],
  },
  {
    id: "table",
    category: "Code & Structure",
    label: "Table",
    hint: "Structured comparison table",
    searchTerms: ["table", "grid", "comparison"],
    snippet: `<Table
  id="table-component-support"
  label="Table 1"
  title="Component support by writing task"
  caption="State what is being compared and how the entries were determined."
  source="Author's analysis."
  notes="Define abbreviations and exceptions here."
>
  <THead>
    <TR>
      <TH>Component</TH>
      <TH>Use case</TH>
      <TH>Client only</TH>
    </TR>
  </THead>
  <TBody>
    <TR>
      <TD>Tabs</TD>
      <TD>Compare multiple approaches</TD>
      <TD>Yes</TD>
    </TR>
  </TBody>
</Table>`,
    template: `<Table
  id="table-component-support"
  label="Table 1"
  title="[[Component support by writing task]]"
  caption="State what is being compared and how the entries were determined."
  source="Author's analysis."
  notes="Define abbreviations and exceptions here."
>
  <THead>
    <TR>
      <TH>Component</TH>
      <TH>Use case</TH>
      <TH>Client only</TH>
    </TR>
  </THead>
  <TBody>
    <TR>
      <TD>[[Tabs]]</TD>
      <TD>Compare multiple approaches</TD>
      <TD>Yes</TD>
    </TR>
  </TBody>
</Table>`,
  },
  {
    id: "steps",
    category: "Code & Structure",
    label: "Steps",
    hint: "Numbered process walkthrough",
    searchTerms: ["steps", "process", "workflow"],
    snippet: `<Steps title="Publishing workflow">
  <Step title="Draft">Write the first version.</Step>
  <Step title="Review">Verify metadata and previews.</Step>
  <Step title="Publish">Promote the post when it is ready.</Step>
</Steps>`,
    template: `<Steps title="[[Publishing workflow]]">
  <Step title="Draft">Write the first version.</Step>
  <Step title="Review">Verify metadata and previews.</Step>
  <Step title="Publish">Promote the post when it is ready.</Step>
</Steps>`,
  },
  {
    id: "algorithm",
    category: "Code & Structure",
    label: "Algorithm",
    hint: "Numbered pseudocode with input, output, indentation, and notes",
    searchTerms: ["algorithm", "pseudocode", "procedure", "steps", "logic"],
    snippet: `<Algorithm
  id="alg-greedy-selection"
  label="1"
  title="Greedy selection"
  input="Candidates C"
  output="Selected set S"
  caption="State the invariant or decision rule in the surrounding prose."
  emphasizedSteps={[3, 4]}
  steps={[
    { statement: "selected ← ∅", indent: 0, comment: "Initialize the solution set" },
    { statement: "for each candidate c in candidates do", indent: 0 },
    { statement: "if improves(selected, c) then", indent: 1 },
    { statement: "selected ← selected ∪ {c}", indent: 2 },
    { statement: "return selected", indent: 0 },
  ]}
/>`,
    fields: [
      {
        id: "id",
        label: "Stable ID",
        type: "text",
        required: true,
        defaultValue: DEFAULT_ALGORITHM_ID,
        help: "Use a unique, article-local ID when you want to cite this algorithm.",
      },
      {
        id: "label",
        label: "Algorithm number",
        type: "text",
        defaultValue: DEFAULT_ALGORITHM_LABEL,
        help: "Use a stable article-local number, for example 1 or 2.1.",
      },
      {
        id: "title",
        label: "Algorithm title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_ALGORITHM_TITLE,
      },
      {
        id: "input",
        label: "Input",
        type: "text",
        defaultValue: "Candidates C",
      },
      {
        id: "output",
        label: "Output",
        type: "text",
        defaultValue: "Selected set S",
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "State the invariant or decision rule in the surrounding prose.",
        rows: 3,
      },
      {
        id: "emphasizedSteps",
        label: "Emphasized steps",
        type: "text",
        defaultValue: "",
        placeholder: "3, 4",
        help: "Optional rendered step numbers, separated by commas. Use only for steps discussed directly in the surrounding text.",
      },
      {
        id: "steps",
        label: "Pseudocode steps",
        type: "repeatable",
        required: true,
        defaultValue: DEFAULT_ALGORITHM_STEPS,
        minItems: 1,
        itemLabel: "Step",
        addLabel: "Add step",
        help: "Use indentation to show control flow. Statements remain plain text so the generated MDX is easy to edit by hand.",
        itemFields: [
          {
            id: "statement",
            label: "Statement",
            placeholder: "if condition then",
            defaultValue: "Describe the next step",
          },
          {
            id: "indent",
            label: "Indent",
            placeholder: "0",
            defaultValue: "0",
          },
          {
            id: "comment",
            label: "Comment",
            placeholder: "Optional explanation",
            defaultValue: "",
          },
        ],
      },
    ],
    buildInsert: buildAlgorithmInsert,
    notes: [
      "Use Algorithm for a method readers need to reproduce, not for a normal prose checklist.",
      "Keep formulas in surrounding text or a MathBlock; pseudocode statements should stay concise.",
      "Emphasize a line only when the surrounding prose discusses that exact step; it is not syntax highlighting.",
    ],
  },
  {
    id: "file-tree",
    category: "Code & Structure",
    label: "FileTree",
    hint: "Repository or service layout with file-type colors",
    searchTerms: ["file tree", "folder", "repo", "structure", "paths"],
    snippet: `<FileTree
  rootLabel="workspace"
  paths={[
    "app/api/inference/route.ts",
    "lib/mri/reconstruct.cpp",
    "lib/mri/reconstruct.hpp",
    "config/CMakeLists.txt",
    "config/research.yaml",
    "data/manifest.json",
    "report/methods.md",
    "public/coil-sensitivity.svg",
    "workers/train/index.py",
  ]}
/>`,
    fields: [
      {
        id: "rootLabel",
        label: "Root label",
        type: "text",
        defaultValue: "workspace",
      },
      {
        id: "paths",
        label: "Paths",
        type: "textarea",
        required: true,
        defaultValue:
          "app/api/inference/route.ts\nlib/mri/reconstruct.cpp\nlib/mri/reconstruct.hpp\nconfig/CMakeLists.txt\nconfig/research.yaml\ndata/manifest.json\nreport/methods.md\npublic/coil-sensitivity.svg\nworkers/train/index.py",
        help: "Use one path per line.",
        rows: 9,
      },
    ],
    buildInsert: buildFileTreeInsert,
  },
  {
    id: "terminal-block",
    category: "Code & Structure",
    label: "TerminalBlock",
    hint: "Command session, logs, and experiment output",
    searchTerms: ["terminal", "shell", "logs", "training output", "cli"],
    snippet: `<TerminalBlock
  title="Training session"
  caption="Mix commands and structured status lines to show what actually happened during the run."
  lines={[
    "$ uv run train.py --config fastmri.yaml",
    "[info] Loaded 973 volumes",
    "[success] Validation PSNR 33.4",
    "[warn] GPU memory reached 90%",
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Terminal title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_TERMINAL_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Mix commands and structured status lines to show what actually happened during the run.",
        rows: 3,
      },
      {
        id: "lines",
        label: "Lines",
        type: "textarea",
        required: true,
        defaultValue:
          "$ uv run train.py --config fastmri.yaml\n[info] Loaded 973 volumes\n[success] Validation PSNR 33.4\n[warn] GPU memory reached 90%",
        help: "Use one line per row. Prefix commands with `$ ` and status lines with `[info]`, `[success]`, `[warn]`, or `[error]`.",
        rows: 6,
      },
    ],
    buildInsert: buildTerminalBlockInsert,
  },
  {
    id: "accordion",
    category: "Code & Structure",
    label: "Accordion",
    hint: "Expandable FAQ or deep-dive notes",
    searchTerms: ["faq", "accordion", "collapsible"],
    snippet: `<Accordion>
  <AccordionItem title="Why MDX?" open>
    MDX keeps prose and components in one place.
  </AccordionItem>
  <AccordionItem title="When should I use it?">
    Use it when prose alone is not enough.
  </AccordionItem>
</Accordion>`,
    template: `<Accordion>
  <AccordionItem title="[[Why MDX?]]" open>
    MDX keeps prose and components in one place.
  </AccordionItem>
  <AccordionItem title="When should I use it?">
    Use it when prose alone is not enough.
  </AccordionItem>
</Accordion>`,
  },
  {
    id: "timeline",
    category: "Code & Structure",
    label: "Timeline",
    hint: "Chronological milestones for historical or research narratives",
    searchTerms: ["timeline", "history", "chronology", "milestone"],
    snippet: `<Timeline>
  <TimelineItem title="Quantitative mapping enters MRI" date="1973">
    State the methodological or historical change and cite the primary source in the narrative.
  </TimelineItem>
  <TimelineItem title="Clinical translation accelerates" date="1990s">
    Explain what changed, what evidence supports it, and what remained unresolved.
  </TimelineItem>
</Timeline>`,
    template: `<Timeline>
  <TimelineItem title="[[Quantitative mapping enters MRI]]" date="1973">
    State the methodological or historical change and cite the primary source in the narrative.
  </TimelineItem>
  <TimelineItem title="Clinical translation accelerates" date="1990s">
    Explain what changed, what evidence supports it, and what remained unresolved.
  </TimelineItem>
</Timeline>`,
  },
  {
    id: "figure-image",
    category: "Visuals",
    label: "Figure + Image",
    hint: "Single image with sizing and caption support",
    searchTerms: ["image", "figure", "cover", "photo"],
    snippet: `<Figure id="fig-example">
  <Image src="${DEFAULT_AVATAR}" alt="Author portrait" width={null} height={null} />
</Figure>`,
    fields: [
      {
        id: "id",
        label: "Figure ID",
        type: "text",
        defaultValue: "fig-example",
        help: "Use a unique ID when the figure is cited from the article text.",
      },
      {
        id: "src",
        label: "Image source",
        type: "text",
        required: true,
        defaultValue: DEFAULT_AVATAR,
        example: "/images/posts/my-post/hero.jpg",
      },
      {
        id: "alt",
        label: "Alt text",
        type: "text",
        required: true,
        defaultValue: DEFAULT_IMAGE_ALT,
        example: "Publishing dashboard with draft and scheduled posts",
      },
      {
        id: "wide",
        label: "Use wide figure treatment",
        type: "boolean",
        defaultValue: false,
      },
    ],
    buildInsert: buildFigureInsert,
    notes: [
      "Keep `width={null}` and `height={null}` when you want the component to infer the image size automatically.",
    ],
  },
  {
    id: "gallery",
    category: "Visuals",
    label: "Gallery",
    hint: "Responsive image gallery",
    searchTerms: ["gallery", "images", "photos", "masonry"],
    snippet: `<Gallery
  columns={3}
  images={[
    { src: "/images/avatar-placeholder.svg", alt: "Preview one", caption: "First image" },
    { src: "/images/avatar-placeholder-muted.svg", alt: "Preview two", caption: "Second image" },
  ]}
/>`,
    template: `<Gallery
  columns={3}
  images={[
    { src: "[[${DEFAULT_IMAGE}]]", alt: "Preview one", caption: "First image" },
    { src: "${DEFAULT_MUTED_IMAGE}", alt: "Preview two", caption: "Second image" },
  ]}
/>`,
  },
  {
    id: "pull-quote",
    category: "Visuals",
    label: "PullQuote",
    hint: "Large, centered pull quote",
    searchTerms: ["quote", "pull quote", "testimonial"],
    snippet: `<PullQuote author="Author name">
  Writing gets easier when the structure helps instead of fights you.
</PullQuote>`,
    fields: [
      {
        id: "author",
        label: "Author",
        type: "text",
        defaultValue: "Author name",
      },
      {
        id: "quote",
        label: "Quote",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_PULL_QUOTE,
        example:
          "The writing workflow improves when the tooling stays out of the way.",
        rows: 4,
      },
    ],
    buildInsert: buildPullQuoteInsert,
  },
  {
    id: "stats",
    category: "Data",
    label: "Stats",
    hint: "Compact reported quantities",
    searchTerms: ["stats", "metrics", "numbers"],
    snippet: `<Stats>
  <Stat value="24" label="Published posts" trend="+3 this month" />
  <Stat value="1.2K" label="Subscribers" trend="+9%" />
</Stats>`,
    template: `<Stats>
  <Stat value="24" label="[[Published posts]]" trend="+3 this month" />
  <Stat value="1.2K" label="Subscribers" trend="+9%" />
</Stats>`,
  },
  {
    id: "key-value-list",
    category: "Data",
    label: "KeyValueList",
    hint: "Compact labeled facts",
    searchTerms: ["facts", "metadata", "details", "key value"],
    snippet: `<KeyValueList>
  <KeyValueItem label="Stack" value="Next.js + MDX" />
  <KeyValueItem label="Status" value="In active development" />
</KeyValueList>`,
    template: `<KeyValueList>
  <KeyValueItem label="[[Stack]]" value="Next.js + MDX" />
  <KeyValueItem label="Status" value="In active development" />
</KeyValueList>`,
  },
  {
    id: "compare",
    category: "Data",
    label: "Compare",
    hint: "Side-by-side comparison block",
    searchTerms: ["compare", "comparison", "left right"],
    snippet: `<Compare
  leftTitle="Approach A"
  rightTitle="Approach B"
  left="A fast summary of the first option."
  right="A fast summary of the second option."
/>`,
    fields: [
      {
        id: "leftTitle",
        label: "Left title",
        type: "text",
        required: true,
        defaultValue: "Approach A",
        example: "Static rendering",
      },
      {
        id: "rightTitle",
        label: "Right title",
        type: "text",
        required: true,
        defaultValue: "Approach B",
        example: "Runtime rendering",
      },
      {
        id: "left",
        label: "Left content",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_COMPARE_LEFT,
        rows: 3,
      },
      {
        id: "right",
        label: "Right content",
        type: "textarea",
        required: true,
        defaultValue: "A fast summary of the second option.",
        rows: 3,
      },
    ],
    buildInsert: buildCompareInsert,
  },
  {
    id: "diff",
    category: "Data",
    label: "Diff",
    hint: "Before and after code or text",
    searchTerms: ["diff", "before", "after", "refactor"],
    snippet: `<Diff
  beforeTitle="Before"
  afterTitle="After"
  before={'console.log("before");'}
  after={'console.log("after");'}
/>`,
    fields: [
      {
        id: "beforeTitle",
        label: "Before title",
        type: "text",
        required: true,
        defaultValue: "Before",
      },
      {
        id: "afterTitle",
        label: "After title",
        type: "text",
        required: true,
        defaultValue: "After",
      },
      {
        id: "before",
        label: "Before content",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_DIFF_BEFORE,
        example: "fetch(url).then(res => res.json()).then(handleResult);",
        rows: 4,
      },
      {
        id: "after",
        label: "After content",
        type: "textarea",
        required: true,
        defaultValue: 'console.log("after");',
        example: "const data = await fetchData();\nhandleResult(data);",
        rows: 4,
      },
    ],
    buildInsert: buildDiffInsert,
  },
  {
    id: "inline-math",
    category: "Research & Analysis",
    label: "InlineMath",
    hint: "Inline equation for methods, losses, and notation",
    searchTerms: ["math", "equation", "latex", "formula", "inline"],
    snippet: `<InlineMath tex="\\mathcal{L}(x, y) = \\lVert Ax - y \\rVert_2^2" />`,
    fields: [
      {
        id: "tex",
        label: "TeX expression",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_INLINE_MATH,
        example: "\\nabla_x f(x) = Ax - b",
        rows: 3,
      },
    ],
    buildInsert: buildInlineMathInsert,
    notes: [
      "Use inline math for symbols and short expressions that should stay inside a sentence.",
    ],
  },
  {
    id: "math-block",
    category: "Research & Analysis",
    label: "MathBlock",
    hint: "Displayed equation with automatic page-level numbering and caption",
    searchTerms: ["math", "equation", "display", "latex", "loss"],
    snippet: `Mention the objective again with <AutoEquationRef target="eq-main" />.

<MathBlock
  id="eq-main"
  tex="\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)"
  caption="Reference this equation from the surrounding text. The page-level numbering system will fill the label automatically."
/>`,
    fields: [
      {
        id: "id",
        label: "Anchor ID",
        type: "text",
        defaultValue: "eq-main",
        example: "eq-varnet-objective",
      },
      {
        id: "tex",
        label: "TeX expression",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_MATH_BLOCK,
        example:
          "\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)",
        rows: 4,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Reference this equation from the surrounding text. The page-level numbering system will fill the label automatically.",
        rows: 3,
      },
    ],
    buildInsert: buildMathBlockInsert,
    notes: [
      "Pair this with `AutoEquationRef` when you want equation references to stay in sync automatically.",
    ],
  },
  {
    id: "paper-card",
    category: "Research & Analysis",
    label: "PaperCard",
    hint: "Structured paper summary with links, tags, and takeaway text",
    searchTerms: ["paper", "reference", "reading list", "arxiv", "citation"],
    snippet: `<PaperCard
  title="Recurrent Variational Networks for MRI Reconstruction"
  authors={["Hammernik et al."]}
  venue="MICCAI"
  year="2018"
  tags={["MRI", "Reconstruction", "Variational"]}
  status="Must read"
  links={[
    { label: "Paper", href: "https://arxiv.org/" },
    { label: "Code", href: "https://github.com/" },
  ]}
>
  Summarize the main contribution, the evaluation setting, and the one result readers should remember.
</PaperCard>`,
    fields: [
      {
        id: "title",
        label: "Paper title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_PAPER_TITLE,
      },
      {
        id: "authors",
        label: "Authors",
        type: "text",
        required: true,
        defaultValue: DEFAULT_PAPER_AUTHORS,
        help: "Separate multiple authors with commas.",
        example: "Hammernik et al., Sriram et al.",
      },
      {
        id: "venue",
        label: "Venue",
        type: "text",
        defaultValue: "MICCAI",
      },
      {
        id: "year",
        label: "Year",
        type: "text",
        defaultValue: "2018",
      },
      {
        id: "summary",
        label: "Summary",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_PAPER_SUMMARY,
        rows: 4,
      },
      {
        id: "tags",
        label: "Tags",
        type: "text",
        defaultValue: "MRI, Reconstruction, Variational",
        help: "Separate multiple tags with commas.",
      },
      {
        id: "status",
        label: "Status label",
        type: "text",
        defaultValue: "Must read",
        example: "Core reference",
      },
      {
        id: "paperUrl",
        label: "Paper URL",
        type: "text",
        defaultValue: "https://arxiv.org/",
      },
      {
        id: "codeUrl",
        label: "Code URL",
        type: "text",
        defaultValue: "https://github.com/",
      },
      {
        id: "projectUrl",
        label: "Project URL",
        type: "text",
        defaultValue: "",
      },
    ],
    buildInsert: buildPaperCardInsert,
  },
  {
    id: "citation-bibliography",
    category: "Research & Analysis",
    label: "Citation + Bibliography",
    hint: "Inline citation plus structured reference entry",
    searchTerms: ["citation", "bibliography", "reference", "paper", "source"],
    snippet: `Reference the method inline with <Citation refId="paper-1" label="[1]" />.

<Bibliography>
  <BibliographyItem
    id="paper-1"
    label="[1]"
    title="Learning to see in k-space"
    authors={["Hammernik et al."]}
    venue="arXiv"
    year="2024"
    note="Use this note for one sentence on why the citation matters."
    links={[
      { label: "Paper", href: "https://arxiv.org/" },
    ]}
  />
</Bibliography>`,
    fields: [
      {
        id: "refId",
        label: "Reference ID",
        type: "text",
        required: true,
        defaultValue: "paper-1",
        example: "varnet-2020",
      },
      {
        id: "label",
        label: "Citation label",
        type: "text",
        defaultValue: "[1]",
        example: "[3]",
      },
      {
        id: "title",
        label: "Reference title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_CITATION_TITLE,
      },
      {
        id: "authors",
        label: "Authors",
        type: "text",
        defaultValue: DEFAULT_PAPER_AUTHORS,
        help: "Separate multiple authors with commas.",
      },
      {
        id: "venue",
        label: "Venue",
        type: "text",
        defaultValue: "arXiv",
      },
      {
        id: "year",
        label: "Year",
        type: "text",
        defaultValue: "2024",
      },
      {
        id: "note",
        label: "Reference note",
        type: "textarea",
        defaultValue:
          "Use this note for one sentence on why the citation matters.",
        rows: 3,
      },
      {
        id: "paperUrl",
        label: "Paper URL",
        type: "text",
        defaultValue: "https://arxiv.org/",
      },
      {
        id: "codeUrl",
        label: "Code URL",
        type: "text",
        defaultValue: "",
      },
    ],
    buildInsert: buildCitationInsert,
  },
  {
    id: "chart",
    category: "Research & Analysis",
    label: "Chart",
    hint: "Lightweight SVG chart for curves, benchmarks, and time series",
    searchTerms: ["chart", "plot", "curve", "experiment", "backtest"],
    snippet: `<Chart
  id="fig-validation-psnr"
  title="Validation PSNR across epochs"
  description="Show the one trend that matters and keep the axis labels short."
  xLabels={["0", "10", "20", "30", "40"]}
  series={[
    { label: "Ours", type: "line", data: [29.1, 31.4, 32.5, 33.1, 33.4] },
    { label: "Baseline", type: "area", data: [28.4, 29.7, 30.2, 30.6, 30.9] },
  ]}
/>`,
    fields: [
      {
        id: "id",
        label: "Chart ID",
        type: "text",
        defaultValue: DEFAULT_CHART_ID,
        help: "Use a unique ID when the chart is cited from the article text.",
      },
      {
        id: "title",
        label: "Chart title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_CHART_TITLE,
      },
      {
        id: "description",
        label: "Description",
        type: "textarea",
        defaultValue:
          "Show the one trend that matters and keep the axis labels short.",
        rows: 3,
      },
      {
        id: "xLabels",
        label: "X labels",
        type: "text",
        required: true,
        defaultValue: "0, 10, 20, 30, 40",
        help: "Separate labels with commas.",
      },
      {
        id: "primaryLabel",
        label: "Primary series label",
        type: "text",
        defaultValue: "Ours",
      },
      {
        id: "primaryData",
        label: "Primary series data",
        type: "text",
        required: true,
        defaultValue: "29.1, 31.4, 32.5, 33.1, 33.4",
        help: "Separate numeric values with commas.",
      },
      {
        id: "secondaryLabel",
        label: "Secondary series label",
        type: "text",
        defaultValue: "Baseline",
      },
      {
        id: "secondaryData",
        label: "Secondary series data",
        type: "text",
        required: true,
        defaultValue: "28.4, 29.7, 30.2, 30.6, 30.9",
        help: "Separate numeric values with commas.",
      },
      {
        id: "primaryLower",
        label: "Primary interval lower bounds",
        type: "text",
        defaultValue: "",
        help: "Optional. Provide one numeric lower bound per primary value to show an uncertainty interval.",
      },
      {
        id: "primaryUpper",
        label: "Primary interval upper bounds",
        type: "text",
        defaultValue: "",
        help: "Optional. Must have the same number of values as the lower bounds.",
      },
      {
        id: "intervalDisplay",
        label: "Interval display",
        type: "select",
        defaultValue: "band",
        options: [
          { label: "Confidence band", value: "band" },
          { label: "Error bars", value: "bars" },
        ],
      },
      {
        id: "barMode",
        label: "Bar layout",
        type: "select",
        defaultValue: "grouped",
        options: [
          { label: "Grouped bars", value: "grouped" },
          { label: "Stacked bars", value: "stacked" },
        ],
        help: "Stack only values that add to a meaningful total. This setting has no effect without bar series.",
      },
      {
        id: "yFormat",
        label: "Y axis format",
        type: "select",
        defaultValue: "number",
        options: [
          { label: "Number", value: "number" },
          { label: "Percent", value: "percent" },
        ],
      },
    ],
    buildInsert: buildChartInsert,
  },
  {
    id: "scatter-plot",
    category: "Research & Analysis",
    label: "ScatterPlot",
    hint: "Point cloud for agreement, calibration, correlation, or dispersion",
    searchTerms: ["scatter", "correlation", "calibration", "agreement", "points"],
    snippet: `<ScatterPlot
  id="fig-observed-estimated"
  title="Observed versus estimated quantity"
  xLabel="Reference quantity"
  yLabel="Estimated quantity"
  series={[
    {
      label: "Held-out fixture",
      color: "#2563eb",
      points: [
        { x: 0.12, y: 0.16 }, { x: 0.25, y: 0.23 }, { x: 0.37, y: 0.39 },
      ],
    },
  ]}
  caption="State the unit, reference, and any repeated-measurement structure."
/>`,
    fields: [
      { id: "id", label: "Figure ID", type: "text", required: true, defaultValue: "fig-observed-estimated" },
      { id: "title", label: "Figure title", type: "text", required: true, defaultValue: DEFAULT_SCATTER_TITLE },
      { id: "xLabel", label: "X-axis label", type: "text", defaultValue: "Reference quantity" },
      { id: "yLabel", label: "Y-axis label", type: "text", defaultValue: "Estimated quantity" },
      {
        id: "series",
        label: "Series",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_SCATTER_SERIES,
        help: "One series per line: `label | colour | x:y, x:y, ...`.",
        rows: 5,
      },
    ],
    buildInsert: buildScatterPlotInsert,
    notes: ["A scatter plot shows observations, not a fitted causal relationship. State the reference and the sampling unit."],
  },
  {
    id: "histogram",
    category: "Research & Analysis",
    label: "Histogram",
    hint: "Explicitly binned distribution with adjacent bars",
    searchTerms: ["histogram", "distribution", "bins", "residuals", "frequency"],
    snippet: `<Histogram
  id="fig-residual-distribution"
  title="Residual distribution"
  xLabel="Absolute residual"
  yLabel="Cases"
  bins={[
    { label: "0–0.02", count: 42 },
    { label: "0.02–0.04", count: 31 },
    { label: "0.04–0.06", count: 16 },
  ]}
  caption="State the bin edges, denominator, and excluded observations."
/>`,
    fields: [
      { id: "id", label: "Figure ID", type: "text", required: true, defaultValue: "fig-residual-distribution" },
      { id: "title", label: "Figure title", type: "text", required: true, defaultValue: DEFAULT_HISTOGRAM_TITLE },
      { id: "xLabel", label: "X-axis label", type: "text", defaultValue: "Absolute residual" },
      { id: "yLabel", label: "Y-axis label", type: "text", defaultValue: "Cases" },
      {
        id: "bins",
        label: "Bins",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_HISTOGRAM_BINS,
        help: "One bin per line: `displayed bin label | count`. Choose and disclose the bin edges yourself.",
        rows: 6,
      },
    ],
    buildInsert: buildHistogramInsert,
    notes: ["The component does not derive bins from raw observations; that analytic choice remains explicit in the article."],
  },
  {
    id: "box-plot",
    category: "Research & Analysis",
    label: "BoxPlot",
    hint: "Five-number distribution summary across strategies, cohorts, or methods",
    searchTerms: ["box plot", "distribution", "quartile", "median", "whisker", "returns"],
    snippet: `<BoxPlot
  id="fig-return-distribution"
  title="Monthly return distribution"
  yLabel="Monthly net return"
  yFormat="percent"
  items={[
    { label: "Trend", lowerWhisker: -0.14, q1: -0.03, median: 0.01, q3: 0.05, upperWhisker: 0.16 },
    { label: "Value", lowerWhisker: -0.12, q1: -0.02, median: 0.008, q3: 0.04, upperWhisker: 0.13 },
  ]}
  caption="State the observation frequency and whisker convention."
/>`,
    fields: [
      { id: "id", label: "Figure ID", type: "text", required: true, defaultValue: "fig-return-distribution" },
      { id: "title", label: "Figure title", type: "text", required: true, defaultValue: DEFAULT_BOX_PLOT_TITLE },
      { id: "yLabel", label: "Y-axis label", type: "text", defaultValue: "Monthly net return" },
      {
        id: "yFormat",
        label: "Y-axis format",
        type: "select",
        defaultValue: "percent",
        options: [{ label: "Percent", value: "percent" }, { label: "Number", value: "number" }],
      },
      {
        id: "items",
        label: "Five-number summaries",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_BOX_PLOT_ITEMS,
        help: "One item per line: `label | lower whisker | Q1 | median | Q3 | upper whisker | optional colour`.",
        rows: 5,
      },
    ],
    buildInsert: buildBoxPlotInsert,
    notes: ["State the whisker convention; the component renders the supplied five-number summary and does not infer outliers."],
  },
  {
    id: "regression-table",
    category: "Research & Analysis",
    label: "RegressionTable",
    hint: "Formal regression results with estimates, standard errors, panels, and table notes",
    searchTerms: ["regression", "econometrics", "factor", "coefficient", "standard error", "results table"],
    snippet: `<RegressionTable
  id="table-factor-estimates"
  label="Table 1"
  title="Factor-regression disclosure"
  models={[
    { key: "market", label: "Market model", detail: "Excess return" },
    { key: "three-factor", label: "Three-factor model", detail: "Excess return" },
  ]}
  panels={[
    {
      title: "Panel A. Estimated exposures",
      rows: [
        {
          label: "Market excess return",
          values: {
            market: { value: 1.02, standardError: 0.06 },
            "three-factor": { value: 0.96, standardError: 0.07 },
          },
        },
        {
          label: "Observations",
          kind: "statistic",
          values: { market: 240, "three-factor": 240 },
        },
      ],
    },
  ]}
  caption="State the estimand, sample period, and dependent variable."
  source="Identify the dataset or calculation."
  notes="Parentheses contain supplied standard errors."
/>`,
    fields: [
      {
        id: "id",
        label: "Table ID",
        type: "text",
        required: true,
        defaultValue: "table-factor-estimates",
        help: "Use a unique ID if the text will cross-reference this result.",
      },
      {
        id: "label",
        label: "Visible label",
        type: "text",
        defaultValue: "Table 1",
      },
      {
        id: "title",
        label: "Table title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_REGRESSION_TABLE_TITLE,
      },
      {
        id: "models",
        label: "Models",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_REGRESSION_MODELS,
        help: "One model per line: `key | label | optional detail`.",
        rows: 4,
      },
      {
        id: "rows",
        label: "Panels and rows",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_REGRESSION_ROWS,
        help: "Start a panel with `# Panel title`. Each row is `Variable | value | SE | value | SE ...` in model order. Rows with no SE become statistics.",
        rows: 10,
      },
    ],
    buildInsert: buildRegressionTableInsert,
    notes: [
      "This component prints estimates exactly as supplied. It never computes p-values or significance markers.",
      "For confidence intervals or custom annotations, edit the generated MDX and add `interval` or `annotation` to the relevant estimate.",
    ],
  },
  {
    id: "source-excerpt",
    category: "Research & Analysis",
    label: "SourceExcerpt",
    hint: "Facsimile, transcription, reading text, and archival locator in one evidence block",
    searchTerms: ["history", "archive", "primary source", "transcription", "translation", "facsimile"],
    snippet: `<SourceExcerpt
  id="source-committee-minute"
  title="Minute from a committee meeting"
  layout="compact"
  source="Committee minute, synthetic fixture"
  repository="Example repository"
  locator="Collection A, item 12, fol. 3r"
  date="1851-03-14"
  facsimile={{ src: "/images/posts/source-facsimile.jpg", alt: "Describe the source image" }}
  transcription={"the [illeg.] commttee\\nmet at 3 o'Clocke"}
  reading={"The [illegible] committee\\nmet at 3 o'clock."}
  note="State transcription, normalisation, translation, and derivative choices that change the evidence."
/>`,
    fields: [
      {
        id: "id",
        label: "Source ID",
        type: "text",
        required: true,
        defaultValue: "source-committee-minute",
      },
      {
        id: "title",
        label: "Excerpt title",
        type: "text",
        defaultValue: DEFAULT_SOURCE_EXCERPT_TITLE,
      },
      {
        id: "layout",
        label: "Reading layout",
        type: "select",
        defaultValue: "compact",
        options: [
          { label: "Compact — short excerpt", value: "compact" },
          { label: "Reading — longer text", value: "reading" },
        ],
        help: "Use Reading when a long transcription or translation needs more line length.",
      },
      {
        id: "source",
        label: "Source identity",
        type: "text",
        required: true,
        defaultValue: "Committee minute, synthetic fixture",
      },
      {
        id: "repository",
        label: "Repository",
        type: "text",
        defaultValue: "Example repository",
      },
      {
        id: "locator",
        label: "Locator",
        type: "text",
        defaultValue: "Collection A, item 12, fol. 3r",
      },
      {
        id: "date",
        label: "Date",
        type: "text",
        defaultValue: "1851-03-14",
      },
      {
        id: "src",
        label: "Facsimile path",
        type: "text",
        defaultValue: "/images/posts/source-facsimile.jpg",
      },
      {
        id: "alt",
        label: "Facsimile alt text",
        type: "text",
        required: true,
        defaultValue: "Describe the source image",
      },
      {
        id: "transcription",
        label: "Diplomatic transcription",
        type: "textarea",
        required: true,
        defaultValue: "the [illeg.] commttee\nmet at 3 o'Clocke",
        rows: 4,
      },
      {
        id: "reading",
        label: "Reading text",
        type: "textarea",
        required: true,
        defaultValue: "The [illegible] committee\nmet at 3 o'clock.",
        rows: 4,
      },
    ],
    buildInsert: buildSourceExcerptInsert,
    notes: [
      "Do not use this as a decorative quotation. It is for evidence that readers need to verify against a source witness.",
      "Add `translation` or `collection` directly in MDX when the article needs them.",
    ],
  },
  {
    id: "ablation-table",
    category: "Research & Analysis",
    label: "AblationTable",
    hint: "Experiment comparison table with automatic best-value highlighting",
    searchTerms: ["ablation", "results", "metrics", "benchmark", "table"],
    snippet: `<AblationTable
  title="Ablation on mask ratio and recurrent depth"
  caption="Use the caption to explain the dataset split, protocol, or metric direction."
  variantLabel="Setting"
  metrics={[
    { key: "psnr", label: "PSNR", direction: "higher" },
    { key: "ssim", label: "SSIM", direction: "higher" },
  ]}
  rows={[
    { label: "No recurrence", values: { psnr: 31.4, ssim: 0.912 } },
    { label: "With recurrence", values: { psnr: 33.0, ssim: 0.927 } },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Table title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_ABLATION_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Use the caption to explain the dataset split, protocol, or metric direction.",
        rows: 3,
      },
      {
        id: "variantLabel",
        label: "Variant column label",
        type: "text",
        defaultValue: "Setting",
      },
      {
        id: "metricOneLabel",
        label: "Metric 1 label",
        type: "text",
        required: true,
        defaultValue: "PSNR",
      },
      {
        id: "metricOneKey",
        label: "Metric 1 key",
        type: "text",
        required: true,
        defaultValue: "psnr",
      },
      {
        id: "metricOneDirection",
        label: "Metric 1 direction",
        type: "select",
        defaultValue: "higher",
        options: [
          { label: "Higher is better", value: "higher" },
          { label: "Lower is better", value: "lower" },
        ],
      },
      {
        id: "metricTwoLabel",
        label: "Metric 2 label",
        type: "text",
        required: true,
        defaultValue: "SSIM",
      },
      {
        id: "metricTwoKey",
        label: "Metric 2 key",
        type: "text",
        required: true,
        defaultValue: "ssim",
      },
      {
        id: "metricTwoDirection",
        label: "Metric 2 direction",
        type: "select",
        defaultValue: "higher",
        options: [
          { label: "Higher is better", value: "higher" },
          { label: "Lower is better", value: "lower" },
        ],
      },
      {
        id: "rowOneLabel",
        label: "Row 1 label",
        type: "text",
        required: true,
        defaultValue: "No recurrence",
      },
      {
        id: "rowOneMetricOne",
        label: "Row 1 metric 1 value",
        type: "text",
        required: true,
        defaultValue: "31.4",
      },
      {
        id: "rowOneMetricTwo",
        label: "Row 1 metric 2 value",
        type: "text",
        required: true,
        defaultValue: "0.912",
      },
      {
        id: "rowTwoLabel",
        label: "Row 2 label",
        type: "text",
        required: true,
        defaultValue: "With recurrence",
      },
      {
        id: "rowTwoMetricOne",
        label: "Row 2 metric 1 value",
        type: "text",
        required: true,
        defaultValue: "33.0",
      },
      {
        id: "rowTwoMetricTwo",
        label: "Row 2 metric 2 value",
        type: "text",
        required: true,
        defaultValue: "0.927",
      },
    ],
    buildInsert: buildAblationTableInsert,
    notes: [
      "This component automatically highlights the best value per metric column.",
    ],
  },
  {
    id: "definition",
    category: "Research & Analysis",
    label: "Definition",
    hint: "Formal, referenceable definition with a stable article anchor",
    searchTerms: ["definition", "notation", "term", "concept", "anchor"],
    snippet: `<Definition
  id="def-signal-model"
  title="Signal model"
  label="1"
>
  A signal model specifies how the observed measurements relate to the latent quantity being estimated.
</Definition>`,
    fields: [
      {
        id: "id",
        label: "Stable ID",
        type: "text",
        required: true,
        defaultValue: DEFAULT_DEFINITION_ID,
        help: "Use a unique, article-local ID. CrossReference links to this value without #.",
      },
      {
        id: "title",
        label: "Definition title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_DEFINITION_TITLE,
      },
      {
        id: "label",
        label: "Visible index",
        type: "text",
        defaultValue: "1",
        help: "Optional. Use a stable editorial label such as 1 or 2.1; it is not auto-numbered.",
      },
      {
        id: "body",
        label: "Definition",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_DEFINITION_BODY,
        rows: 4,
      },
      {
        id: "footer",
        label: "Scope note",
        type: "textarea",
        defaultValue: "",
        rows: 3,
      },
    ],
    buildInsert: buildDefinitionInsert,
    notes: [
      "Use Definition for a term or construct that readers will encounter again in the same article.",
      "Keep the ID stable after publishing; use CrossReference to link to it instead of a hand-written hash link.",
    ],
  },
  {
    id: "cross-reference",
    category: "Research & Analysis",
    label: "CrossReference",
    hint: "Verified link to a definition, theorem, equation, figure, table, or heading",
    searchTerms: [
      "reference",
      "xref",
      "cross reference",
      "figure",
      "equation",
      "definition",
    ],
    snippet: `<CrossReference target="def-signal-model" label="Definition 1" />`,
    fields: [
      {
        id: "target",
        label: "Target ID",
        type: "text",
        required: true,
        defaultValue: DEFAULT_DEFINITION_ID,
        help: "The anchor ID without #. pnpm check rejects missing targets.",
      },
      {
        id: "label",
        label: "Link label",
        type: "text",
        required: true,
        defaultValue: DEFAULT_CROSS_REFERENCE_LABEL,
        help: "Write the text readers should see, for example Figure 2 or Definition 1.",
      },
    ],
    buildInsert: buildCrossReferenceInsert,
    notes: [
      "CrossReference targets must exist in the same article. Use normal Markdown links for other articles or external sources.",
      "Referenceable targets include Definition, TheoremBlock, Algorithm, MathBlock, EquationGroup equations, Figure, Table, Chart, and headings with an explicit [#id].",
    ],
  },
  {
    id: "theorem-block",
    category: "Research & Analysis",
    label: "TheoremBlock",
    hint: "Formal statement block for theorems, lemmas, and assumptions",
    searchTerms: ["theorem", "lemma", "proposition", "assumption", "formal"],
    snippet: `<TheoremBlock
  id="theorem-data-consistency"
  kind="theorem"
  label="1"
  title="Data consistency step"
  footer="Sketch why this statement matters before moving on."
>
  State the definition, theorem, or assumption in the most compact form you can defend.
</TheoremBlock>`,
    fields: [
      {
        id: "id",
        label: "Stable ID",
        type: "text",
        defaultValue: DEFAULT_THEOREM_ID,
        help: "Use a unique, article-local ID when this statement is referenced later.",
      },
      {
        id: "kind",
        label: "Kind",
        type: "select",
        required: true,
        defaultValue: "theorem",
        options: [
          { label: "Theorem", value: "theorem" },
          { label: "Lemma", value: "lemma" },
          { label: "Proposition", value: "proposition" },
          { label: "Corollary", value: "corollary" },
          { label: "Assumption", value: "assumption" },
          { label: "Note", value: "note" },
        ],
      },
      {
        id: "label",
        label: "Index / label",
        type: "text",
        defaultValue: "1",
      },
      {
        id: "title",
        label: "Block title",
        type: "text",
        defaultValue: DEFAULT_THEOREM_TITLE,
      },
      {
        id: "body",
        label: "Statement body",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_THEOREM_BODY,
        rows: 4,
      },
      {
        id: "footer",
        label: "Footer note",
        type: "textarea",
        defaultValue: "Sketch why this statement matters before moving on.",
        rows: 3,
      },
    ],
    buildInsert: buildTheoremBlockInsert,
    notes: [
      "Use Definition for a concept that needs an explicit, referenceable term; reserve TheoremBlock for theorem-like claims and assumptions.",
    ],
  },
  {
    id: "proof-block",
    category: "Research & Analysis",
    label: "ProofBlock",
    hint: "Proof sketch with an optional strategy and conclusion",
    searchTerms: ["proof", "argument", "sketch", "reasoning"],
    snippet: `<ProofBlock
  title="Convergence sketch"
  strategy="Induction"
  conclusion="Close with the one-line consequence the reader should carry into the next section."
>
  Outline the core argument and skip the algebra that does not change the main idea.
</ProofBlock>`,
    fields: [
      {
        id: "title",
        label: "Proof title",
        type: "text",
        defaultValue: DEFAULT_PROOF_TITLE,
      },
      {
        id: "strategy",
        label: "Proof strategy",
        type: "text",
        defaultValue: "Induction",
      },
      {
        id: "body",
        label: "Proof body",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_PROOF_BODY,
        rows: 4,
      },
      {
        id: "conclusion",
        label: "Conclusion",
        type: "textarea",
        defaultValue:
          "Close with the one-line consequence the reader should carry into the next section.",
        rows: 3,
      },
    ],
    buildInsert: buildProofBlockInsert,
  },
  {
    id: "derivation-block",
    category: "Research & Analysis",
    label: "DerivationBlock",
    hint: "Stepwise derivation with equations and commentary",
    searchTerms: ["derivation", "gradient", "proof", "algebra", "steps"],
    snippet: `<DerivationBlock
  title="Gradient update derivation"
  caption="Split a long derivation into a few steps the reader can verify locally."
  steps={[
    {
      label: "Step 1",
      title: "Start from the objective",
      equation: "\\mathcal{L}(x) = \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)",
      note: "State the objective before taking derivatives so the reader has the full context.",
    },
    {
      label: "Step 2",
      title: "Differentiate",
      equation: "\\nabla_x \\mathcal{L}(x) = 2A^\\top(Ax - y) + \\lambda \\nabla R(x)",
      note: "Keep only the derivative that changes the update rule.",
    },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Derivation title",
        type: "text",
        defaultValue: DEFAULT_DERIVATION_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Split a long derivation into a few steps the reader can verify locally.",
        rows: 3,
      },
      {
        id: "stepOneLabel",
        label: "Step 1 label",
        type: "text",
        defaultValue: "Step 1",
      },
      {
        id: "stepOneTitle",
        label: "Step 1 title",
        type: "text",
        defaultValue: "Start from the objective",
      },
      {
        id: "stepOneEquation",
        label: "Step 1 equation",
        type: "textarea",
        defaultValue:
          "\\mathcal{L}(x) = \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)",
        rows: 3,
      },
      {
        id: "stepOneNote",
        label: "Step 1 note",
        type: "textarea",
        defaultValue:
          "State the objective before taking derivatives so the reader has the full context.",
        rows: 3,
      },
      {
        id: "stepTwoLabel",
        label: "Step 2 label",
        type: "text",
        defaultValue: "Step 2",
      },
      {
        id: "stepTwoTitle",
        label: "Step 2 title",
        type: "text",
        defaultValue: "Differentiate",
      },
      {
        id: "stepTwoEquation",
        label: "Step 2 equation",
        type: "textarea",
        defaultValue:
          "\\nabla_x \\mathcal{L}(x) = 2A^\\top(Ax - y) + \\lambda \\nabla R(x)",
        rows: 3,
      },
      {
        id: "stepTwoNote",
        label: "Step 2 note",
        type: "textarea",
        defaultValue: "Keep only the derivative that changes the update rule.",
        rows: 3,
      },
    ],
    buildInsert: buildDerivationBlockInsert,
  },
  {
    id: "equation-group",
    category: "Research & Analysis",
    label: "EquationGroup",
    hint: "Multiple equations with automatic numbering and refs",
    searchTerms: ["equation group", "reference", "numbering", "eqref", "math"],
    snippet: `Mention the update again with <AutoEquationRef target="eq-update" />.

<EquationGroup
  title="Core equations"
  caption="AutoEquationRef will pick up the rendered labels from the group below."
  equations={[
    {
      id: "eq-objective",
      title: "Objective",
      tex: "\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)",
      note: "Reconstruction objective.",
    },
    {
      id: "eq-update",
      title: "Update",
      tex: "x_{t+1} = x_t - \\eta \\nabla_x \\mathcal{L}(x_t)",
      note: "Gradient descent update.",
    },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Group title",
        type: "text",
        defaultValue: DEFAULT_EQUATION_GROUP_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "AutoEquationRef will pick up the rendered labels from the group below.",
        rows: 3,
      },
      {
        id: "eqOneId",
        label: "Equation 1 ID",
        type: "text",
        required: true,
        defaultValue: "eq-objective",
      },
      {
        id: "eqOneTitle",
        label: "Equation 1 title",
        type: "text",
        defaultValue: "Objective",
      },
      {
        id: "eqOneTex",
        label: "Equation 1 TeX",
        type: "textarea",
        required: true,
        defaultValue:
          "\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)",
        rows: 3,
      },
      {
        id: "eqOneNote",
        label: "Equation 1 note",
        type: "textarea",
        defaultValue: "Reconstruction objective.",
        rows: 2,
      },
      {
        id: "eqTwoId",
        label: "Equation 2 ID",
        type: "text",
        required: true,
        defaultValue: "eq-update",
      },
      {
        id: "eqTwoTitle",
        label: "Equation 2 title",
        type: "text",
        defaultValue: "Update",
      },
      {
        id: "eqTwoTex",
        label: "Equation 2 TeX",
        type: "textarea",
        required: true,
        defaultValue: "x_{t+1} = x_t - \\eta \\nabla_x \\mathcal{L}(x_t)",
        rows: 3,
      },
      {
        id: "eqTwoNote",
        label: "Equation 2 note",
        type: "textarea",
        defaultValue: "Gradient descent update.",
        rows: 2,
      },
    ],
    buildInsert: buildEquationGroupInsert,
    notes: [
      "Use `AutoEquationRef` when you want the link text to stay in sync with the rendered numbering.",
    ],
  },
  {
    id: "mermaid-diagram",
    category: "Research & Analysis",
    label: "MermaidDiagram",
    hint: "Generic Mermaid flowchart or state diagram",
    searchTerms: [
      "mermaid",
      "diagram",
      "flowchart",
      "state machine",
      "sequence",
    ],
    snippet: `<MermaidDiagram
  title="System flow"
  caption="Use Mermaid when the relationship between steps matters more than polished illustration."
  theme="neutral"
  chart={\`flowchart LR
  raw["Raw k-space"] --> mask["Sampling mask"]
  mask --> recon["Reconstruction model"]
  recon --> metrics["Metrics and review"]\`}
/>`,
    fields: [
      {
        id: "title",
        label: "Diagram title",
        type: "text",
        defaultValue: "System flow",
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Use Mermaid when the relationship between steps matters more than polished illustration.",
        rows: 3,
      },
      {
        id: "theme",
        label: "Theme",
        type: "select",
        defaultValue: "neutral",
        options: [
          { label: "Neutral", value: "neutral" },
          { label: "Default", value: "default" },
          { label: "Forest", value: "forest" },
          { label: "Dark", value: "dark" },
        ],
      },
      {
        id: "chart",
        label: "Mermaid source",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_MERMAID_CHART,
        rows: 7,
      },
    ],
    buildInsert: buildMermaidDiagramInsert,
  },
  {
    id: "architecture-diagram",
    category: "Research & Analysis",
    label: "ArchitectureDiagram",
    hint: "Structured system diagram with nodes, groups, and labeled edges",
    searchTerms: ["architecture", "system", "pipeline", "graph", "mermaid"],
    snippet: `<ArchitectureDiagram
  title="MRI training pipeline"
  caption="Summarize the stages, then let the nodes and edges make the system boundary obvious."
  direction="LR"
  nodes={[
    { id: "scanner", label: "Scanner data", group: "Acquisition", shape: "rounded", tone: "accent" },
    { id: "loader", label: "Dataset loader", group: "Acquisition", shape: "rect", tone: "default" },
    { id: "model", label: "VarNet", group: "Model", shape: "subroutine", tone: "success" },
    { id: "metrics", label: "Metrics", group: "Evaluation", shape: "diamond", tone: "muted" },
  ]}
  edges={[
    { from: "scanner", to: "loader", label: "shards" },
    { from: "loader", to: "model", label: "mini-batches", style: "thick" },
    { from: "model", to: "metrics", label: "reconstructions" },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Diagram title",
        type: "text",
        defaultValue: "MRI training pipeline",
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Summarize the stages, then let the nodes and edges make the system boundary obvious.",
        rows: 3,
      },
      {
        id: "direction",
        label: "Flow direction",
        type: "select",
        defaultValue: "LR",
        options: [
          { label: "Left to right", value: "LR" },
          { label: "Top to bottom", value: "TB" },
          { label: "Right to left", value: "RL" },
          { label: "Bottom to top", value: "BT" },
        ],
      },
    ],
    buildInsert: buildArchitectureDiagramInsert,
  },
  {
    id: "task-spec-card",
    category: "Research & Analysis",
    label: "TaskSpecCard",
    hint: "Embodied task definition with observations, actions, and rewards",
    searchTerms: ["task", "embodied", "robotics", "environment", "policy"],
    snippet: `<TaskSpecCard
  title="Pick-and-place task"
  domain="Embodied control"
  environment="Simulated tabletop"
  goal="Move the target object from the source bin to the destination zone without collisions."
  observations={["RGB wrist camera", "Robot state", "Gripper width"]}
  actions={["Cartesian delta pose", "Open gripper", "Close gripper"]}
  rewards={["Dense shaping on distance", "Success bonus", "Collision penalty"]}
  successCriteria={["Object in goal zone", "No collision", "Episode under 10 seconds"]}
  notes="Use this section to state reset randomness or safety constraints."
/>`,
    fields: [
      {
        id: "title",
        label: "Task title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_TASK_TITLE,
      },
      {
        id: "domain",
        label: "Domain",
        type: "text",
        defaultValue: "Embodied control",
      },
      {
        id: "environment",
        label: "Environment",
        type: "text",
        required: true,
        defaultValue: "Simulated tabletop",
      },
      {
        id: "goal",
        label: "Goal",
        type: "textarea",
        required: true,
        defaultValue:
          "Move the target object from the source bin to the destination zone without collisions.",
        rows: 3,
      },
      {
        id: "observations",
        label: "Observations",
        type: "textarea",
        required: true,
        defaultValue: "RGB wrist camera\nRobot state\nGripper width",
        help: "Use one item per line.",
        rows: 4,
      },
      {
        id: "actions",
        label: "Actions",
        type: "textarea",
        required: true,
        defaultValue: "Cartesian delta pose\nOpen gripper\nClose gripper",
        help: "Use one item per line.",
        rows: 4,
      },
      {
        id: "rewards",
        label: "Rewards",
        type: "textarea",
        defaultValue:
          "Dense shaping on distance\nSuccess bonus\nCollision penalty",
        help: "Use one item per line.",
        rows: 4,
      },
      {
        id: "successCriteria",
        label: "Success criteria",
        type: "textarea",
        defaultValue:
          "Object in goal zone\nNo collision\nEpisode under 10 seconds",
        help: "Use one item per line.",
        rows: 4,
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        defaultValue:
          "Use this section to state reset randomness or safety constraints.",
        rows: 3,
      },
    ],
    buildInsert: buildTaskSpecCardInsert,
  },
  {
    id: "experiment-setup",
    category: "Research & Analysis",
    label: "ExperimentSetup",
    hint: "Dataset, compute, metrics, and hyperparameter summary",
    searchTerms: [
      "experiment",
      "setup",
      "protocol",
      "hyperparameters",
      "dataset",
    ],
    snippet: `<ExperimentSetup
  title="fastMRI validation protocol"
  dataset="fastMRI knee multicoil"
  split="Train 973 volumes / Val 199 volumes"
  compute="4x A100 80GB"
  metrics={["PSNR", "SSIM", "NMSE"]}
  settings={[
    { label: "Optimizer", value: "AdamW" },
    { label: "Batch size", value: "8" },
    { label: "Learning rate", value: "3e-4" },
    { label: "Epochs", value: "120" },
  ]}
  notes="Mention augmentation, seed count, or evaluation caveats here."
/>`,
    fields: [
      {
        id: "title",
        label: "Setup title",
        type: "text",
        defaultValue: DEFAULT_EXPERIMENT_TITLE,
      },
      {
        id: "dataset",
        label: "Dataset",
        type: "text",
        defaultValue: "fastMRI knee multicoil",
      },
      {
        id: "split",
        label: "Split",
        type: "text",
        defaultValue: "Train 973 volumes / Val 199 volumes",
      },
      {
        id: "compute",
        label: "Compute",
        type: "text",
        defaultValue: "4x A100 80GB",
      },
      {
        id: "metrics",
        label: "Metrics",
        type: "textarea",
        defaultValue: "PSNR\nSSIM\nNMSE",
        help: "Use one metric per line.",
        rows: 4,
      },
      {
        id: "settings",
        label: "Settings",
        type: "textarea",
        defaultValue:
          "Optimizer: AdamW\nBatch size: 8\nLearning rate: 3e-4\nEpochs: 120",
        help: "Use `Label: value` on each line.",
        rows: 5,
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        defaultValue:
          "Mention augmentation, seed count, or evaluation caveats here.",
        rows: 3,
      },
    ],
    buildInsert: buildExperimentSetupInsert,
  },
  {
    id: "multi-panel-figure",
    category: "Research & Analysis",
    label: "MultiPanelFigure",
    hint: "Labeled image grid for reconstruction, ablation, or qualitative comparisons",
    searchTerms: ["multi panel", "figure", "comparison", "mri", "qualitative"],
    snippet: `<MultiPanelFigure
  title="Reconstruction comparison"
  caption="Use matching crops and panel labels when the comparison matters more than decorative layout."
  columns={2}
  panels={[
    {
      label: "A",
      title: "Zero-filled",
      src: "/images/posts/recon/zero-filled.png",
      alt: "Zero-filled reconstruction",
      note: "Baseline reconstruction",
    },
    {
      label: "B",
      title: "Reference",
      src: "/images/posts/recon/reference.png",
      alt: "Reference reconstruction",
      note: "Ground-truth target",
    },
    {
      label: "C",
      title: "VarNet",
      src: "/images/posts/recon/varnet.png",
      alt: "VarNet reconstruction",
      note: "Recurrent baseline",
    },
    {
      label: "D",
      title: "Ours",
      src: "/images/posts/recon/ours.png",
      alt: "Our reconstruction",
      note: "Sharper structure in the target region",
    },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Figure title",
        type: "text",
        defaultValue: DEFAULT_MULTI_PANEL_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Use matching crops and panel labels when the comparison matters more than decorative layout.",
        rows: 3,
      },
      {
        id: "columns",
        label: "Columns",
        type: "select",
        defaultValue: "2",
        options: [
          { label: "2 columns", value: "2" },
          { label: "3 columns", value: "3" },
          { label: "4 columns", value: "4" },
        ],
      },
      {
        id: "panels",
        label: "Panels",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_MULTI_PANEL_PANELS,
        help: "Use `Label | Title | Src | Alt | Note` on each line. One line becomes one panel.",
        rows: 6,
      },
    ],
    buildInsert: buildMultiPanelFigureInsert,
    notes: [
      "Keep crops aligned so the comparison tells a trustworthy visual story.",
    ],
  },
  {
    id: "kspace-viewer",
    category: "Research & Analysis",
    label: "KSpaceViewer",
    hint: "MRI panel viewer for k-space, masks, reconstructions, and error maps",
    searchTerms: ["mri", "k-space", "reconstruction", "mask", "error map"],
    snippet: `<KSpaceViewer
  title="k-space inspection"
  caption="Pair k-space, mask, reconstruction, and error panels so readers can connect acquisition choices to visible artifacts."
  columns={2}
  panels={[
    {
      label: "Acquired magnitude",
      src: "/images/posts/mri/kspace-magnitude.png",
      alt: "Log magnitude of the acquired k-space",
      kind: "kspace",
      note: "Use this panel to show aliasing or energy concentration.",
    },
    {
      label: "Sampling mask",
      src: "/images/posts/mri/mask.png",
      alt: "Sampling mask visualization",
      kind: "mask",
      note: "State the acceleration factor or variable-density pattern.",
    },
    {
      label: "Reconstruction",
      src: "/images/posts/mri/reconstruction.png",
      alt: "Reconstructed MRI image",
      kind: "reconstruction",
      note: "Highlight the main anatomical structures that are preserved.",
    },
    {
      label: "Error map",
      src: "/images/posts/mri/error-map.png",
      alt: "Absolute error map",
      kind: "error",
      note: "Use the error panel to reveal subtle residual artifacts.",
    },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Viewer title",
        type: "text",
        defaultValue: DEFAULT_KSPACE_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Pair k-space, mask, reconstruction, and error panels so readers can connect acquisition choices to visible artifacts.",
        rows: 3,
      },
      {
        id: "columns",
        label: "Columns",
        type: "select",
        defaultValue: "2",
        options: [
          { label: "2 columns", value: "2" },
          { label: "4 columns", value: "4" },
        ],
      },
      {
        id: "panels",
        label: "Panels",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_KSPACE_PANELS,
        help: "Use `Label | Src | Alt | Kind | Note` on each line. Kinds: kspace, mask, reconstruction, error, reference.",
        rows: 6,
      },
    ],
    buildInsert: buildKSpaceViewerInsert,
    notes: [
      "Use the same crop and intensity treatment across panels whenever possible.",
    ],
  },
  {
    id: "backtest-chart",
    category: "Research & Analysis",
    label: "BacktestChart",
    hint: "Equity curve with benchmark overlay and drawdown panel",
    searchTerms: ["backtest", "quant", "equity curve", "drawdown", "benchmark"],
    snippet: `<BacktestChart
  title="Strategy vs. benchmark"
  caption="Use the caption for rebalancing cadence, transaction costs, and benchmark definition."
  labels={["Jan", "Feb", "Mar", "Apr", "May"]}
  equity={[1.0, 1.05, 1.08, 1.11, 1.16]}
  benchmark={[1.0, 1.02, 1.03, 1.07, 1.09]}
  strategyLabel="Strategy"
  benchmarkLabel="Benchmark"
/>`,
    fields: [
      {
        id: "title",
        label: "Chart title",
        type: "text",
        required: true,
        defaultValue: DEFAULT_BACKTEST_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Use the caption for rebalancing cadence, transaction costs, and benchmark definition.",
        rows: 3,
      },
      {
        id: "labels",
        label: "Labels",
        type: "text",
        required: true,
        defaultValue: "Jan, Feb, Mar, Apr, May",
        help: "Separate labels with commas.",
      },
      {
        id: "equity",
        label: "Strategy equity values",
        type: "text",
        required: true,
        defaultValue: "1.0, 1.05, 1.08, 1.11, 1.16",
        help: "Separate numeric values with commas.",
      },
      {
        id: "benchmark",
        label: "Benchmark values",
        type: "text",
        defaultValue: "1.0, 1.02, 1.03, 1.07, 1.09",
        help: "Separate numeric values with commas.",
      },
      {
        id: "strategyLabel",
        label: "Strategy label",
        type: "text",
        defaultValue: "Strategy",
      },
      {
        id: "benchmarkLabel",
        label: "Benchmark label",
        type: "text",
        defaultValue: "Benchmark",
      },
    ],
    buildInsert: buildBacktestChartInsert,
  },
  {
    id: "metric-table",
    category: "Research & Analysis",
    label: "MetricTable",
    hint: "Benchmark table with best-value highlighting across multiple metrics",
    searchTerms: [
      "metric table",
      "benchmark",
      "leaderboard",
      "results",
      "quant",
    ],
    snippet: `<MetricTable
  title="Validation benchmark"
  caption="Use this for benchmark sections where each row is a model or strategy and each column is a metric that readers compare directly."
  rowLabel="Model"
  metrics={[
    { key: "psnr", label: "PSNR", direction: "higher", format: "number" },
    { key: "ssim", label: "SSIM", direction: "higher", format: "number" },
    { key: "nmse", label: "NMSE", direction: "lower", format: "number" },
  ]}
  rows={[
    {
      label: "VarNet",
      values: { psnr: 33.12, ssim: 0.928, nmse: 0.065 },
      tag: "Baseline",
      note: "Classic recurrent baseline",
    },
    {
      label: "Cascade Transformer",
      values: { psnr: 34.08, ssim: 0.941, nmse: 0.051 },
      tag: "Selected model",
      note: "Best overall validation result",
    },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Table title",
        type: "text",
        defaultValue: DEFAULT_METRIC_TABLE_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Use this for benchmark sections where each row is a model or strategy and each column is a metric that readers compare directly.",
        rows: 3,
      },
      {
        id: "rowLabel",
        label: "Row label",
        type: "text",
        defaultValue: "Model",
      },
      {
        id: "metrics",
        label: "Metrics",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_METRIC_TABLE_METRICS,
        help: "Use `key | Label | direction | format` on each line. Directions: higher or lower. Formats: number, percent, integer, bps, currency.",
        rows: 5,
      },
      {
        id: "rows",
        label: "Rows",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_METRIC_TABLE_ROWS,
        help: "Use `Label | metric1 | metric2 | ... | Tag | Note` on each line. Metric values follow the metric order above.",
        rows: 6,
      },
    ],
    buildInsert: buildMetricTableInsert,
  },
  {
    id: "leaderboard-table",
    category: "Research & Analysis",
    label: "LeaderboardTable",
    hint: "Ranked result table when rank order is itself the reported result",
    searchTerms: ["leaderboard", "ranking", "strategy", "score", "quant"],
    snippet: `<LeaderboardTable
  title="Strategy leaderboard"
  caption="Use this when ranking matters more than showing every metric, such as strategy selection or benchmark leaderboards."
  scoreLabel="Sharpe"
  deltaLabel="Delta vs baseline"
  scoreFormat="number"
  higherIsBetter
  entries={[
    {
      label: "Cross-sectional momentum",
      score: 1.48,
      delta: 0.12,
      tag: "Live candidate",
      note: "Monthly rebalance, top 300 universe",
    },
    {
      label: "Residual mean reversion",
      score: 1.31,
      delta: 0.07,
      tag: "Stable",
      note: "Lower turnover and shallower drawdown",
    },
  ]}
/>`,
    fields: [
      {
        id: "title",
        label: "Leaderboard title",
        type: "text",
        defaultValue: DEFAULT_LEADERBOARD_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
      "Use this when rank order is the result, and state the selection rule beside the table.",
        rows: 3,
      },
      {
        id: "scoreLabel",
        label: "Score label",
        type: "text",
        defaultValue: "Sharpe",
      },
      {
        id: "deltaLabel",
        label: "Delta label",
        type: "text",
        defaultValue: "Delta vs baseline",
      },
      {
        id: "scoreFormat",
        label: "Score format",
        type: "select",
        defaultValue: "number",
        options: [
          { label: "Number", value: "number" },
          { label: "Percent", value: "percent" },
          { label: "Integer", value: "integer" },
          { label: "Basis points", value: "bps" },
          { label: "Currency", value: "currency" },
        ],
      },
      {
        id: "higherIsBetter",
        label: "Higher is better",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "entries",
        label: "Entries",
        type: "textarea",
        required: true,
        defaultValue: DEFAULT_LEADERBOARD_ENTRIES,
        help: "Use `Label | Score | Delta | Tag | Note` on each line. Scores and deltas can be numeric or text.",
        rows: 6,
      },
    ],
    buildInsert: buildLeaderboardTableInsert,
  },
  {
    id: "heatmap",
    category: "Research & Analysis",
    label: "Heatmap",
    hint: "Matrix-style result overview for ablations or correlations",
    searchTerms: ["heatmap", "matrix", "ablation", "correlation", "grid"],
    snippet: `<Heatmap
  title="Ablation heatmap"
  caption="Use a heatmap when a matrix pattern matters more than the exact decimal precision."
  rows={["Mask 0.05", "Mask 0.10", "Mask 0.15"]}
  columns={["Depth 4", "Depth 6", "Depth 8"]}
  values={[
    [31.1, 31.8, 32.0],
    [32.5, 33.1, 33.4],
    [32.7, 33.0, 33.2],
  ]}
  format="number"
/>`,
    fields: [
      {
        id: "title",
        label: "Heatmap title",
        type: "text",
        defaultValue: DEFAULT_HEATMAP_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Use a heatmap when a matrix pattern matters more than the exact decimal precision.",
        rows: 3,
      },
      {
        id: "rows",
        label: "Row labels",
        type: "textarea",
        required: true,
        defaultValue: "Mask 0.05\nMask 0.10\nMask 0.15",
        help: "Use one row label per line.",
        rows: 4,
      },
      {
        id: "columns",
        label: "Column labels",
        type: "textarea",
        required: true,
        defaultValue: "Depth 4\nDepth 6\nDepth 8",
        help: "Use one column label per line.",
        rows: 4,
      },
      {
        id: "values",
        label: "Matrix values",
        type: "textarea",
        required: true,
        defaultValue: "31.1, 31.8, 32.0\n32.5, 33.1, 33.4\n32.7, 33.0, 33.2",
        help: "Use one matrix row per line and separate values with commas.",
        rows: 5,
      },
      {
        id: "format",
        label: "Value format",
        type: "select",
        defaultValue: "number",
        options: [
          { label: "Number", value: "number" },
          { label: "Percent", value: "percent" },
        ],
      },
    ],
    buildInsert: buildHeatmapInsert,
  },
  {
    id: "confusion-matrix",
    category: "Research & Analysis",
    label: "ConfusionMatrix",
    hint: "Classification or policy error matrix with optional row normalization",
    searchTerms: [
      "confusion matrix",
      "classification",
      "errors",
      "policy",
      "matrix",
    ],
    snippet: `<ConfusionMatrix
  title="Policy error breakdown"
  caption="Normalize rows when you want each actual class to sum to 100%."
  labels={["Reach", "Grasp", "Place"]}
  values={[
    [82, 12, 6],
    [9, 75, 16],
    [5, 11, 84],
  ]}
  normalize
/>`,
    fields: [
      {
        id: "title",
        label: "Matrix title",
        type: "text",
        defaultValue: DEFAULT_CONFUSION_TITLE,
      },
      {
        id: "caption",
        label: "Caption",
        type: "textarea",
        defaultValue:
          "Normalize rows when you want each actual class to sum to 100%.",
        rows: 3,
      },
      {
        id: "labels",
        label: "Class labels",
        type: "textarea",
        required: true,
        defaultValue: "Reach\nGrasp\nPlace",
        help: "Use one label per line.",
        rows: 4,
      },
      {
        id: "values",
        label: "Matrix values",
        type: "textarea",
        required: true,
        defaultValue: "82, 12, 6\n9, 75, 16\n5, 11, 84",
        help: "Use one matrix row per line and separate values with commas.",
        rows: 5,
      },
      {
        id: "normalize",
        label: "Normalize rows",
        type: "boolean",
        defaultValue: true,
      },
    ],
    buildInsert: buildConfusionMatrixInsert,
  },
  {
    id: "youtube",
    category: "Media",
    label: "YouTube",
    hint: "Embed a YouTube video by ID",
    searchTerms: ["youtube", "video", "embed"],
    snippet: `<YouTube videoId="${DEFAULT_YOUTUBE_ID}" />`,
    fields: [
      {
        id: "videoId",
        label: "YouTube video ID",
        type: "text",
        required: true,
        defaultValue: DEFAULT_YOUTUBE_ID,
        example: "dQw4w9WgXcQ",
      },
    ],
    buildInsert: buildYouTubeInsert,
  },
  {
    id: "video-player",
    category: "Media",
    label: "VideoPlayer",
    hint: "Self-hosted or remote video with chapter pills",
    searchTerms: ["video", "media", "chapter", "player"],
    snippet: `<VideoPlayer
  src="${DEFAULT_VIDEO_SRC}"
  title="${DEFAULT_VIDEO_TITLE}"
  chapters={[
    { label: "Intro", time: 0 },
    { label: "Demo", time: 4 },
  ]}
/>`,
    fields: [
      {
        id: "src",
        label: "Video source URL",
        type: "text",
        required: true,
        defaultValue: DEFAULT_VIDEO_SRC,
        example: "https://cdn.example.com/videos/release-walkthrough.mp4",
      },
      {
        id: "title",
        label: "Title",
        type: "text",
        defaultValue: DEFAULT_VIDEO_TITLE,
      },
      {
        id: "poster",
        label: "Poster image URL",
        type: "text",
        defaultValue: "",
      },
      {
        id: "chapterLabel",
        label: "First chapter label",
        type: "text",
        defaultValue: "Intro",
      },
      {
        id: "chapterTime",
        label: "First chapter time (seconds)",
        type: "text",
        defaultValue: "0",
      },
      {
        id: "body",
        label: "Optional supporting copy",
        type: "textarea",
        defaultValue: "",
        rows: 3,
      },
    ],
    buildInsert: buildVideoInsert,
  },
  {
    id: "audio-player",
    category: "Media",
    label: "AudioPlayer",
    hint: "Podcast or voice note player",
    searchTerms: ["audio", "podcast", "voice", "player"],
    snippet: `<AudioPlayer
  src="${DEFAULT_AUDIO_SRC}"
  title="${DEFAULT_AUDIO_TITLE}"
  subtitle="${DEFAULT_AUDIO_SUBTITLE}"
/>`,
    fields: [
      {
        id: "src",
        label: "Audio source URL",
        type: "text",
        required: true,
        defaultValue: DEFAULT_AUDIO_SRC,
        example: "https://cdn.example.com/audio/founder-interview.mp3",
      },
      {
        id: "title",
        label: "Title",
        type: "text",
        defaultValue: DEFAULT_AUDIO_TITLE,
      },
      {
        id: "subtitle",
        label: "Subtitle",
        type: "text",
        defaultValue: DEFAULT_AUDIO_SUBTITLE,
      },
      {
        id: "cover",
        label: "Cover image URL",
        type: "text",
        defaultValue: "",
      },
      {
        id: "body",
        label: "Optional supporting copy",
        type: "textarea",
        defaultValue: "",
        rows: 3,
      },
    ],
    buildInsert: buildAudioInsert,
  },
];

const coreComponentIds = new Set<ComponentSnippet["id"]>([
  "markdown-basics",
  "callout",
  "snippet",
  "table",
  "steps",
  "tabs",
  "figure-image",
  "inline-math",
  "math-block",
  "mermaid-diagram",
  "citation-bibliography",
  "youtube",
  "video-player",
]);

export function isCoreComponent(entry: ComponentSnippet) {
  return coreComponentIds.has(entry.id);
}
