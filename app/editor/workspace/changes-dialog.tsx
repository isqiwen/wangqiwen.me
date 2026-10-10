import type { ChangesView, EditorChanges } from "./types";

export function ChangesDialog({
  changes,
  view,
  isLoading,
  onClose,
  onViewChange,
}: {
  changes: EditorChanges | null;
  view: ChangesView;
  isLoading: boolean;
  onClose: () => void;
  onViewChange: (view: ChangesView) => void;
}) {
  const changeSet = changes?.[view];
  const description =
    view === "saved"
      ? "Current editor content compared with the MDX file saved on disk."
      : "The MDX file saved on disk compared with Git HEAD.";
  const emptyMessage =
    view === "saved"
      ? "No unsaved changes."
      : "The saved MDX file matches Git HEAD.";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <section
        aria-labelledby="editor-changes-heading"
        aria-modal="true"
        role="dialog"
        className="flex max-h-full w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
              Version comparison
            </p>
            <h3
              id="editor-changes-heading"
              className="text-xl font-semibold text-slate-900"
            >
              Changes
            </h3>
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div
          className="mt-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Comparison baseline"
        >
          <button
            type="button"
            onClick={() => onViewChange("saved")}
            aria-pressed={view === "saved"}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              view === "saved"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Current editor vs saved file
          </button>
          <button
            type="button"
            onClick={() => onViewChange("git")}
            aria-pressed={view === "git"}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              view === "git"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Saved file vs Git HEAD
          </button>
        </div>

        <div className="mt-4 min-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4">
          {isLoading ? (
            <p className="text-sm text-slate-300">Loading changes…</p>
          ) : !changeSet?.available ? (
            <p className="text-sm text-slate-300">
              Save this document once before comparing changes.
            </p>
          ) : changeSet.diff ? (
            <DiffOutput diff={changeSet.diff} />
          ) : (
            <p className="text-sm text-slate-300">{emptyMessage}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function DiffOutput({ diff }: { diff: string }) {
  const lines = diff.split("\n");

  return (
    <pre
      aria-label="MDX diff"
      className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-100"
    >
      {lines.map((line, index) => (
        <span key={`${index}-${line}`} className={getDiffLineClassName(line)}>
          {line || " "}
        </span>
      ))}
    </pre>
  );
}

function getDiffLineClassName(line: string) {
  if (line.startsWith("+++")) {
    return "block bg-emerald-950/70 px-2 text-emerald-200";
  }

  if (line.startsWith("---")) {
    return "block bg-rose-950/70 px-2 text-rose-200";
  }

  if (line.startsWith("@@")) {
    return "block bg-sky-950/70 px-2 text-sky-200";
  }

  if (line.startsWith("+")) {
    return "block bg-emerald-950/40 px-2 text-emerald-100";
  }

  if (line.startsWith("-")) {
    return "block bg-rose-950/40 px-2 text-rose-100";
  }

  if (
    line.startsWith("diff ") ||
    line.startsWith("index ") ||
    line.startsWith("new file ")
  ) {
    return "block px-2 text-slate-400";
  }

  return "block px-2 text-slate-200";
}
