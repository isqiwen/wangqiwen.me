import {
  mdxEmptyStateClass,
  mdxMutedTextClass,
} from "./surface";

type ConfusionMatrixProps = {
  title?: string;
  caption?: string;
  labels: string[];
  values: number[][];
  normalize?: boolean;
};

export function ConfusionMatrix({
  title,
  caption,
  labels,
  values,
  normalize = true,
}: ConfusionMatrixProps) {
  const matrix = normalizeMatrix(values, labels.length);
  const displayMatrix = normalize ? normalizeRows(matrix) : matrix;
  const flat = displayMatrix.flat().filter(Number.isFinite);

  if (!labels.length || !flat.length) {
    return <div className={mdxEmptyStateClass}>Add class labels and matrix values to render the confusion matrix.</div>;
  }

  const max = Math.max(...flat, 0.0001);

  return (
    <figure className="my-10">
      {title ? (
        <div className="mb-5">
          <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.22em] text-slate-500">
                Actual / Predicted
              </th>
              {labels.map(label => (
                <th
                  key={`pred-${label}`}
                  className="px-3 py-2 text-left text-xs uppercase tracking-[0.22em] text-slate-500"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((rowLabel, rowIndex) => (
              <tr key={`row-${rowLabel}`}>
                <th scope="row" className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-white">
                  {rowLabel}
                </th>
                {labels.map((columnLabel, columnIndex) => {
                  const value = displayMatrix[rowIndex]?.[columnIndex] ?? 0;
                  const ratio = value / max;
                  const isDiagonal = rowIndex === columnIndex;

                  return (
                    <td key={`${rowLabel}-${columnLabel}`} className="border border-white/70 p-0.5 dark:border-slate-950">
                      <div
                        className="px-3 py-3 text-center text-sm font-semibold tabular-nums"
                        style={{
                          backgroundColor: isDiagonal
                            ? `hsl(145 ${55 + ratio * 20}% ${95 - ratio * 42}%)`
                            : `hsl(210 ${30 + ratio * 25}% ${97 - ratio * 38}%)`,
                          color: ratio > 0.58 ? "#ffffff" : "#0f172a",
                          boxShadow: isDiagonal
                            ? "inset 0 0 0 1px rgba(22,163,74,0.28)"
                            : "inset 0 0 0 1px rgba(100,116,139,0.14)",
                        }}
                      >
                        {normalize ? `${(value * 100).toFixed(1)}%` : value.toFixed(0)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption> : null}
    </figure>
  );
}

function normalizeMatrix(values: number[][], size: number) {
  return Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, columnIndex) => {
      const value = values[rowIndex]?.[columnIndex];
      return typeof value === "number" && Number.isFinite(value) ? value : 0;
    }),
  );
}

function normalizeRows(matrix: number[][]) {
  return matrix.map(row => {
    const sum = row.reduce((total, value) => total + value, 0);
    if (!sum) {
      return row.map(() => 0);
    }

    return row.map(value => value / sum);
  });
}
