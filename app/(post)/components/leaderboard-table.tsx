import {
  mdxDataTableFrameClass,
  mdxDataTableHeadClass,
  mdxMutedTextClass,
} from "./surface";

type LeaderboardEntry = {
  label: string;
  score: number | string;
  delta?: number | string;
  tag?: string;
  secondary?: string;
  note?: string;
};

type LeaderboardTableProps = {
  title?: string;
  caption?: string;
  scoreLabel?: string;
  deltaLabel?: string;
  scoreFormat?: "number" | "percent" | "integer" | "bps" | "currency";
  higherIsBetter?: boolean;
  entries: LeaderboardEntry[];
};

export function LeaderboardTable({
  title,
  caption,
  scoreLabel = "Score",
  deltaLabel = "Delta",
  scoreFormat = "number",
  higherIsBetter = true,
  entries,
}: LeaderboardTableProps) {
  const rankedEntries = [...entries].sort((left, right) =>
    compareScores(left.score, right.score, higherIsBetter),
  );

  return (
    <figure className="my-10">
      {title ? (
        <div className="mb-5">
          <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        </div>
      ) : null}

      <div className={mdxDataTableFrameClass}>
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className={mdxDataTableHeadClass}>
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Rank
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Entry
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                {scoreLabel}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                {deltaLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rankedEntries.map((entry, index) => {
              const rank = index + 1;

              return (
                <tr
                  key={`${entry.label}-${rank}`}
                  className="border-t border-slate-200/70 dark:border-white/10"
                >
                  <td className="px-4 py-3 font-mono text-sm tabular-nums text-slate-500 dark:text-slate-400">
                    {rank}
                  </td>
                  <th scope="row" className="px-4 py-3 text-left text-slate-700 dark:text-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-950 dark:text-white">
                        {entry.label}
                      </div>
                      {entry.tag ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          ({entry.tag})
                        </span>
                      ) : null}
                    </div>
                    {entry.secondary ? (
                      <div className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                        {entry.secondary}
                      </div>
                    ) : null}
                    {entry.note ? (
                      <div className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                        {entry.note}
                      </div>
                    ) : null}
                  </th>
                  <td className={`px-4 py-3 tabular-nums ${rank === 1 ? "font-semibold text-slate-950 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>
                    <span>
                      {formatLeaderboardValue(entry.score, scoreFormat)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    <span className={buildDeltaClassName(entry.delta)}>
                      {formatDelta(entry.delta, scoreFormat)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {caption ? <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption> : null}
    </figure>
  );
}

function compareScores(
  left: string | number,
  right: string | number,
  higherIsBetter: boolean,
) {
  if (typeof left === "number" && typeof right === "number") {
    return higherIsBetter ? right - left : left - right;
  }

  return String(left).localeCompare(String(right));
}

function formatLeaderboardValue(
  value: string | number,
  format: NonNullable<LeaderboardTableProps["scoreFormat"]>,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value);
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

function formatDelta(
  value: string | number | undefined,
  format: NonNullable<LeaderboardTableProps["scoreFormat"]>,
) {
  if (value === undefined) {
    return "—";
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value);
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatLeaderboardValue(value, format)}`;
}

function buildDeltaClassName(
  value: string | number | undefined,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "text-slate-500 dark:text-slate-400";
  }

  return "font-medium tabular-nums text-slate-700 dark:text-slate-200";
}
