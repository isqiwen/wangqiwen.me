import Link from "next/link";
import type { ReactNode } from "react";
import { AudioPlayer } from "@/app/(post)/components/audio-player";
import { AblationTable } from "@/app/(post)/components/ablation-table";
import { Accordion, AccordionItem } from "@/app/(post)/components/accordion";
import { Algorithm } from "@/app/(post)/components/algorithm";
import { ArchitectureDiagram } from "@/app/(post)/components/architecture-diagram";
import { AutoEquationRef } from "@/app/(post)/components/auto-equation-ref";
import { BacktestChart } from "@/app/(post)/components/backtest-chart";
import { Callout } from "@/app/(post)/components/callout";
import {
  Bibliography,
  BibliographyItem,
  Citation,
} from "@/app/(post)/components/citation";
import { Chart } from "@/app/(post)/components/chart";
import { Compare } from "@/app/(post)/components/compare";
import { Diff } from "@/app/(post)/components/diff";
import { DerivationBlock } from "@/app/(post)/components/derivation-block";
import { CrossReference } from "@/app/(post)/components/cross-reference";
import { Definition } from "@/app/(post)/components/definition";
import { EquationGroup } from "@/app/(post)/components/equation-group";
import { EquationNumbering } from "@/app/(post)/components/equation-numbering";
import { ExperimentSetup } from "@/app/(post)/components/experiment-setup";
import { FileTree } from "@/app/(post)/components/file-tree";
import { Figure } from "@/app/(post)/components/figure";
import { Gallery } from "@/app/(post)/components/gallery";
import { KeyValueItem, KeyValueList } from "@/app/(post)/components/key-value";
import { InlineMath, MathBlock } from "@/app/(post)/components/math";
import { MermaidDiagram } from "@/app/(post)/components/mermaid-diagram";
import { PaperCard } from "@/app/(post)/components/paper-card";
import { ProofBlock } from "@/app/(post)/components/proof-block";
import { PullQuote } from "@/app/(post)/components/pull-quote";
import { RawImage } from "@/app/(post)/components/raw-image";
import { Snippet } from "@/app/(post)/components/snippet";
import { Stat, Stats } from "@/app/(post)/components/stats";
import { Step, Steps } from "@/app/(post)/components/steps";
import { TaskSpecCard } from "@/app/(post)/components/task-spec-card";
import { Table, TBody, TD, TH, THead, TR } from "@/app/(post)/components/table";
import { Tab, Tabs } from "@/app/(post)/components/tabs";
import { TerminalBlock } from "@/app/(post)/components/terminal-block";
import { TheoremBlock } from "@/app/(post)/components/theorem-block";
import { Timeline, TimelineItem } from "@/app/(post)/components/timeline";
import { VideoPlayer } from "@/app/(post)/components/video-player";
import { YouTube } from "@/app/(post)/components/youtube";
import { Heatmap } from "@/app/(post)/components/heatmap";
import { ConfusionMatrix } from "@/app/(post)/components/confusion-matrix";
import { MultiPanelFigure } from "@/app/(post)/components/multi-panel-figure";
import { KSpaceViewer } from "@/app/(post)/components/kspace-viewer";
import { MetricTable } from "@/app/(post)/components/metric-table";
import { LeaderboardTable } from "@/app/(post)/components/leaderboard-table";
import { RegressionTable } from "@/app/(post)/components/regression-table";
import { SourceExcerpt } from "@/app/(post)/components/source-excerpt";
import { ScatterPlot } from "@/app/(post)/components/scatter-plot";
import { Histogram } from "@/app/(post)/components/histogram";
import { BoxPlot } from "@/app/(post)/components/box-plot";
import {
  GuideNavigation,
  type GuideNavigationSection,
} from "./guide-navigation";
import {
  componentsPalette,
  type ComponentSnippet,
  type ComponentSnippetField,
} from "../snippets";

export const metadata = {
  title: "MDX Component Guide",
};

