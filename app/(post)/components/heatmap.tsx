import {
  mdxEmptyStateClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type HeatmapProps = {
  title?: string;
  caption?: string;
  rows: string[];
  columns: string[];
  values: number[][];
  lowLabel?: string;
  highLabel?: string;
  format?: "number" | "percent";
};

export function Heatmap({
  title,
  caption,
  rows,
  columns,
  values,
  lowLabel = "Low",
  highLabel = "High",
  format = "number",
}: HeatmapProps) {
  const matrix = normalizeMatrix(values, rows.length, columns.length);
  const flat = matrix.flat().filter(Number.isFinite);

  if (!rows.length || !columns.length || !flat.length) {
    return <div className={mdxEmptyStateClass}>Add row labels, column labels, and numeric values to render the heatmap.</div>;
  }

  const min = Math.min(...flat);
  const max = Math.max(...flat);

  return (
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Heatmap</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <Legend lowLabel={lowLabel} highLabel={highLabel} />

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-separate border-spacing-2 text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.22em] text-slate-500">
                Row / Column
              </th>
              {columns.map(column => (
                <th
                  key={column}
                  className="px-3 py-2 text-left text-xs uppercase tracking-[0.22em] text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row}>
                <th className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-white">
                  {row}
                </th>
                {columns.map((column, columnIndex) => {
                  const value = matrix[rowIndex]?.[columnIndex] ?? 0;
                  const ratio = max === min ? 0.5 : (value - min) / (max - min);

                  return (
                    <td key={`${row}-${column}`} className="px-1 py-1">
                      <div
                        className="rounded-2xl px-3 py-4 text-center text-sm font-semibold shadow-sm"
                        style={{
                          backgroundColor: `hsl(215 ${60 + ratio * 20}% ${95 - ratio * 46}%)`,
                          color: ratio > 0.58 ? "#ffffff" : "#0f172a",
                        }}
                      >
                        {formatHeatmapValue(value, format)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Legend({ lowLabel, highLabel }: { lowLabel: string; highLabel: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-500">
      <span>{lowLabel}</span>
      <div className="h-3 w-40 rounded-full bg-gradient-to-r from-slate-100 via-sky-300 to-sky-700" />
      <span>{highLabel}</span>
    </div>
  );
}

function normalizeMatrix(values: number[][], rowCount: number, columnCount: number) {
  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: columnCount }, (_, columnIndex) => {
      const value = values[rowIndex]?.[columnIndex];
      return typeof value === "number" && Number.isFinite(value) ? value : 0;
    }),
  );
}

function formatHeatmapValue(value: number, format: "number" | "percent") {
  if (format === "percent") {
    return `${(Math.abs(value) <= 1 ? value * 100 : value).toFixed(1)}%`;
  }

  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2);
}
