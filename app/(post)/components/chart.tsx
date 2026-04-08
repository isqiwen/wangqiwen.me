import { mdxEmptyStateClass, mdxMutedTextClass, mdxPanelClass, mdxSubtleTextClass } from "./surface";

type ChartSeries = {
  label: string;
  data: number[];
  color?: string;
  type?: "line" | "area" | "bar";
};

type ChartProps = {
  title?: string;
  description?: string;
  caption?: string;
  xLabels?: string[];
  series: ChartSeries[];
  height?: number;
  yFormat?: "number" | "percent";
  min?: number;
  max?: number;
};

const DEFAULT_COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#db2777"];

export function Chart({
  title,
  description,
  caption,
  xLabels = [],
  series,
  height = 320,
  yFormat = "number",
  min,
  max,
}: ChartProps) {
  const normalizedSeries = series
    .filter(entry => entry.data.some(value => Number.isFinite(value)))
    .map((entry, index) => ({
      ...entry,
      type: entry.type ?? "line",
      color: entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));

  if (!normalizedSeries.length) {
    return <div className={mdxEmptyStateClass}>Add at least one numeric series to render a chart.</div>;
  }

  const valueCount = Math.max(
    xLabels.length,
    ...normalizedSeries.map(entry => entry.data.length),
    1,
  );
  const labels = Array.from({ length: valueCount }, (_, index) => xLabels[index] ?? `${index + 1}`);
  const flatValues = normalizedSeries.flatMap(entry => entry.data.filter(Number.isFinite));
  const containsBarSeries = normalizedSeries.some(entry => entry.type === "bar");
  const rawMin = min ?? Math.min(...flatValues);
  const rawMax = max ?? Math.max(...flatValues);
  const domainMin =
    min ?? (containsBarSeries ? Math.min(0, rawMin) : rawMin === rawMax ? rawMin - 1 : rawMin);
  const domainMax = max ?? (rawMin === rawMax ? rawMax + 1 : rawMax);
  const width = 960;
  const padding = { top: 28, right: 24, bottom: 52, left: 58 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const zeroLineY = scaleY(Math.max(domainMin, Math.min(domainMax, 0)), domainMin, domainMax, innerHeight, padding.top);
  const barSeries = normalizedSeries.filter(entry => entry.type === "bar");
  const nonBarSeries = normalizedSeries.filter(entry => entry.type !== "bar");
  const useCenteredXPositions = containsBarSeries;
  const xStep = valueCount > 1 ? innerWidth / (valueCount - 1) : 0;
  const columnWidth = valueCount > 0 ? innerWidth / valueCount : innerWidth;
  const groupedBarWidth = Math.min(columnWidth * 0.72, 56);
  const singleBarWidth = barSeries.length ? groupedBarWidth / Math.max(barSeries.length, 1) : groupedBarWidth;
  const yTicks = buildTicks(domainMin, domainMax, 5);

  return (
    <section className={mdxPanelClass}>
      {(title || description) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Chart</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
          ) : null}
          {description ? <p className={mdxMutedTextClass}>{description}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {normalizedSeries.map(entry => (
          <div
            key={entry.label}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.label}
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[720px] w-full"
          role="img"
          aria-label={title || "Chart"}
        >
          {yTicks.map(tick => {
            const y = scaleY(tick, domainMin, domainMax, innerHeight, padding.top);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(148,163,184,0.22)"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {formatTick(tick, yFormat)}
                </text>
              </g>
            );
          })}

          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={zeroLineY}
            y2={zeroLineY}
            stroke="rgba(15,23,42,0.22)"
          />

          {labels.map((label, index) => {
            const x = getXPosition(
              index,
              valueCount,
              innerWidth,
              padding.left,
              useCenteredXPositions,
            );
            return (
              <text
                key={`${label}-${index}`}
                x={x}
                y={height - 18}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {label}
              </text>
            );
          })}

          {barSeries.map((entry, seriesIndex) =>
            entry.data.map((value, pointIndex) => {
              if (!Number.isFinite(value)) {
                return null;
              }

              const groupCenter =
                getXPosition(pointIndex, valueCount, innerWidth, padding.left, true);
              const x =
                groupCenter -
                groupedBarWidth / 2 +
                singleBarWidth * seriesIndex +
                1.5;
              const y = scaleY(value, domainMin, domainMax, innerHeight, padding.top);
              const barHeight = Math.max(1.5, Math.abs(zeroLineY - y));
              const top = value >= 0 ? y : zeroLineY;

              return (
                <rect
                  key={`${entry.label}-${pointIndex}`}
                  x={x}
                  y={top}
                  width={Math.max(singleBarWidth - 3, 6)}
                  height={barHeight}
                  rx="6"
                  fill={entry.color}
                  opacity={0.82}
                />
              );
            }),
          )}

          {nonBarSeries.map(entry => {
            const points = buildPoints(
              entry.data,
              valueCount,
                  innerWidth,
                  innerHeight,
                  padding.left,
                  padding.top,
                  domainMin,
                  domainMax,
                  useCenteredXPositions,
                );

            if (!points.length) {
              return null;
            }

            const pointList = points.map(point => `${point.x},${point.y}`).join(" ");
            const areaPath = buildAreaPath(points, zeroLineY);

            return (
              <g key={entry.label}>
                {entry.type === "area" ? (
                  <path d={areaPath} fill={entry.color} opacity={0.16} />
                ) : null}
                <polyline
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointList}
                />
                {points.map(point => (
                  <circle
                    key={`${entry.label}-${point.x}`}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {caption ? <p className={`mt-4 ${mdxMutedTextClass}`}>{caption}</p> : null}
    </section>
  );
}

function buildTicks(min: number, max: number, count: number) {
  if (min === max) {
    return [min];
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

function buildPoints(
  data: number[],
  valueCount: number,
  innerWidth: number,
  innerHeight: number,
  offsetLeft: number,
  offsetTop: number,
  min: number,
  max: number,
  centerSteps: boolean,
) {
  return data
    .map((value, index) => {
      if (!Number.isFinite(value)) {
        return null;
      }

      return {
        x: getXPosition(index, valueCount, innerWidth, offsetLeft, centerSteps),
        y: scaleY(value, min, max, innerHeight, offsetTop),
      };
    })
    .filter((point): point is { x: number; y: number } => point !== null);
}

function getXPosition(
  index: number,
  valueCount: number,
  innerWidth: number,
  offsetLeft: number,
  centered: boolean,
) {
  if (centered) {
    const columnWidth = valueCount > 0 ? innerWidth / valueCount : innerWidth;
    return offsetLeft + columnWidth * index + columnWidth / 2;
  }

  if (valueCount > 1) {
    return offsetLeft + (innerWidth / (valueCount - 1)) * index;
  }

  return offsetLeft + innerWidth / 2;
}

function buildAreaPath(points: { x: number; y: number }[], baselineY: number) {
  if (!points.length) {
    return "";
  }

  const first = points[0];
  const last = points[points.length - 1];
  const curve = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return `${curve} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

function formatTick(value: number, yFormat: "number" | "percent") {
  if (yFormat === "percent") {
    return `${(value * 100).toFixed(0)}%`;
  }

  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2);
}