const groupedComponents = groupByCategory(componentsPalette);
const categoryEntries = Object.entries(groupedComponents);
const navigationSections: GuideNavigationSection[] = categoryEntries.map(
  ([category, entries]) => ({
    id: `category-${slugifyCategory(category)}`,
    title: category,
    count: entries.length,
    items: entries.map(entry => ({
      id: `component-${entry.id}`,
      label: entry.label,
    })),
  })
);
const componentUsageById: Partial<Record<ComponentSnippet["id"], string>> = {
  "markdown-basics":
    "Use this when plain Markdown is enough and you want a clean article backbone before reaching for custom blocks.",
  "link-blockquote":
    "Use this for short references, sourced quotes, or simple editorial asides that should stay lightweight.",
  callout:
    "Use this to interrupt the article flow with a note, warning, or success state that readers should not miss.",
  snippet:
    "Use this when one focused code sample or terminal command deserves stronger emphasis than an ordinary fenced block.",
  tabs: "Use this when readers need to compare variants such as TypeScript versus JavaScript, CLI versus UI, or setup versus output.",
  table:
    "Use this for compact structured comparisons where rows and columns make the tradeoffs easier to scan.",
  steps:
    "Use this when the article explains a sequence and readers should move through the workflow in order.",
  algorithm:
    "Use this for methods readers need to reproduce, especially when control flow matters more than implementation syntax.",
  "file-tree":
    "Use this sparingly for a small, reproducible set of files. Explain why the structure matters in the surrounding prose.",
  "terminal-block":
    "Use this for reproducible command sessions, training logs, or deployment output where the exact sequence matters.",
  accordion:
    "Use this when details are useful but should stay collapsed until the reader actively asks for them.",
  timeline:
    "Use this for release notes, project history, event recaps, or any story that is easiest to understand chronologically.",
  "figure-image":
    "Use this for a single important image that deserves breathing room, caption support, or a more editorial presentation.",
  gallery:
    "Use this when a post needs several images with equal weight and the reader benefits from browsing them together.",
  "pull-quote":
    "Use this to spotlight one memorable sentence or thesis line without turning it into a full testimonial card.",
  stats:
    "Use this sparingly for a few reported quantities; use a table or chart when comparison, uncertainty, or variation matters.",
  "key-value-list":
    "Use this for concise metadata, project facts, stack details, or summaries that should stay compact and scannable.",
  compare:
    "Use this when you want to put two approaches side by side and keep the contrast visually obvious.",
  diff: "Use this for before-and-after examples, refactors, rewrites, or any transformation where change is the point.",
  "inline-math":
    "Use this for notation, short formulas, and losses that should stay inside the sentence without breaking the reading rhythm.",
  "math-block":
    "Use this when the equation deserves its own block and anchor because you will discuss or reference it again across the page.",
  "paper-card":
    "Use this for paper notes, reading lists, and method summaries where title, venue, links, and takeaway all matter together.",
  "citation-bibliography":
    "Use this when you want explicit in-text citations and a structured references section instead of burying sources in prose.",
  chart:
    "Use this for training curves, backtests, benchmark trends, and any result where the shape of the change matters. Add an explicitly labeled interval when uncertainty changes the conclusion.",
  "scatter-plot":
    "Use this for calibration, agreement, correlation, or heterogeneity. State what one point represents and do not imply a fitted relationship that is not shown.",
  histogram:
    "Use this for a distribution only when the bin edges and denominator are explicit. The component never chooses bins from raw data for you.",
  "box-plot":
    "Use this to compare supplied five-number summaries. State the observation frequency and whisker convention beside the plot.",
  "regression-table":
    "Use this for formal empirical estimates: coefficients, supplied standard errors or intervals, model columns, and disclosure notes. It does not infer statistical significance.",
  "source-excerpt":
    "Use this when a historical claim depends on the reader being able to inspect the facsimile, transcription, reading text or translation, and archival locator together.",
  "ablation-table":
    "Use this for method comparisons where readers need to scan metric tradeoffs quickly and identify the best result at a glance.",
  definition:
    "Use this for a precise concept, term, or notation that readers will need later in the same article. Its required ID gives CrossReference a stable target.",
  "cross-reference":
    "Use this to cite a stable anchor in the current article instead of hand-writing a hash link. The content checks reject a missing target.",
  "theorem-block":
    "Use this for theorems, assumptions, lemmas, or compact formal statements that deserve stronger structure than plain prose. Use Definition for named concepts.",
  "proof-block":
    "Use this when the argument matters, but a full formal proof would slow the article down more than it helps.",
  "derivation-block":
    "Use this for optimization updates, Bayesian manipulations, or signal-processing algebra where readers need the derivation in checkpoints.",
  "equation-group":
    "Use this when several equations belong together and you want inline references without manually maintaining the numbering anywhere on the page.",
  "mermaid-diagram":
    "Use this when a quick flowchart, state machine, or sequence diagram explains the relationship between steps better than paragraphs can.",
  "architecture-diagram":
    "Use this when you want a cleaner systems view than raw Mermaid source, especially for data pipelines, agent stacks, or training loops.",
  "task-spec-card":
    "Use this for embodied tasks, control benchmarks, or robotics setups where observations, actions, rewards, and success conditions must be explicit.",
  "experiment-setup":
    "Use this for reproducibility sections so readers can recover dataset, compute, metrics, and key hyperparameters at a glance.",
  "multi-panel-figure":
    "Use this for MRI reconstructions, ablations, or qualitative comparisons where consistent crops and panel labels carry most of the argument.",
  "kspace-viewer":
    "Use this when you need to connect acquisition space, masks, reconstructions, and error maps in one compact MRI-specific view.",
  "backtest-chart":
    "Use this for quant writeups where the equity curve alone is not enough and drawdown context changes the interpretation.",
  "metric-table":
    "Use this for benchmark sections where readers should compare multiple metrics at once across models, strategies, or systems.",
  "leaderboard-table":
    "Use this when rank order is the headline, such as strategy selection, model sweeps, or benchmark standings.",
  heatmap:
    "Use this when the spatial pattern across a matrix matters more than one exact row or column in isolation.",
  "confusion-matrix":
    "Use this for classification, policy mistakes, or failure-mode analysis where diagonal strength and cross-class leakage are the main story.",
  youtube:
    "Use this when the canonical version of the media already lives on YouTube and embedding it is the simplest option.",
  "video-player":
    "Use this for self-hosted or controlled video experiences where chapters, poster art, or extra commentary matter.",
  "audio-player":
    "Use this for podcast clips, interviews, voice notes, or any audio-first section that benefits from context and cover art.",
};

