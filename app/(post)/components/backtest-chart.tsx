import {
  mdxEmptyStateClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type BacktestChartProps = {
  title?: string;
  caption?: string;
  labels?: string[];
  equity: number[];
  benchmark?: number[];
  drawdown?: number[];
  strategyLabel?: string;
  benchmarkLabel?: string;
  height?: number;
};

export function BacktestChart({
  title,
  caption,
  labels = [],
  equity,
  benchmark = [],
  drawdown,
  strategyLabel = "Strategy",
  benchmarkLabel = "Benchmark",
  height = 360,
}: BacktestChartProps) {
  const hasEquity = equity.some(Number.isFinite);
  const hasBenchmark = benchmark.some(Number.isFinite);

  if (!hasEquity && !hasBenchmark) {
    return (
      <div className={mdxEmptyStateClass}>
        Add at least one equity curve to render the backtest chart.
      </div>
    );
  }

  const valueCount = Math.max(equity.length, benchmark.length, labels.length, 1);
  const normalizedLabels = Array.from(
    { length: valueCount },
    (_, index) => labels[index] ?? `${index + 1}`,
  );
  const normalizedDrawdown =
    drawdown && drawdown.length
      ? drawdown
      : computeDrawdown(equity);

  const width = 960;
  const padding = { top: 28, right: 24, bottom: 52, left: 58 };
  const topChartHeight = Math.max(170, height - 135);
  const bottomChartHeight = 88;
  const gap = 28;
  const innerWidth = width - padding.left - padding.right;
  const topInnerHeight = topChartHeight;
  const bottomTop = padding.top + topInnerHeight + gap;
  const bottomInnerHeight = bottomChartHeight;

  const equityValues = [...equity, ...benchmark].filter(Number.isFinite);
  const equityMin = Math.min(...equityValues);
  const equityMax = Math.max(...equityValues);
  const xStep = valueCount > 1 ? innerWidth / (valueCount - 1) : 0;
  const drawdownValues = normalizedDrawdown.filter(Number.isFinite);
  const drawdownMin = Math.min(...drawdownValues, -0.001);

  const strategyPoints = buildSeriesPoints(
    equity,
    valueCount,
    innerWidth,
    padding.left,
    xStep,
    padding.top,
    topInnerHeight,
    equityMin,
    equityMax,
  );
  const benchmarkPoints = buildSeriesPoints(
    benchmark,
    valueCount,
    innerWidth,
    padding.left,
    xStep,
    padding.top,
    topInnerHeight,
    equityMin,
    equityMax,
  );
  const drawdownPoints = buildSeriesPoints(
    normalizedDrawdown,
    valueCount,
    innerWidth,
    padding.left,
    xStep,
    bottomTop,
    bottomInnerHeight,
    drawdownMin,
    0,
  );

  return (
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Backtest</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <LegendPill color="#2563eb" label={strategyLabel} />
        {benchmark.length ? <LegendPill color="#0f766e" label={benchmarkLabel} /> : null}
        <LegendPill color="#dc2626" label="Drawdown" />
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${bottomTop + bottomInnerHeight + padding.bottom}`}
          className="min-w-[720px] w-full"
          role="img"
          aria-label={title || "Backtest chart"}
        >
          {buildTicks(equityMin, equityMax, 4).map(value => {
            const y = scaleY(value, equityMin, equityMax, topInnerHeight, padding.top);
            return (
              <g key={`equity-${value}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(148,163,184,0.18)"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {formatNumber(value)}
                </text>
              </g>
            );
          })}

          <text
            x={padding.left}
            y={padding.top - 10}
            fontSize="11"
            fill="#64748b"
            letterSpacing="0.18em"
          >
            Equity Curve
          </text>

          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={strategyPoints.map(point => `${point.x},${point.y}`).join(" ")}
          />

          {benchmarkPoints.length ? (
            <polyline
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={benchmarkPoints.map(point => `${point.x},${point.y}`).join(" ")}
            />
          ) : null}

          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={bottomTop}
            y2={bottomTop}
            stroke="rgba(15,23,42,0.22)"
          />

          <text
            x={padding.left}
            y={bottomTop - 10}
            fontSize="11"
            fill="#64748b"
            letterSpacing="0.18em"
          >
            Drawdown
          </text>

          <path
            d={buildAreaPath(
              drawdownPoints,
              scaleY(0, drawdownMin, 0, bottomInnerHeight, bottomTop),
            )}
            fill="rgba(220,38,38,0.18)"
            stroke="#dc2626"
            strokeWidth="2"
          />

          {buildTicks(drawdownMin, 0, 3).map(value => {
            const y = scaleY(value, drawdownMin, 0, bottomInnerHeight, bottomTop);
            return (
              <g key={`drawdown-${value}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(248,113,113,0.16)"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {formatPercent(value)}
                </text>
              </g>
            );
          })}

          {normalizedLabels.map((label, index) => {
            const x = padding.left + (valueCount > 1 ? xStep * index : innerWidth / 2);
            return (
              <text
                key={`${label}-${index}`}
                x={x}
                y={bottomTop + bottomInnerHeight + 28}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

function computeDrawdown(equity: number[]) {
  let peak = Number.NEGATIVE_INFINITY;

  return equity.map(value => {
    if (!Number.isFinite(value)) {
      return 0;
    }

    peak = Math.max(peak, value);
    if (peak <= 0) {
      return 0;
    }

    return value / peak - 1;
  });
}

function buildSeriesPoints(
  data: number[],
  valueCount: number,
  innerWidth: number,
  offsetLeft: number,
  xStep: number,
  offsetTop: number,
  innerHeight: number,
  min: number,
  max: number,
) {
  return data
    .map((value, index) => {
      if (!Number.isFinite(value)) {
        return null;
      }

      return {
        x: offsetLeft + (valueCount > 1 ? xStep * index : innerWidth / 2),
        y: scaleY(value, min, max, innerHeight, offsetTop),
      };
    })
    .filter((point): point is { x: number; y: number } => point !== null);
}

function buildAreaPath(points: { x: number; y: number }[], baselineY: number) {
  if (!points.length) {
    return "";
  }

  const first = points[0];
  const last = points[points.length - 1];
  const strokePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return `${strokePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

function buildTicks(min: number, max: number, count: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return [min || 0, max || 0].filter((value, index, values) => values.indexOf(value) === index);
  }

  return Array.from({ length: count }, (_, index) => {
    const ratio = index / Math.max(count - 1, 1);
    return max - (max - min) * ratio;
  });
}

function scaleY(
  value: number,
  min: number,
  max: number,
  innerHeight: number,
  offsetTop: number,
) {
  const ratio = (value - min) / Math.max(max - min, Number.EPSILON);
  return offsetTop + innerHeight - ratio * innerHeight;
}

function formatNumber(value: number) {
  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2);
}

function formatPercent(value: number) {
  const normalized = Math.abs(value) <= 1.5 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
}
