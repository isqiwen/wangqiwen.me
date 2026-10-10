import type { EditorConfirmation } from "./types";

export function ConfirmationDialog({
  confirmation,
  onCancel,
  onConfirm,
}: {
  confirmation: EditorConfirmation;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const hasBlockingCheck = confirmation.checks?.some(
    check => check.status === "fail"
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4">
      <section
        aria-labelledby="editor-confirmation-heading"
        aria-modal="true"
        role="dialog"
        className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            Confirm Action
          </p>
          <h3
            id="editor-confirmation-heading"
            className="text-xl font-semibold text-slate-900"
          >
            {confirmation.title}
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            {confirmation.description}
          </p>
        </div>

        {confirmation.checks ? (
          <div className="mt-5 min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-800">
                Publish readiness
              </h4>
              <span className="text-xs text-slate-500">
                {hasBlockingCheck
                  ? "Resolve required items before publishing."
                  : "Ready to publish."}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {confirmation.checks.map(check => (
                <li
                  key={check.label}
                  className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs"
                >
                  <span
                    aria-label={
                      check.status === "pass"
                        ? "Passed"
                        : check.status === "warning"
                        ? "Recommended"
                        : "Needs attention"
                    }
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      check.status === "pass"
                        ? "bg-emerald-100 text-emerald-800"
                        : check.status === "warning"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {check.status === "pass"
                      ? "✓"
                      : check.status === "warning"
                      ? "!"
                      : "×"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-700">
                      {check.label}
                    </p>
                    <p className="mt-0.5 leading-5 text-slate-500">
                      {check.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex shrink-0 flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={hasBlockingCheck}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow ${
              confirmation.tone === "danger"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-slate-900 hover:bg-slate-700"
            } disabled:cursor-not-allowed disabled:bg-slate-300`}
          >
            {confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
