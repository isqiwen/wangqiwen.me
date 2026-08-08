import { mdxEmptyStateClass, mdxMutedTextClass } from "./surface";

export type HistogramBin = {
  label: string;
  count: number;
};

type HistogramProps = {
  id?: string;
  title?: string;
  description?: string;
  caption?: string;
  bins: HistogramBin[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
};

export function Histogram({
  id,
  title,
  description,
  caption,
  bins,
  xLabel,
  yLabel = "Count",
  color = "#2563eb",
  height = 340,
}: HistogramProps) {
  const usableBins = bins.filter(bin => bin.label.trim() && Number.isFinite(bin.count) && bin.count >= 0);
  if (!usableBins.length) {
    return <div className={mdxEmptyStateClass}>Add at least one labeled, non-negative bin to render a histogram.</div>;
  }

  const width = 960;
  const padding = { top: 28, right: 24, bottom: xLabel ? 72 : 52, left: yLabel ? 64 : 54 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxCount = Math.max(...usableBins.map(bin => bin.count), 1);
  const domainMax = maxCount === 1 ? 1 : maxCount;
  const yTicks = Array.from({ length: 5 }, (_, index) => domainMax - (domainMax * index) / 4);
  const barWidth = innerWidth / usableBins.length;

  return (
    <figure id={id} data-reference-kind={id ? "chart" : undefined} className="my-10 scroll-mt-24">
      {title || description ? (
        <div className="mb-5">
          {title ? <p className="font-semibold text-slate-950 dark:text-white">{title}</p> : null}
          {description ? <p className={`mt-2 ${mdxMutedTextClass}`}>{description}</p> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[600px] w-full" role="img" aria-label={title || "Histogram"}>
          {yTicks.map(tick => {
            const y = padding.top + innerHeight - (tick / domainMax) * innerHeight;
            return (
              <g key={tick}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(148,163,184,0.22)" strokeDasharray="4 6" />
                <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{tick.toFixed(0)}</text>
              </g>
            );
          })}
          {usableBins.map((bin, index) => {
            const barHeight = (bin.count / domainMax) * innerHeight;
            const x = padding.left + index * barWidth;
            const y = padding.top + innerHeight - barHeight;
            return (
              <g key={bin.label}>
                <rect x={x + 1} y={y} width={Math.max(1, barWidth - 2)} height={barHeight} fill={color} opacity="0.82" />
                <text x={x + barWidth / 2} y={height - 18} textAnchor="middle" fontSize="11" fill="#64748b">{bin.label}</text>
              </g>
            );
          })}
          {xLabel ? <text x={padding.left + innerWidth / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">{xLabel}</text> : null}
          {yLabel ? <text x="16" y={padding.top + innerHeight / 2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90 16 ${padding.top + innerHeight / 2})`}>{yLabel}</text> : null}
        </svg>
      </div>
      {caption ? <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption> : null}
    </figure>
  );
}
