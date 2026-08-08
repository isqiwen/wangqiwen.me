import {
  mdxDataTableFrameClass,
  mdxDataTableHeadClass,
  mdxMutedTextClass,
} from "./surface";

type AblationMetric = {
  key: string;
  label: string;
  direction?: "higher" | "lower";
};

type AblationRow = {
  label: string;
  values: Record<string, string | number>;
  note?: string;
};

type AblationTableProps = {
  title?: string;
  caption?: string;
  variantLabel?: string;
  metrics: AblationMetric[];
  rows: AblationRow[];
};

export function AblationTable({
  title,
  caption,
  variantLabel = "Variant",
  metrics,
  rows,
}: AblationTableProps) {
  const bestValues = metrics.reduce<Record<string, number | null>>((accumulator, metric) => {
    const numericValues = rows
      .map(row => row.values[metric.key])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    if (!numericValues.length) {
      accumulator[metric.key] = null;
      return accumulator;
    }

    accumulator[metric.key] =
      metric.direction === "lower"
        ? Math.min(...numericValues)
        : Math.max(...numericValues);

    return accumulator;
  }, {});

  return (
    <figure className="my-10">
      {title ? (
        <div className="mb-5">
          <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        </div>
      ) : null}

      <div className={mdxDataTableFrameClass}>
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className={mdxDataTableHeadClass}>
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                {variantLabel}
              </th>
              {metrics.map(metric => (
                <th
                  key={metric.key}
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white"
                >
                  {formatMetricHeading(metric.label, metric.direction)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="border-t border-slate-200/70 dark:border-white/10">
                <th scope="row" className="px-4 py-3 text-left text-slate-700 dark:text-slate-200">
                  <div className="font-semibold text-slate-950 dark:text-white">{row.label}</div>
                  {row.note ? (
                    <div className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      {row.note}
                    </div>
                  ) : null}
                </th>
                {metrics.map(metric => {
                  const value = row.values[metric.key];
                  const isBest =
                    typeof value === "number" &&
                    bestValues[metric.key] !== null &&
                    value === bestValues[metric.key];

                  return (
                    <td key={metric.key} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <span className={isBest ? "font-semibold tabular-nums text-slate-950 dark:text-white" : "tabular-nums"}>
                        {String(value ?? "-")}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className={`mt-4 ${mdxMutedTextClass}`}>
        {caption ? `${caption} ` : ""}
        Bold values are best within their metric column.
      </figcaption>
    </figure>
  );
}

function formatMetricHeading(
  label: string,
  direction: AblationMetric["direction"],
) {
  if (!direction || /[↑↓]/.test(label)) {
    return label;
  }

  return `${label} ${direction === "lower" ? "↓" : "↑"}`;
}
