"use client";

import { buildDiffRows, buildSplitDiffRows } from "@/utils/line-diff";
import type { DiffContentRow, DiffRow, SplitDiffRow } from "@/utils/line-diff";
import { Highlight, themes } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";

type DiffProps = {
  beforeTitle?: string;
  afterTitle?: string;
  before: string;
  after: string;
  language?: Language;
  contextLines?: number;
  view?: "split" | "unified";
};

export function Diff({
  beforeTitle = "Before",
  afterTitle = "After",
  before,
  after,
  language = "text" as Language,
  contextLines = 3,
  view = "split",
}: DiffProps) {
  const rows = buildDiffRows(before, after, contextLines);
  const splitRows = buildSplitDiffRows(before, after, contextLines);

  return (
    <section className="my-10 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-sm">
      <DiffHeader beforeTitle={beforeTitle} afterTitle={afterTitle} language={language} />
      {view === "unified" ? (
        <UnifiedDiffTable rows={rows} beforeTitle={beforeTitle} afterTitle={afterTitle} language={language} />
      ) : (
        <>
          <div className="hidden md:block">
            <SplitDiffTable rows={splitRows} beforeTitle={beforeTitle} afterTitle={afterTitle} language={language} />
          </div>
          <div className="md:hidden">
            <UnifiedDiffTable rows={rows} beforeTitle={beforeTitle} afterTitle={afterTitle} language={language} />
          </div>
        </>
      )}
    </section>
  );
}

function DiffHeader({
  beforeTitle,
  afterTitle,
  language,
}: {
  beforeTitle: string;
  afterTitle: string;
  language: Language;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-700 bg-slate-900/80 px-4 py-3 font-mono text-xs">
      <p className="text-rose-200">
        <span aria-hidden="true" className="mr-2 text-rose-400">−</span>
        {beforeTitle}
      </p>
      <p className="text-emerald-200">
        <span aria-hidden="true" className="mr-2 text-emerald-400">+</span>
        {afterTitle}
      </p>
      <p className="ml-auto uppercase tracking-[0.12em] text-slate-400">{language}</p>
    </header>
  );
}

function UnifiedDiffTable({
  rows,
  beforeTitle,
  afterTitle,
  language,
}: {
  rows: DiffRow[];
  beforeTitle: string;
  afterTitle: string;
  language: Language;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse font-mono text-[13px] leading-6" aria-label={`${beforeTitle} to ${afterTitle} unified code diff`}>
        <thead className="sr-only">
          <tr>
            <th scope="col">Before line</th>
            <th scope="col">After line</th>
            <th scope="col">Change</th>
            <th scope="col">Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            if (row.kind === "collapsed") {
              return <CollapsedRow key={`collapsed-${index}`} count={row.count} colSpan={4} />;
            }

            return <UnifiedDiffLine key={lineKey(row)} row={row} language={language} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function SplitDiffTable({
  rows,
  beforeTitle,
  afterTitle,
  language,
}: {
  rows: SplitDiffRow[];
  beforeTitle: string;
  afterTitle: string;
  language: Language;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse font-mono text-[13px] leading-6" aria-label={`${beforeTitle} to ${afterTitle} parallel code diff`}>
        <thead className="sr-only">
          <tr>
            <th scope="col">Before line</th>
            <th scope="col">Before change</th>
            <th scope="col">Before code</th>
            <th scope="col">After line</th>
            <th scope="col">After change</th>
            <th scope="col">After code</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            if (row.kind === "collapsed") {
              return <CollapsedRow key={`collapsed-${index}`} count={row.count} colSpan={6} />;
            }

            return <SplitDiffLine key={`${lineKey(row.before)}-${lineKey(row.after)}`} row={row} language={language} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function CollapsedRow({ count, colSpan }: { count: number; colSpan: number }) {
  return (
    <tr className="border-y border-slate-800 bg-slate-900/70 text-slate-400">
      <td colSpan={colSpan} className="px-4 py-1.5 text-center text-xs">
        … {count} unchanged {count === 1 ? "line" : "lines"}
      </td>
    </tr>
  );
}

function UnifiedDiffLine({ row, language }: { row: DiffContentRow; language: Language }) {
  return (
    <tr className={rowStyle(row)}>
      <LineNumber value={row.beforeLine} />
      <LineNumber value={row.afterLine} />
      <td aria-hidden="true" className="w-7 select-none px-2 text-center font-semibold text-slate-300">
        {markerFor(row)}
      </td>
      <CodeCell row={row} language={language} />
    </tr>
  );
}

function SplitDiffLine({ row, language }: { row: Extract<SplitDiffRow, { kind: "split" }>; language: Language }) {
  return (
    <tr>
      <SplitDiffCell row={row.before} language={language} divider={false} />
      <SplitDiffCell row={row.after} language={language} divider />
    </tr>
  );
}

function SplitDiffCell({
  row,
  language,
  divider,
}: {
  row: DiffContentRow | null;
  language: Language;
  divider: boolean;
}) {
  const style = row ? rowStyle(row) : "bg-slate-950";
  const line = row?.beforeLine ?? row?.afterLine ?? null;

  return (
    <>
      <td className={`w-12 select-none border-r border-slate-800 px-2 text-right tabular-nums text-slate-500 ${style} ${divider ? "border-l border-slate-700" : ""}`}>
        {line ?? ""}
      </td>
      <td aria-hidden="true" className={`w-7 select-none px-2 text-center font-semibold text-slate-300 ${style}`}>
        {row ? markerFor(row) : ""}
      </td>
      <CodeCell row={row} language={language} style={style} />
    </>
  );
}

function LineNumber({ value }: { value: number | null }) {
  return (
    <td className="w-12 select-none border-r border-slate-800 px-2 text-right tabular-nums text-slate-500">
      {value ?? ""}
    </td>
  );
}

function CodeCell({
  row,
  language,
  style,
}: {
  row: DiffContentRow | null;
  language: Language;
  style?: string;
}) {
  return (
    <td className={`whitespace-pre px-2 ${style ?? ""}`}>
      {row ? <CodeTokens code={row.content} language={language} /> : " "}
    </td>
  );
}

function CodeTokens({ code, language }: { code: string; language: Language }) {
  return (
    <Highlight theme={themes.nightOwl} code={code || " "} language={language}>
      {({ tokens, getTokenProps }) => (
        <code>
          {(tokens[0] ?? []).map((token, index) => (
            <span key={index} {...getTokenProps({ token })} />
          ))}
        </code>
      )}
    </Highlight>
  );
}

function lineKey(row: DiffContentRow | null) {
  return row ? `${row.kind}-${row.beforeLine}-${row.afterLine}-${row.content}` : "empty";
}

function markerFor(row: DiffContentRow) {
  return row.kind === "removed" ? "−" : row.kind === "added" ? "+" : " ";
}

function rowStyle(row: DiffContentRow) {
  if (row.kind === "removed") return "bg-rose-950/60 text-rose-100";
  if (row.kind === "added") return "bg-emerald-950/60 text-emerald-100";
  return "border-b border-slate-900 bg-slate-950 text-slate-100";
}
