import { mdxEmptyStateClass, mdxMutedTextClass } from "./surface";

export type BoxPlotItem = {
  label: string;
  lowerWhisker: number;
  q1: number;
  median: number;
  q3: number;
  upperWhisker: number;
  color?: string;
};

type BoxPlotProps = {
  id?: string;
  title?: string;
  description?: string;
  caption?: string;
  items: BoxPlotItem[];
  yLabel?: string;
  yFormat?: "number" | "percent";
  min?: number;
  max?: number;
  height?: number;
};

const COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#db2777"];

export function BoxPlot({
  id,
  title,
  description,
  caption,
  items,
  yLabel,
  yFormat = "number",
  min,
  max,
  height = 360,
}: BoxPlotProps) {
  const usableItems = items.filter(item => [item.lowerWhisker, item.q1, item.median, item.q3, item.upperWhisker].every(Number.isFinite));
  if (!usableItems.length) {
    return <div className={mdxEmptyStateClass}>Add at least one five-number summary to render a box plot.</div>;
  }

  const allValues = usableItems.flatMap(item => [item.lowerWhisker, item.q1, item.median, item.q3, item.upperWhisker]);
  const rawMin = min ?? Math.min(...allValues);
  const rawMax = max ?? Math.max(...allValues);
  const paddingValue = rawMin === rawMax ? 1 : (rawMax - rawMin) * 0.06;
  const domainMin = min ?? rawMin - paddingValue;
  const domainMax = max ?? rawMax + paddingValue;
  const width = 960;
  const padding = { top: 28, right: 28, bottom: 58, left: yLabel ? 76 : 58 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const yTicks = Array.from({ length: 5 }, (_, index) => domainMax - ((domainMax - domainMin) * index) / 4);
  const columnWidth = innerWidth / usableItems.length;
  const boxWidth = Math.min(74, columnWidth * 0.48);

  return (
    <figure id={id} data-reference-kind={id ? "chart" : undefined} className="my-10 scroll-mt-24">
      {title || description ? (
        <div className="mb-5">
          {title ? <p className="font-semibold text-slate-950 dark:text-white">{title}</p> : null}
          {description ? <p className={`mt-2 ${mdxMutedTextClass}`}>{description}</p> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[600px] w-full" role="img" aria-label={title || "Box plot"}>
          {yTicks.map(tick => {
            const y = scaleY(tick, domainMin, domainMax, innerHeight, padding.top);
            return (
              <g key={tick}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(148,163,184,0.22)" strokeDasharray="4 6" />
                <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{formatTick(tick, yFormat)}</text>
              </g>
            );
          })}
          {usableItems.map((item, index) => {
            const center = padding.left + columnWidth * index + columnWidth / 2;
            const color = item.color ?? COLORS[index % COLORS.length];
            const lower = scaleY(item.lowerWhisker, domainMin, domainMax, innerHeight, padding.top);
            const q1 = scaleY(item.q1, domainMin, domainMax, innerHeight, padding.top);
            const median = scaleY(item.median, domainMin, domainMax, innerHeight, padding.top);
            const q3 = scaleY(item.q3, domainMin, domainMax, innerHeight, padding.top);
            const upper = scaleY(item.upperWhisker, domainMin, domainMax, innerHeight, padding.top);
            return (
              <g key={item.label}>
                <line x1={center} x2={center} y1={upper} y2={lower} stroke={color} strokeWidth="2" />
                <line x1={center - boxWidth * 0.24} x2={center + boxWidth * 0.24} y1={upper} y2={upper} stroke={color} strokeWidth="2" />
                <line x1={center - boxWidth * 0.24} x2={center + boxWidth * 0.24} y1={lower} y2={lower} stroke={color} strokeWidth="2" />
                <rect x={center - boxWidth / 2} y={Math.min(q1, q3)} width={boxWidth} height={Math.max(1, Math.abs(q1 - q3))} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
                <line x1={center - boxWidth / 2} x2={center + boxWidth / 2} y1={median} y2={median} stroke={color} strokeWidth="3" />
                <text x={center} y={height - 18} textAnchor="middle" fontSize="11" fill="#64748b">{item.label}</text>
              </g>
            );
          })}
          {yLabel ? <text x="16" y={padding.top + innerHeight / 2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90 16 ${padding.top + innerHeight / 2})`}>{yLabel}</text> : null}
        </svg>
      </div>
      {caption ? <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption> : null}
    </figure>
  );
}

function scaleY(value: number, min: number, max: number, innerHeight: number, offsetTop: number) {
  const ratio = (value - min) / Math.max(max - min, Number.EPSILON);
  return offsetTop + innerHeight - ratio * innerHeight;
}

function formatTick(value: number, format: "number" | "percent") {
  if (format === "percent") return `${(value * 100).toFixed(0)}%`;
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
