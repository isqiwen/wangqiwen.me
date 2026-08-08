import { mdxEmptyStateClass, mdxMutedTextClass } from "./surface";

export type ScatterPlotPoint = {
  x: number;
  y: number;
  label?: string;
  radius?: number;
};

export type ScatterPlotSeries = {
  label: string;
  points: ScatterPlotPoint[];
  color?: string;
};

type ScatterPlotProps = {
  id?: string;
  title?: string;
  description?: string;
  caption?: string;
  series: ScatterPlotSeries[];
  xLabel?: string;
  yLabel?: string;
  xFormat?: "number" | "percent";
  yFormat?: "number" | "percent";
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  height?: number;
};

const COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#db2777"];

export function ScatterPlot({
  id,
  title,
  description,
  caption,
  series,
  xLabel,
  yLabel,
  xFormat = "number",
  yFormat = "number",
  minX,
  maxX,
  minY,
  maxY,
  height = 360,
}: ScatterPlotProps) {
  const normalizedSeries = series
    .map((entry, index) => ({
      ...entry,
      color: entry.color ?? COLORS[index % COLORS.length],
      points: entry.points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y)),
    }))
    .filter(entry => entry.points.length);

  if (!normalizedSeries.length) {
    return <div className={mdxEmptyStateClass}>Add at least one finite x/y point to render a scatter plot.</div>;
  }

  const points = normalizedSeries.flatMap(entry => entry.points);
  const xDomain = buildDomain(points.map(point => point.x), minX, maxX);
  const yDomain = buildDomain(points.map(point => point.y), minY, maxY);
  const width = 960;
  const padding = { top: 28, right: 28, bottom: xLabel ? 72 : 52, left: yLabel ? 76 : 58 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xTicks = buildTicks(xDomain.min, xDomain.max, 5);
  const yTicks = buildTicks(yDomain.min, yDomain.max, 5);

  return (
    <figure id={id} data-reference-kind={id ? "chart" : undefined} className="my-10 scroll-mt-24">
      {title || description ? (
        <div className="mb-5">
          {title ? <p className="font-semibold text-slate-950 dark:text-white">{title}</p> : null}
          {description ? <p className={`mt-2 ${mdxMutedTextClass}`}>{description}</p> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        {normalizedSeries.map(entry => (
          <div key={entry.label} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.label}
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[600px] w-full" role="img" aria-label={title || "Scatter plot"}>
          {yTicks.map(tick => {
            const y = scale(tick, yDomain.min, yDomain.max, innerHeight, padding.top, true);
            return (
              <g key={`y-${tick}`}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(148,163,184,0.22)" strokeDasharray="4 6" />
                <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{formatTick(tick, yFormat)}</text>
              </g>
            );
          })}
          {xTicks.map(tick => {
            const x = scale(tick, xDomain.min, xDomain.max, innerWidth, padding.left);
            return (
              <g key={`x-${tick}`}>
                <line x1={x} x2={x} y1={padding.top} y2={height - padding.bottom} stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />
                <text x={x} y={height - 18} textAnchor="middle" fontSize="11" fill="#64748b">{formatTick(tick, xFormat)}</text>
              </g>
            );
          })}
          {normalizedSeries.flatMap(entry =>
            entry.points.map((point, index) => (
              <circle
                key={`${entry.label}-${point.label || index}`}
                cx={scale(point.x, xDomain.min, xDomain.max, innerWidth, padding.left)}
                cy={scale(point.y, yDomain.min, yDomain.max, innerHeight, padding.top, true)}
                r={Math.min(10, Math.max(3, point.radius ?? 4.5))}
                fill={entry.color}
                fillOpacity="0.75"
                stroke="#ffffff"
                strokeWidth="1.5"
              >
                {point.label ? <title>{point.label}</title> : null}
              </circle>
            ))
          )}
          {xLabel ? <text x={padding.left + innerWidth / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">{xLabel}</text> : null}
          {yLabel ? <text x="16" y={padding.top + innerHeight / 2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90 16 ${padding.top + innerHeight / 2})`}>{yLabel}</text> : null}
        </svg>
      </div>

      {caption ? <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption> : null}
    </figure>
  );
}

function buildDomain(values: number[], min?: number, max?: number) {
  const rawMin = min ?? Math.min(...values);
  const rawMax = max ?? Math.max(...values);
  if (min != null && max != null) return { min, max };
  if (rawMin === rawMax) return { min: min ?? rawMin - 1, max: max ?? rawMax + 1 };
  const padding = (rawMax - rawMin) * 0.06;
  return { min: min ?? rawMin - padding, max: max ?? rawMax + padding };
}

function buildTicks(min: number, max: number, count: number) {
  return Array.from({ length: count }, (_, index) => max - ((max - min) * index) / Math.max(count - 1, 1));
}

function scale(value: number, min: number, max: number, size: number, offset: number, invert = false) {
  const ratio = (value - min) / Math.max(max - min, Number.EPSILON);
  return invert ? offset + size - ratio * size : offset + ratio * size;
}

function formatTick(value: number, format: "number" | "percent") {
  if (format === "percent") return `${(value * 100).toFixed(0)}%`;
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
