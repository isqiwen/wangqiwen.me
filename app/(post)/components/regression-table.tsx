import type { ReactNode } from "react";
import {
  mdxDataTableFrameClass,
  mdxDataTableHeadClass,
  mdxEmptyStateClass,
  mdxMutedTextClass,
  mdxSubtleTextClass,
} from "./surface";

type RegressionValue = string | number;

export type RegressionTableModel = {
  key: string;
  label: string;
  detail?: string;
};

export type RegressionTableEstimate = {
  value?: RegressionValue;
  /** Printed exactly as supplied; this component never infers significance. */
  annotation?: ReactNode;
  standardError?: RegressionValue;
  interval?: [RegressionValue, RegressionValue];
  intervalLabel?: string;
};

export type RegressionTableRow = {
  label: ReactNode;
  values: Record<
    string,
    RegressionTableEstimate | RegressionValue | null | undefined
  >;
  /** Use for controls and statistics rather than estimated coefficients. */
  kind?: "estimate" | "statistic";
  indent?: number;
};

export type RegressionTablePanel = {
  title?: string;
  rows: RegressionTableRow[];
};

type RegressionTableProps = {
  id?: string;
  label?: string;
  title: string;
  models: RegressionTableModel[];
  panels: RegressionTablePanel[];
  caption?: ReactNode;
  source?: ReactNode;
  notes?: ReactNode;
};

export function RegressionTable({
  id,
  label,
  title,
  models,
  panels,
  caption,
  source,
  notes,
}: RegressionTableProps) {
  const usableModels = models.filter(model => model.key.trim() && model.label.trim());
  const usablePanels = panels.filter(panel => panel.rows.length);

  if (!usableModels.length || !usablePanels.length) {
    return (
      <div className={mdxEmptyStateClass}>
        Add at least one model column and one result row to render a regression table.
      </div>
    );
  }

  return (
    <figure
      id={id}
      data-reference-kind={id ? "table" : undefined}
      className="my-10 scroll-mt-24"
    >
      <div className="mb-5">
        <p className={mdxSubtleTextClass}>{label || "Table"}</p>
        <p className="mt-1 font-semibold text-slate-950 dark:text-white">{title}</p>
      </div>

      <div className={mdxDataTableFrameClass}>
        <table className="w-full border-collapse text-sm">
          <thead className={mdxDataTableHeadClass}>
            <tr>
              <th
                scope="col"
                className="w-[32%] px-4 py-3 text-left font-semibold text-slate-900 dark:text-white"
              >
                Variable
              </th>
              {usableModels.map(model => (
                <th
                  key={model.key}
                  scope="col"
                  className="min-w-36 px-4 py-3 text-right font-semibold text-slate-900 dark:text-white"
                >
                  <span className="block">{model.label}</span>
                  {model.detail ? (
                    <span className="mt-1 block text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
                      {model.detail}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usablePanels.map((panel, panelIndex) => (
              <RegressionPanel
                key={`${panel.title || "results"}-${panelIndex}`}
                panel={panel}
                models={usableModels}
              />
            ))}
          </tbody>
        </table>
      </div>

      {caption || source || notes ? (
        <figcaption className={`mt-4 space-y-2 ${mdxMutedTextClass}`}>
          {caption ? <p>{caption}</p> : null}
          {source ? (
            <p>
              <span className="font-medium text-slate-900 dark:text-white">Source. </span>
              {source}
            </p>
          ) : null}
          {notes ? (
            <p>
              <span className="font-medium text-slate-900 dark:text-white">Notes. </span>
              {notes}
            </p>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

function RegressionPanel({
  panel,
  models,
}: {
  panel: RegressionTablePanel;
  models: RegressionTableModel[];
}) {
  return (
    <>
      {panel.title ? (
        <tr className="border-t border-slate-200/70 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]">
          <th
            colSpan={models.length + 1}
            scope="colgroup"
            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300"
          >
            {panel.title}
          </th>
        </tr>
      ) : null}
      {panel.rows.map((row, rowIndex) => (
        <tr
          key={`${String(row.label)}-${rowIndex}`}
          className="border-t border-slate-200/70 dark:border-white/10"
        >
          <th
            scope="row"
            className={`px-4 py-3 text-left font-medium text-slate-800 dark:text-slate-100 ${
              row.indent ? "pl-8" : ""
            }`}
          >
            {row.label}
          </th>
          {models.map(model => (
            <td
              key={model.key}
              className="px-4 py-3 text-right align-top tabular-nums text-slate-700 dark:text-slate-200"
            >
              <RegressionCell
                value={row.values[model.key]}
                kind={row.kind ?? "estimate"}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function RegressionCell({
  value,
  kind,
}: {
  value: RegressionTableRow["values"][string];
  kind: NonNullable<RegressionTableRow["kind"]>;
}) {
  if (value == null) {
    return <span aria-label="Not reported">—</span>;
  }

  if (typeof value === "string" || typeof value === "number") {
    return <span>{formatValue(value)}</span>;
  }

  const mainValue = value.value == null ? "—" : formatValue(value.value);
  const shouldShowDetail = kind === "estimate";

  return (
    <div className="space-y-1">
      <div className="font-medium text-slate-950 dark:text-white">
        {mainValue}
        {value.annotation ? <sup className="ml-0.5 text-[0.65em]">{value.annotation}</sup> : null}
      </div>
      {shouldShowDetail && value.standardError != null ? (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          ({formatValue(value.standardError)})
        </div>
      ) : null}
      {shouldShowDetail && value.interval ? (
        <div className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {value.intervalLabel || "95% CI"} [{formatValue(value.interval[0])}, {formatValue(value.interval[1])}]
        </div>
      ) : null}
    </div>
  );
}

function formatValue(value: RegressionValue) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value);
  }

  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }

  return value.toFixed(3);
}
