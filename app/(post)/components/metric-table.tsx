import {
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

export type MetricTableMetric = {
  key: string;
  label: string;
  direction?: "higher" | "lower";
  format?: "number" | "percent" | "integer" | "bps" | "currency";
};

export type MetricTableRow = {
  label: string;
  values: Record<string, string | number>;
  tag?: string;
  note?: string;
  featured?: boolean;
};

type MetricTableProps = {
  title?: string;
  caption?: string;
  rowLabel?: string;
  metrics: MetricTableMetric[];
  rows: MetricTableRow[];
};

export function MetricTable({
  title,
  caption,
  rowLabel = "Model",
  metrics,
  rows,
}: MetricTableProps) {
  const bestValues = metrics.reduce<Record<string, number | null>>((map, metric) => {
    const numericValues = rows
      .map(row => row.values[metric.key])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    if (!numericValues.length) {
      map[metric.key] = null;
      return map;
    }

    map[metric.key] =
      metric.direction === "lower"
        ? Math.min(...numericValues)
        : Math.max(...numericValues);

    return map;
  }, {});

  return (
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Metric Table</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-[0.24em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                {rowLabel}
              </th>
              {metrics.map(metric => (
                <th
                  key={metric.key}
                  className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white"
                >
                  <div className="space-y-1">
                    <div>{metric.label}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {metric.direction === "lower" ? "Lower is better" : "Higher is better"}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.label}
                className={`border-t border-slate-200/70 dark:border-white/10 ${
                  row.featured ? "bg-sky-50/70 dark:bg-sky-500/5" : ""
                }`}
              >
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-slate-950 dark:text-white">
                      {row.label}
                    </div>
                    {row.tag ? (
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-slate-950">
                        {row.tag}
                      </span>
                    ) : null}
                  </div>
                  {row.note ? (
                    <div className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      {row.note}
                    </div>
                  ) : null}
                </td>
                {metrics.map(metric => {
                  const value = row.values[metric.key];
                  const isBest =
                    typeof value === "number" &&
                    bestValues[metric.key] !== null &&
                    value === bestValues[metric.key];

                  return (
                    <td key={metric.key} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-semibold ${
                          isBest
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                        }`}
                      >
                        {formatMetricValue(value, metric.format)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`mt-4 ${mdxMutedTextClass}`}>
        Best numeric values are highlighted automatically for each metric column.
      </p>
    </section>
  );
}

function formatMetricValue(
  value: string | number | undefined,
  format: MetricTableMetric["format"] = "number",
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value ?? "-");
  }

  switch (format) {
    case "percent": {
      const normalized = Math.abs(value) <= 1 ? value * 100 : value;
      return `${normalized.toFixed(2)}%`;
    }
    case "integer":
      return value.toFixed(0);
    case "bps": {
      const normalized = Math.abs(value) <= 1 ? value * 10000 : value;
      return `${normalized.toFixed(0)} bps`;
    }
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value);
    default:
      return Math.abs(value) >= 10 ? value.toFixed(2) : value.toFixed(3);
  }
}
