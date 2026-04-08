import {
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
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
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Leaderboard</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-[0.24em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Rank
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Entry
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                {scoreLabel}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
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
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex min-w-[2.25rem] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                        rank === 1
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                          : rank === 2
                            ? "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                            : rank === 3
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                              : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
                      }`}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-950 dark:text-white">
                        {entry.label}
                      </div>
                      {entry.tag ? (
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-slate-950">
                          {entry.tag}
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
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                      {formatLeaderboardValue(entry.score, scoreFormat)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    <span className={buildDeltaClassName(entry.delta, higherIsBetter)}>
                      {formatDelta(entry.delta, scoreFormat)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
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
  higherIsBetter: boolean,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "text-slate-500 dark:text-slate-400";
  }

  const improved = higherIsBetter ? value >= 0 : value <= 0;

  return improved
    ? "font-semibold text-emerald-600 dark:text-emerald-300"
    : "font-semibold text-rose-600 dark:text-rose-300";
}
