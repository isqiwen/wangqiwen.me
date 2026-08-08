import {
  mdxDataTableFrameClass,
  mdxDataTableHeadClass,
  mdxMutedTextClass,
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
    <figure className="my-10">
      {title ? (
        <div className="mb-5">
          <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        </div>
      ) : null}

      <div className={mdxDataTableFrameClass}>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className={mdxDataTableHeadClass}>
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                {rowLabel}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-slate-950 dark:text-white">
                      {row.label}
                    </div>
                    {row.tag ? (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        ({row.tag})
                      </span>
                    ) : null}
                  </div>
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
                      <span
                        className={`tabular-nums ${
                          isBest
                            ? "font-semibold text-slate-950 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
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

      {(caption || metrics.some(metric => metric.direction)) ? (
        <figcaption className={`mt-4 ${mdxMutedTextClass}`}>
          {caption ? `${caption} ` : ""}
          {metrics.some(metric => metric.direction)
            ? "Bold values are best within their metric column."
            : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

function formatMetricHeading(
  label: string,
  direction: MetricTableMetric["direction"],
) {
  if (!direction || /[↑↓]/.test(label)) {
    return label;
  }

  return `${label} ${direction === "lower" ? "↓" : "↑"}`;
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