export default function EditorComponentsGuidePage() {
  return (
    <main
      data-equation-root="guide"
      className="flex min-h-screen w-screen max-w-none flex-col gap-6 px-4 py-8 lg:px-6 xl:flex-row xl:items-start xl:gap-8 xl:px-8"
      style={{ marginLeft: "calc(50% - 50vw)" }}
    >
      <EquationNumbering rootSelector='[data-equation-root="guide"]' />
      <aside className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:w-80 xl:shrink-0 xl:overflow-y-auto">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(226,232,240,0.85),_rgba(255,255,255,1)_42%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-6">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">
              Author Reference
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              MDX Component Guide
            </h1>
            <p className="text-sm leading-7 text-slate-600">
              Use this page like a real writing manual: decide when a component
              fits, review the props that matter, copy the snippet, then confirm
              the final result in the live preview.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/editor"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
            >
              Open Editor
            </Link>
            <a
              href="#component-catalog"
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Browse Catalog
            </a>
          </div>

          <div className="mt-6 grid gap-3">
            <InfoCard
              title="How to use this page"
              body="Start with the usage note, scan the props section, then copy the snippet or configure the same component inside /editor."
            />
            <InfoCard
              title="Keep prose simple"
              body="Use custom components only when structure, media, or interaction genuinely improves the article."
            />
          </div>

          <GuideNavigation sections={navigationSections} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:p-6 xl:hidden">
          <div className="flex flex-wrap gap-2">
            {categoryEntries.map(([category, entries]) => (
              <a
                key={category}
                href={`#category-${slugifyCategory(category)}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
              >
                {category} - {entries.length}
              </a>
            ))}
          </div>
        </section>

        <section
          id="component-catalog"
          className="space-y-10 rounded-[2rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm lg:p-6"
        >
          {categoryEntries.map(([category, entries]) => (
            <div
              key={category}
              id={`category-${slugifyCategory(category)}`}
              className="space-y-5 scroll-mt-24"
            >
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
                    {category}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    {category} Components
                  </h2>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                  {entries.length} patterns
                </div>
              </div>

              <div className="space-y-6">
                {entries.map(entry => (
                  <ComponentGuideCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function ComponentGuideCard({ entry }: { entry: ComponentSnippet }) {
  const preview = renderPreview(entry.id);

  return (
    <article
      id={`component-${entry.id}`}
      className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
            {entry.category}
          </p>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {entry.label}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {entry.hint}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <GuideSection title="When to use">
          <p className="text-sm leading-7 text-slate-600">
            {buildUsageText(entry)}
          </p>
          {entry.notes?.length ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {entry.notes.map(note => (
                <li
                  key={note}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 leading-6"
                >
                  {note}
                </li>
              ))}
            </ul>
          ) : null}
        </GuideSection>

        <GuideSection title="Props">
          <PropsList fields={entry.fields} />
        </GuideSection>

        <GuideSection title="Snippet">
          <Snippet className="my-0" scroll={false}>
            <code className="language-mdx">{entry.snippet}</code>
          </Snippet>
        </GuideSection>

        <GuideSection title="Preview">
          {preview ? (
            <div
              className={
                entry.id === "file-tree"
                  ? "overflow-x-auto py-1"
                  : "overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5"
              }
            >
              <div className="mx-auto max-w-5xl">{preview}</div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              This component does not need a live preview yet.
            </div>
          )}
        </GuideSection>
      </div>
    </article>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
        {title}
      </div>
      {children}
    </section>
  );
}

function PropsList({ fields }: { fields?: ComponentSnippetField[] }) {
  if (!fields?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-7 text-slate-500">
        No structured form props are defined for this component yet. Use the
        snippet as the starting point and edit the inline values directly.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map(field => (
        <div
          key={field.id}
          className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">
              {field.label}
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
              {field.type}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-sm ${
                field.required
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500"
              }`}
            >
              {field.required ? "Required" : "Optional"}
            </span>
          </div>
          <div className="mt-2 font-mono text-xs text-slate-500">
            {field.id}
          </div>
          {field.help ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {field.help}
            </p>
          ) : null}
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            {field.placeholder ? <p>Placeholder: {field.placeholder}</p> : null}
            {field.defaultValue !== undefined ? (
              <p>
                Default:{" "}
                <span className="font-mono text-xs text-slate-700">
                  {Array.isArray(field.defaultValue)
                    ? `${field.defaultValue.length} rows`
                    : String(field.defaultValue)}
                </span>
              </p>
            ) : null}
            {field.example ? (
              <p>
                Example:{" "}
                <span className="font-mono text-xs text-slate-700">
                  {field.example}
                </span>
              </p>
            ) : null}
            {field.options?.length ? (
              <p>
                Options:{" "}
                <span className="font-mono text-xs text-slate-700">
                  {field.options.map(option => option.value).join(", ")}
                </span>
              </p>
            ) : null}
            {field.itemFields?.length ? (
              <p>
                Row fields:{" "}
                <span className="font-mono text-xs text-slate-700">
                  {field.itemFields.map(item => item.id).join(", ")}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildUsageText(entry: ComponentSnippet) {
  const authoredUsage = componentUsageById[entry.id];
  if (authoredUsage) {
    return authoredUsage;
  }

  const hint = entry.hint.trim();
  const normalizedHint =
    hint.length > 0
      ? hint.charAt(0).toLowerCase() + hint.slice(1)
      : "extra structure";
  return `Use ${entry.label} when you need ${normalizedHint} inside an MDX post. It works best when plain Markdown is no longer enough, but you still want the content to stay readable and easy to maintain.`;
}

function slugifyCategory(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildPreviewPanelImage(
  title: string,
  accent: string,
  background: string,
  dark = false
) {
  const textColor = dark ? "#f8fafc" : "#0f172a";
  const surface = dark ? "#020617" : "#ffffff";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
      <rect width="640" height="640" rx="40" fill="${surface}" />
      <rect x="42" y="42" width="556" height="556" rx="28" fill="${background}" />
      <circle cx="200" cy="236" r="104" fill="${accent}" opacity="0.28" />
      <rect x="278" y="164" width="170" height="170" rx="26" fill="${accent}" opacity="0.42" />
      <rect x="146" y="374" width="348" height="22" rx="11" fill="${accent}" opacity="0.35" />
      <rect x="184" y="418" width="270" height="18" rx="9" fill="${accent}" opacity="0.2" />
      <text x="320" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${textColor}">
        ${title}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderPreview(id: string) {
  switch (id) {
    case "markdown-basics":
      return (
        <div className="space-y-4 text-slate-700">
          <h1 className="text-2xl font-bold text-slate-950">Primary heading</h1>
          <h2 className="text-xl font-semibold text-slate-900">
            Secondary heading
          </h2>
          <p>
            This is a normal paragraph with inline code like{" "}
            <code>const ready = true;</code>.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Bullet item one</li>
            <li>Bullet item two</li>
          </ul>
        </div>
      );
    case "link-blockquote":
      return (
        <div className="space-y-4 text-slate-700">
          <p>
            Links keep the default MDX text styling, like{" "}
            <a
              className="underline"
              href="https://nextjs.org"
              target="_blank"
              rel="noreferrer"
            >
              Next.js
            </a>
            .
          </p>
          <blockquote className="border-l-4 border-slate-300 pl-4 text-slate-600">
            A short blockquote that stands out from the main article flow.
          </blockquote>
        </div>
      );
    case "callout":
      return (
        <Callout type="note" title="Methodological note">
          State the condition readers need to keep in mind when interpreting the argument.
        </Callout>
      );
    case "snippet":
      return (
        <Snippet
          className="my-0"
          label="Listing 1 · reconstruction.py"
          language="python"
          lineNumbers
          caption="A listing label identifies the source; line numbers are useful only when the surrounding text discusses a specific line."
        >
          <code className="language-python">{`def reconstruct(kspace, mask, model):
    acquired = mask * kspace
    estimate = inverse_fourier(acquired)

    for _ in range(model.iterations):
        prior = model.denoise(estimate)
        residual = mask * (fourier(prior) - acquired)
        estimate = prior - model.step_size * inverse_fourier(residual)

    return estimate


metrics = evaluate(reconstruct(kspace, mask, model), reference)
report(metrics, protocol="held-out multicoil validation")`}</code>
        </Snippet>
      );
    case "tabs":
      return (
        <Tabs lineNumbers caption="Choose the version you need">
          <Tab title="TypeScript">
            <pre>
              <code className="language-ts">{`export function formatViews(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}`}</code>
            </pre>
          </Tab>
          <Tab title="JavaScript">
            <pre>
              <code className="language-js">{`export function formatViews(value) {
  return new Intl.NumberFormat("en-US").format(value);
}`}</code>
            </pre>
          </Tab>
        </Tabs>
      );
    case "table":
      return (
        <Table
          label="Table 1"
          title="Component support by writing task"
          caption="A formal table separates the comparison from its source and methodological notes."
          source="Editor guide fixture."
          notes="Use an explicit ID when prose needs to cross-reference the table."
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
            <TR>
              <TD>Gallery</TD>
              <TD>Image-rich tutorials</TD>
              <TD>No</TD>
            </TR>
          </TBody>
        </Table>
      );
    case "steps":
      return (
        <Steps title="Publishing workflow">
          <Step title="Draft">Write the first version.</Step>
          <Step title="Review">Verify metadata and previews.</Step>
          <Step title="Publish">Promote the post when it is ready.</Step>
        </Steps>
      );
    case "algorithm":
      return (
        <Algorithm
          label="1"
          title="Greedy selection"
          input="Candidates C"
          output="Selected set S"
          caption="The invariant and proof belong in the surrounding prose; the component keeps the procedure scannable."
          emphasizedSteps={[3, 4]}
          steps={[
            {
              statement: "selected ← ∅",
              comment: "Initialize the solution set",
            },
            { statement: "for each candidate c in candidates do" },
            { statement: "if improves(selected, c) then", indent: 1 },
            { statement: "selected ← selected ∪ {c}", indent: 2 },
            { statement: "return selected" },
          ]}
        />
      );
    case "file-tree":
      return (
        <FileTree
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
        />
      );
    case "terminal-block":
      return (
        <TerminalBlock
          title="Training session"
          caption="Mix commands and structured status lines to show what actually happened during the run."
          lines={[
            "$ uv run train.py --config fastmri.yaml",
            "[info] Loaded 973 volumes",
            "[success] Validation PSNR 33.4",
            "[warn] GPU memory reached 90%",
          ]}
        />
      );
    case "accordion":
      return (
        <Accordion>
          <AccordionItem title="Why MDX?" open>
            MDX keeps prose and components in one place.
          </AccordionItem>
          <AccordionItem title="When should I use it?">
            Use it when prose alone is not enough.
          </AccordionItem>
        </Accordion>
      );
    case "timeline":
      return (
        <Timeline>
          <TimelineItem title="Quantitative mapping enters MRI" date="1973">
            State the methodological or historical change and cite the primary
            source in the narrative.
          </TimelineItem>
          <TimelineItem title="Clinical translation accelerates" date="1990s">
            Explain what changed, what evidence supports it, and what remained
            unresolved.
          </TimelineItem>
        </Timeline>
      );
    case "figure-image":
      return (
        <Figure>
          <RawImage
            src="/images/avatar-placeholder-muted.svg"
            alt="Author portrait"
            className="h-auto w-full max-w-xs rounded-2xl"
          />
        </Figure>
      );
    case "gallery":
      return (
        <Gallery
          columns={2}
          images={[
            {
              src: "/images/avatar-placeholder.svg",
              alt: "Preview one",
              caption: "First image",
            },
            {
              src: "/images/avatar-placeholder-muted.svg",
              alt: "Preview two",
              caption: "Second image",
            },
          ]}
        />
      );
    case "pull-quote":
      return (
        <PullQuote author="Author name">
          Writing gets easier when the structure helps instead of fights you.
        </PullQuote>
      );
    case "stats":
      return (
        <Stats>
          <Stat value="24" label="Published posts" trend="+3 this month" />
          <Stat value="1.2K" label="Subscribers" trend="+9%" />
        </Stats>
      );
    case "key-value-list":
      return (
        <KeyValueList>
          <KeyValueItem label="Stack" value="Next.js + MDX" />
          <KeyValueItem label="Status" value="In active development" />
        </KeyValueList>
      );
    case "compare":
      return (
        <Compare
          leftTitle="Approach A"
          rightTitle="Approach B"
          left="A fast summary of the first option."
          right="A fast summary of the second option."
        />
      );
    case "diff":
      return (
        <Diff
          beforeTitle="Before"
          afterTitle="After"
          before={'console.log("before");'}
          after={'console.log("after");'}
        />
      );
    case "inline-math":
      return (
        <div className="text-slate-700">
          <InlineMath tex={"\\mathcal{L}(x, y) = \\lVert Ax - y \\rVert_2^2"} />
        </div>
      );
    case "math-block":
      return (
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">
            Mention the objective again with{" "}
            <AutoEquationRef target="guide-eq-varnet" />.
          </p>
          <MathBlock
            id="guide-eq-varnet"
            tex={
              "\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)"
            }
            caption="The page-level numbering system fills the label automatically."
          />
        </div>
      );
    case "paper-card":
      return (
        <PaperCard
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
          Summarize the main contribution, the dataset, and the one reason this
          paper still matters for the method you are discussing.
        </PaperCard>
      );
    case "citation-bibliography":
      return (
        <div className="space-y-4 text-slate-700">
          <p className="leading-7">
            Reference the method inline with{" "}
            <Citation refId="guide-paper-1" label="[1]" /> so readers can jump
            straight to the source.
          </p>
          <Bibliography note="Keep the entry short and add only the links readers will actually need.">
            <BibliographyItem
              id="guide-paper-1"
              label="[1]"
              title="Learning to see in k-space"
              authors={["Hammernik et al."]}
              venue="arXiv"
              year="2024"
              note="One-sentence reminder of the paper's core contribution."
              links={[{ label: "Paper", href: "https://arxiv.org/" }]}
            />
          </Bibliography>
        </div>
      );
    case "chart":
      return (
        <Chart
          title="Validation PSNR across epochs"
          description="A compact curve chart is often enough for MRI metrics, backtests, or training stability; show the interval when it changes the interpretation."
          xLabels={["0", "10", "20", "30", "40"]}
          series={[
            {
              label: "Ours",
              type: "line",
              data: [29.1, 31.4, 32.5, 33.1, 33.4],
              interval: {
                label: "synthetic 95% interval",
                lower: [28.6, 30.7, 31.7, 32.3, 32.5],
                upper: [29.6, 32.1, 33.3, 33.9, 34.3],
              },
            },
            {
              label: "Baseline",
              type: "area",
              data: [28.4, 29.7, 30.2, 30.6, 30.9],
            },
          ]}
        />
      );
    case "scatter-plot":
      return (
        <ScatterPlot
          title="Observed versus estimated quantity"
          description="Scatter plots make calibration and dispersion visible rather than hiding them inside an average error."
          xLabel="Reference quantity"
          yLabel="Estimated quantity"
          minX={0}
          maxX={1}
          minY={0}
          maxY={1}
          series={[
            {
              label: "Held-out fixture",
              color: "#2563eb",
              points: [
                { x: 0.12, y: 0.16 }, { x: 0.25, y: 0.23 }, { x: 0.37, y: 0.39 },
                { x: 0.48, y: 0.44 }, { x: 0.64, y: 0.66 }, { x: 0.81, y: 0.76 },
              ],
            },
            {
              label: "Stress fixture",
              color: "#ea580c",
              points: [
                { x: 0.19, y: 0.12 }, { x: 0.44, y: 0.31 }, { x: 0.72, y: 0.58 },
              ],
            },
          ]}
          caption="Synthetic points only. State the unit, reference, and sampling unit in a real article."
        />
      );
    case "histogram":
      return (
        <Histogram
          title="Residual distribution"
          description="The displayed bins are authored, so the statistical grouping is inspectable."
          xLabel="Absolute residual"
          yLabel="Cases"
          bins={[
            { label: "0–0.02", count: 42 }, { label: "0.02–0.04", count: 31 },
            { label: "0.04–0.06", count: 16 }, { label: "0.06–0.08", count: 7 },
            { label: ">0.08", count: 4 },
          ]}
          caption="State the bin edges, denominator, and excluded observations."
        />
      );
    case "box-plot":
      return (
        <BoxPlot
          title="Monthly return distribution"
          description="Each box uses an explicit five-number summary rather than a hidden statistical convention."
          yLabel="Monthly net return"
          yFormat="percent"
          items={[
            { label: "Trend", lowerWhisker: -0.14, q1: -0.03, median: 0.01, q3: 0.05, upperWhisker: 0.16, color: "#2563eb" },
            { label: "Value", lowerWhisker: -0.12, q1: -0.02, median: 0.008, q3: 0.04, upperWhisker: 0.13, color: "#0f766e" },
            { label: "Control", lowerWhisker: -0.09, q1: -0.025, median: 0.002, q3: 0.028, upperWhisker: 0.08, color: "#64748b" },
          ]}
          caption="Synthetic summaries. A real article must define the observation frequency and whisker convention."
        />
      );
    case "regression-table":
      return (
        <RegressionTable
          label="Table 1"
          title="Illustrative factor-regression disclosure"
          models={[
            { key: "market", label: "Market model", detail: "Excess return" },
            {
              key: "three-factor",
              label: "Three-factor model",
              detail: "Excess return",
            },
          ]}
          panels={[
            {
              title: "Panel A. Estimated exposures",
              rows: [
                {
                  label: "Market excess return",
                  values: {
                    market: { value: 1.02, standardError: 0.06, annotation: "†" },
                    "three-factor": {
                      value: 0.96,
                      standardError: 0.07,
                      annotation: "†",
                    },
                  },
                },
                {
                  label: "Size factor",
                  values: {
                    market: null,
                    "three-factor": {
                      value: 0.21,
                      standardError: 0.08,
                      interval: [0.05, 0.37],
                    },
                  },
                },
              ],
            },
            {
              title: "Panel B. Model statistics",
              rows: [
                {
                  label: "Observations",
                  kind: "statistic",
                  values: { market: 240, "three-factor": 240 },
                },
                {
                  label: "Adjusted R²",
                  kind: "statistic",
                  values: { market: 0.18, "three-factor": 0.24 },
                },
              ],
            },
          ]}
          caption="A rendering fixture for an empirical-results table; values and annotations are synthetic."
          source="Editor guide fixture."
          notes="Parentheses contain author-supplied standard errors. † is also supplied by the author; the component does not calculate significance."
        />
      );
    case "source-excerpt":
      return (
        <SourceExcerpt
          title="Committee minute: a synthetic transcription example"
          layout="reading"
          source="Synthetic fixture created for this guide; not an archival record"
          repository="Example repository"
          collection="Committee records"
          locator="Collection A, item 12, fol. 3r"
          date="1851-03-14"
          facsimile={{
            src: buildPreviewPanelImage("Source witness", "#64748b", "#f1f5f9"),
            alt: "Synthetic facsimile preview with lines representing a manuscript page",
            caption: "The image, transcription, and reading text remain visibly linked.",
          }}
          transcription={"the [illeg.] commttee\nmet at 3 o'Clocke\n& agreed to defer"}
          reading={"The [illegible] committee\nmet at 3 o'clock\nand agreed to defer."}
          note="The component records the source locator beside every editorial transformation."
        />
      );
    case "ablation-table":
      return (
        <AblationTable
          title="Ablation on mask ratio and recurrent depth"
          caption="Bold values identify the best result in each metric column without using colour as the only signal."
          variantLabel="Setting"
          metrics={[
            { key: "psnr", label: "PSNR", direction: "higher" },
            { key: "ssim", label: "SSIM", direction: "higher" },
          ]}
          rows={[
            { label: "No recurrence", values: { psnr: 31.4, ssim: 0.912 } },
            { label: "With recurrence", values: { psnr: 33.0, ssim: 0.927 } },
          ]}
        />
      );
    case "theorem-block":
      return (
        <TheoremBlock
          kind="theorem"
          label="1"
          title="Data consistency step"
          footer="Use the footer to explain why the formal statement matters in the surrounding narrative."
        >
          State the definition, theorem, or assumption in the most compact form
          you can defend.
        </TheoremBlock>
      );
    case "definition":
      return (
        <Definition
          id="guide-signal-model"
          label="1"
          title="Signal model"
          footer="Keep the identifier stable once an article is published."
        >
          A signal model specifies how observed measurements relate to the
          latent quantity being estimated.
        </Definition>
      );
    case "cross-reference":
      return (
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-700">
            The reconstruction follows{" "}
            <CrossReference target="guide-signal-model" label="Definition 1" />.
          </p>
          <Definition id="guide-signal-model" label="1" title="Signal model">
            A signal model relates the measurement process to the latent
            quantity being estimated.
          </Definition>
        </div>
      );
    case "proof-block":
      return (
        <ProofBlock
          title="Convergence sketch"
          strategy="Induction"
          conclusion="End with the one-line implication that sets up the next section."
        >
          Show the base case, state the inductive assumption, and explain only
          the update that preserves the invariant. Skip the algebra that does
          not change the actual intuition.
        </ProofBlock>
      );
    case "derivation-block":
      return (
        <DerivationBlock
          title="Gradient update derivation"
          caption="Use the notes to keep the algebra readable even when the equations get dense."
          steps={[
            {
              label: "Step 1",
              title: "Start from the objective",
              equation:
                "\\mathcal{L}(x) = \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)",
              note: "State the objective before taking derivatives so the reader has the full context.",
            },
            {
              label: "Step 2",
              title: "Differentiate",
              equation:
                "\\nabla_x \\mathcal{L}(x) = 2A^\\top(Ax - y) + \\lambda \\nabla R(x)",
              note: "Keep only the derivative that changes the update rule.",
            },
          ]}
        />
      );
    case "equation-group":
      return (
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">
            Mention the update again with{" "}
            <AutoEquationRef target="guide-eq-update" />.
          </p>
          <EquationGroup
            title="Core equations"
            caption="The reference component reads the rendered labels from the equation entries below."
            equations={[
              {
                id: "guide-eq-objective",
                title: "Objective",
                tex: "\\hat{x} = \\arg\\min_x \\lVert Ax - y \\rVert_2^2 + \\lambda R(x)",
                note: "Reconstruction objective.",
              },
              {
                id: "guide-eq-update",
                title: "Update",
                tex: "x_{t+1} = x_t - \\eta \\nabla_x \\mathcal{L}(x_t)",
                note: "Gradient descent update.",
              },
            ]}
          />
        </div>
      );
    case "mermaid-diagram":
      return (
        <MermaidDiagram
          title="System flow"
          caption="Mermaid is useful when readers care about the relationship between stages more than polished illustration."
          chart={`flowchart LR
  raw["Raw k-space"] --> mask["Sampling mask"]
  mask --> recon["Reconstruction model"]
  recon --> metrics["Metrics and review"]`}
        />
      );
    case "architecture-diagram":
      return (
        <ArchitectureDiagram
          title="MRI training pipeline"
          caption="The structured wrapper is easier to maintain than a long raw Mermaid string when the diagram grows."
          direction="LR"
          nodes={[
            {
              id: "scanner",
              label: "Scanner data",
              group: "Acquisition",
              shape: "rounded",
              tone: "accent",
            },
            {
              id: "loader",
              label: "Dataset loader",
              group: "Acquisition",
              shape: "rect",
              tone: "default",
            },
            {
              id: "model",
              label: "VarNet",
              group: "Model",
              shape: "subroutine",
              tone: "success",
            },
            {
              id: "metrics",
              label: "Metrics",
              group: "Evaluation",
              shape: "diamond",
              tone: "muted",
            },
          ]}
          edges={[
            { from: "scanner", to: "loader", label: "shards" },
            {
              from: "loader",
              to: "model",
              label: "mini-batches",
              style: "thick",
            },
            { from: "model", to: "metrics", label: "reconstructions" },
          ]}
        />
      );
    case "task-spec-card":
      return (
        <TaskSpecCard
          title="Pick-and-place task"
          domain="Embodied control"
          environment="Simulated tabletop"
          goal="Move the target object from the source bin to the destination zone without collisions."
          observations={["RGB wrist camera", "Robot state", "Gripper width"]}
          actions={["Cartesian delta pose", "Open gripper", "Close gripper"]}
          rewards={[
            "Dense shaping on distance",
            "Success bonus",
            "Collision penalty",
          ]}
          successCriteria={[
            "Object in goal zone",
            "No collision",
            "Episode under 10 seconds",
          ]}
          notes="Use this notes field for reset randomness, object variations, or safety rules."
        />
      );
    case "experiment-setup":
      return (
        <ExperimentSetup
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
          notes="Mention augmentation policy, seeds, and evaluation caveats here."
        />
      );
    case "multi-panel-figure":
      return (
        <MultiPanelFigure
          title="Reconstruction comparison"
          caption="A multi-panel figure is often easier to trust than several disconnected images."
          columns={2}
          panels={[
            {
              label: "A",
              title: "Zero-filled",
              src: buildPreviewPanelImage("Zero-filled", "#94a3b8", "#e2e8f0"),
              alt: "Zero-filled reconstruction placeholder",
              note: "Baseline reconstruction",
            },
            {
              label: "B",
              title: "Reference",
              src: buildPreviewPanelImage("Reference", "#0f766e", "#d1fae5"),
              alt: "Reference reconstruction placeholder",
              note: "Ground-truth target",
            },
            {
              label: "C",
              title: "VarNet",
              src: buildPreviewPanelImage("VarNet", "#2563eb", "#dbeafe"),
              alt: "VarNet reconstruction placeholder",
              note: "Recurrent baseline",
            },
            {
              label: "D",
              title: "Ours",
              src: buildPreviewPanelImage("Ours", "#7c3aed", "#ede9fe"),
              alt: "Our reconstruction placeholder",
              note: "Sharper structure in the target region",
            },
          ]}
        />
      );
    case "kspace-viewer":
      return (
        <KSpaceViewer
          title="k-space inspection"
          caption="Keep the four-panel comparison tight so readers can move from acquisition to visible error without losing context."
          columns={2}
          panels={[
            {
              label: "Acquired magnitude",
              src: buildPreviewPanelImage(
                "k-space",
                "#38bdf8",
                "#e0f2fe",
                true
              ),
              alt: "k-space magnitude preview",
              kind: "kspace",
              note: "Log magnitude reveals the energy distribution in sampled space.",
            },
            {
              label: "Sampling mask",
              src: buildPreviewPanelImage("Mask", "#a78bfa", "#f3e8ff", true),
              alt: "sampling mask preview",
              kind: "mask",
              note: "Variable-density mask at 8x acceleration.",
            },
            {
              label: "Reconstruction",
              src: buildPreviewPanelImage("Recon", "#34d399", "#d1fae5"),
              alt: "reconstruction preview",
              kind: "reconstruction",
              note: "Recovered structure with reduced ringing.",
            },
            {
              label: "Error map",
              src: buildPreviewPanelImage("Error", "#fb7185", "#ffe4e6", true),
              alt: "error map preview",
              kind: "error",
              note: "Residual energy localizes around sharp edges.",
            },
          ]}
        />
      );
    case "backtest-chart":
      return (
        <BacktestChart
          title="Strategy vs. benchmark"
          caption="Show the drawdown panel whenever the smoothness of the equity curve could hide risk."
          labels={["Jan", "Feb", "Mar", "Apr", "May"]}
          equity={[1.0, 1.05, 1.08, 1.11, 1.16]}
          benchmark={[1.0, 1.02, 1.03, 1.07, 1.09]}
          strategyLabel="Strategy"
          benchmarkLabel="Benchmark"
        />
      );
    case "metric-table":
      return (
        <MetricTable
          title="Validation benchmark"
          caption="This style works well when every row is a model family and readers need to compare more than one metric."
          rowLabel="Model"
          metrics={[
            {
              key: "psnr",
              label: "PSNR",
              direction: "higher",
              format: "number",
            },
            {
              key: "ssim",
              label: "SSIM",
              direction: "higher",
              format: "number",
            },
            {
              key: "nmse",
              label: "NMSE",
              direction: "lower",
              format: "number",
            },
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
              tag: "Featured",
              note: "Best overall validation result",
              featured: true,
            },
            {
              label: "Prompted Diffusion",
              values: { psnr: 33.74, ssim: 0.936, nmse: 0.058 },
              tag: "Candidate",
              note: "Sharper details with slower inference",
            },
          ]}
        />
      );
    case "leaderboard-table":
      return (
        <LeaderboardTable
          title="Strategy leaderboard"
          caption="Use a leaderboard when rank order is the story and the reader should make a selection quickly."
          scoreLabel="Sharpe"
          deltaLabel="Delta vs baseline"
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
            {
              label: "Sector-neutral blend",
              score: 1.22,
              delta: -0.03,
              tag: "Watchlist",
              note: "Improves robustness but trails the leader",
            },
          ]}
        />
      );
    case "heatmap":
      return (
        <Heatmap
          title="Ablation heatmap"
          caption="A compact matrix helps when you want the trend across two dimensions without writing three separate charts."
          rows={["Mask 0.05", "Mask 0.10", "Mask 0.15"]}
          columns={["Depth 4", "Depth 6", "Depth 8"]}
          values={[
            [31.1, 31.8, 32.0],
            [32.5, 33.1, 33.4],
            [32.7, 33.0, 33.2],
          ]}
          format="number"
        />
      );
    case "confusion-matrix":
      return (
        <ConfusionMatrix
          title="Policy error breakdown"
          caption="Normalize rows when you want each actual class to sum to 100%."
          labels={["Reach", "Grasp", "Place"]}
          values={[
            [82, 12, 6],
            [9, 75, 16],
            [5, 11, 84],
          ]}
          normalize
        />
      );
    case "youtube":
      return <YouTube videoId="dQw4w9WgXcQ" />;
    case "video-player":
      return (
        <VideoPlayer
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          title="Release walkthrough"
          chapters={[
            { label: "Intro", time: 0 },
            { label: "Demo", time: 4 },
          ]}
        />
      );
    case "audio-player":
      return (
        <AudioPlayer
          src="https://file-examples.com/storage/fe1afdf45b8e85b2e1fae03/2017/11/file_example_MP3_700KB.mp3"
          title="Audio sample"
          subtitle="Short supporting context"
        />
      );
    default:
      return null;
  }
}

function groupByCategory(entries: ComponentSnippet[]) {
  return entries.reduce<Record<string, ComponentSnippet[]>>((groups, entry) => {
    if (!groups[entry.category]) {
      groups[entry.category] = [];
    }

    groups[entry.category].push(entry);
    return groups;
  }, {});
}
