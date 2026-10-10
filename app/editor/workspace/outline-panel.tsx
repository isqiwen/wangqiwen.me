import { useMemo } from "react";
import {
  extractOutlineHeadings,
  getContentQualityIssues,
} from "./publish-readiness";
import type { EditorOutlineHeading } from "./types";

export function OutlinePanel({
  body,
  onJump,
}: {
  body: string;
  onJump: (heading: EditorOutlineHeading) => void;
}) {
  const outlineHeadings = useMemo(() => extractOutlineHeadings(body), [body]);
  const headingIssues = useMemo(
    () =>
      getContentQualityIssues(body, new Set()).filter(issue =>
        issue.includes("heading")
      ),
    [body]
  );

  return (
    <aside
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="article-outline-heading"
    >
      <div>
        <h2
          id="article-outline-heading"
          className="text-sm font-semibold text-slate-700"
        >
          Article Outline
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Built from <code>##</code>, <code>###</code>, and <code>####</code>{" "}
          headings. Select one to move the editor cursor there.
        </p>
      </div>

      {outlineHeadings.length > 0 ? (
        <nav className="mt-3" aria-label="Article outline">
          <ol className="space-y-1">
            {outlineHeadings.map(heading => (
              <li key={`${heading.line}-${heading.text}`}>
                <button
                  type="button"
                  onClick={() => onJump(heading)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 ${
                    heading.level === 3
                      ? "pl-6"
                      : heading.level === 4
                      ? "pl-10"
                      : ""
                  }`}
                >
                  <span className="font-mono text-[10px] text-slate-400">
                    H{heading.level}
                  </span>
                  <span className="min-w-0 truncate">{heading.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
          Add a <code>##</code> heading to start an outline.
        </p>
      )}

      {headingIssues.length > 0 ? (
        <div
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800"
          role="alert"
        >
          <p className="font-semibold">Fix heading hierarchy</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {headingIssues.map(issue => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
