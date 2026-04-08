import { mdxMutedTextClass, mdxPanelClass, mdxSubtleTextClass } from "./surface";

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
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Ablation Study</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-[0.24em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                {variantLabel}
              </th>
              {metrics.map(metric => (
                <th
                  key={metric.key}
                  className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white"
                >
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.label}
                className="border-t border-slate-200/70 dark:border-white/10"
              >
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  <div className="font-semibold text-slate-950 dark:text-white">{row.label}</div>
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
                        className={
                          isBest
                            ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : undefined
                        }
                      >
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

      <p className={`mt-4 ${mdxMutedTextClass}`}>Best values are highlighted automatically.</p>
    </section>
  );
}
