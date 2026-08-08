import {
  mdxEmptyStateClass,
  mdxMutedTextClass,
} from "./surface";

export type ChartInterval = {
  /** Lower and upper bounds must align with the series data by index. */
  lower: number[];
  upper: number[];
  /** Lines default to a confidence band; bars default to error bars. */
  display?: "band" | "bars";
  /** For example, "95% CI" or "bootstrap interval". */
  label?: string;
};

export type ChartSeries = {
  label: string;
  data: number[];
  color?: string;
  type?: "line" | "area" | "bar";
  interval?: ChartInterval;
};

type ChartProps = {
  id?: string;
  title?: string;
  description?: string;
  caption?: string;
  xLabels?: string[];
  series: ChartSeries[];
  height?: number;
  yFormat?: "number" | "percent";
  min?: number;
  max?: number;
  /** Bar series are grouped by default; use stacked only for compositional totals. */
  barMode?: "grouped" | "stacked";
};

const DEFAULT_COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#db2777"];

export function Chart({
  id,
  title,
  description,
  caption,
  xLabels = [],
  series,
  height = 320,
  yFormat = "number",
  min,
  max,
  barMode = "grouped",
}: ChartProps) {
  const normalizedSeries = series
    .filter(entry => entry.data.some(value => Number.isFinite(value)))
    .map((entry, index) => ({
      ...entry,
      type: entry.type ?? "line",
      color: entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));

  if (!normalizedSeries.length) {
    return (
      <div className={mdxEmptyStateClass}>
        Add at least one numeric series to render a chart.
      </div>
    );
  }

  const valueCount = Math.max(
    xLabels.length,
    ...normalizedSeries.map(entry => entry.data.length),
    1
  );
  const labels = Array.from(
    { length: valueCount },
    (_, index) => xLabels[index] ?? `${index + 1}`
  );
  const containsBarSeries = normalizedSeries.some(
    entry => entry.type === "bar"
  );
  const barSeries = normalizedSeries.filter(entry => entry.type === "bar");
  const nonBarSeries = normalizedSeries.filter(entry => entry.type !== "bar");
  const stackedBarSegments =
    barMode === "stacked"
      ? buildStackedBarSegments(barSeries, valueCount)
      : [];
  const flatValues = [
    ...nonBarSeries.flatMap(entry => [
      ...entry.data.filter(Number.isFinite),
      ...(entry.interval?.lower.filter(Number.isFinite) ?? []),
      ...(entry.interval?.upper.filter(Number.isFinite) ?? []),
    ]),
    ...(barMode === "stacked"
      ? stackedBarSegments.flatMap(segment => [segment.start, segment.end])
      : barSeries.flatMap(entry => [
          ...entry.data.filter(Number.isFinite),
          ...(entry.interval?.lower.filter(Number.isFinite) ?? []),
          ...(entry.interval?.upper.filter(Number.isFinite) ?? []),
        ])),
  ];
  const rawMin = min ?? Math.min(...flatValues);
  const rawMax = max ?? Math.max(...flatValues);
  const domainMin =
    min ??
    (containsBarSeries
      ? Math.min(0, rawMin)
      : rawMin === rawMax
      ? rawMin - 1
      : rawMin);
  const domainMax = max ?? (rawMin === rawMax ? rawMax + 1 : rawMax);
  const width = 960;
  const padding = { top: 28, right: 24, bottom: 52, left: 58 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const zeroLineY = scaleY(
    Math.max(domainMin, Math.min(domainMax, 0)),
    domainMin,
    domainMax,
    innerHeight,
    padding.top
  );
  const useCenteredXPositions = containsBarSeries;
  const xStep = valueCount > 1 ? innerWidth / (valueCount - 1) : 0;
  const columnWidth = valueCount > 0 ? innerWidth / valueCount : innerWidth;
  const groupedBarWidth = Math.min(columnWidth * 0.72, 56);
  const singleBarWidth = barSeries.length
    ? groupedBarWidth / Math.max(barSeries.length, 1)
    : groupedBarWidth;
  const yTicks = buildTicks(domainMin, domainMax, 5);

  return (
    <figure
      id={id}
      data-reference-kind={id ? "chart" : undefined}
      className="my-10 scroll-mt-24"
    >
      {title || description ? (
        <div className="mb-5">
          {title ? <p className="font-semibold text-slate-950 dark:text-white">{title}</p> : null}
          {description ? <p className={`mt-2 ${mdxMutedTextClass}`}>{description}</p> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        {normalizedSeries.map(entry => (
          <div
            key={entry.label}
            className="inline-flex items-center gap-2"
          >
            <span
              className="h-0.5 w-5"
              style={{ backgroundColor: entry.color }}
            />
            <span>
              {entry.label}
              {entry.interval?.label ? ` (${entry.interval.label})` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[600px] w-full"
          role="img"
          aria-label={title || "Chart"}
        >
          {yTicks.map(tick => {
            const y = scaleY(
              tick,
              domainMin,
              domainMax,
              innerHeight,
              padding.top
            );
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
              useCenteredXPositions
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

          {barMode === "stacked"
            ? stackedBarSegments.map(segment => {
                const center = getXPosition(
                  segment.index,
                  valueCount,
                  innerWidth,
                  padding.left,
                  true
                );
                const startY = scaleY(
                  segment.start,
                  domainMin,
                  domainMax,
                  innerHeight,
                  padding.top
                );
                const endY = scaleY(
                  segment.end,
                  domainMin,
                  domainMax,
                  innerHeight,
                  padding.top
                );

                return (
                  <rect
                    key={`${segment.label}-${segment.index}`}
                    x={center - groupedBarWidth / 2}
                    y={Math.min(startY, endY)}
                    width={groupedBarWidth}
                    height={Math.max(1.5, Math.abs(startY - endY))}
                    rx="4"
                    fill={segment.color}
                    opacity={0.82}
                  />
                );
              })
            : barSeries.map((entry, seriesIndex) =>
                entry.data.map((value, pointIndex) => {
                  if (!Number.isFinite(value)) {
                    return null;
                  }

                  const groupCenter = getXPosition(
                    pointIndex,
                    valueCount,
                    innerWidth,
                    padding.left,
                    true
                  );
                  const x =
                    groupCenter -
                    groupedBarWidth / 2 +
                    singleBarWidth * seriesIndex +
                    1.5;
                  const y = scaleY(
                    value,
                    domainMin,
                    domainMax,
                    innerHeight,
                    padding.top
                  );
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
                })
              )}

          {normalizedSeries.map(entry => {
            if (
              !entry.interval ||
              getIntervalDisplay(entry) !== "bars" ||
              (barMode === "stacked" && entry.type === "bar")
            ) {
              return null;
            }

            return buildIntervalSegments(
              entry.interval,
              valueCount,
              innerWidth,
              innerHeight,
              padding.left,
              padding.top,
              domainMin,
              domainMax,
              useCenteredXPositions
            ).map((segment, segmentIndex) =>
              segment.map((point, pointIndex) => (
                <g key={`${entry.label}-interval-${segmentIndex}-${pointIndex}`}>
                  <line
                    x1={point.x}
                    x2={point.x}
                    y1={point.upperY}
                    y2={point.lowerY}
                    stroke={entry.color}
                    strokeWidth="1.5"
                    opacity="0.78"
                  />
                  <line
                    x1={point.x - 4}
                    x2={point.x + 4}
                    y1={point.upperY}
                    y2={point.upperY}
                    stroke={entry.color}
                    strokeWidth="1.5"
                    opacity="0.78"
                  />
                  <line
                    x1={point.x - 4}
                    x2={point.x + 4}
                    y1={point.lowerY}
                    y2={point.lowerY}
                    stroke={entry.color}
                    strokeWidth="1.5"
                    opacity="0.78"
                  />
                </g>
              ))
            );
          })}

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
              useCenteredXPositions
            );

            if (!points.length) {
              return null;
            }

            const pointList = points
              .map(point => `${point.x},${point.y}`)
              .join(" ");
            const areaPath = buildAreaPath(points, zeroLineY);
            const intervalSegments = entry.interval
              ? buildIntervalSegments(
                  entry.interval,
                  valueCount,
                  innerWidth,
                  innerHeight,
                  padding.left,
                  padding.top,
                  domainMin,
                  domainMax,
                  useCenteredXPositions
                )
              : [];

            return (
              <g key={entry.label}>
                {getIntervalDisplay(entry) === "band"
                  ? intervalSegments.map((segment, segmentIndex) => (
                      <path
                        key={`${entry.label}-band-${segmentIndex}`}
                        d={buildIntervalBandPath(segment)}
                        fill={entry.color}
                        opacity={0.13}
                      />
                    ))
                  : null}
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

      {caption ? (
        <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption>
      ) : null}
    </figure>
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
  offsetTop: number
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
  centerSteps: boolean
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
  centered: boolean
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

type IntervalPoint = {
  x: number;
  upperY: number;
  lowerY: number;
};

function buildIntervalSegments(
  interval: ChartInterval,
  valueCount: number,
  innerWidth: number,
  innerHeight: number,
  offsetLeft: number,
  offsetTop: number,
  min: number,
  max: number,
  centerSteps: boolean
) {
  const segments: IntervalPoint[][] = [];
  let current: IntervalPoint[] = [];

  for (let index = 0; index < valueCount; index += 1) {
    const lower = interval.lower[index];
    const upper = interval.upper[index];

    if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
      if (current.length) {
        segments.push(current);
        current = [];
      }
      continue;
    }

    const lowerBound = Math.min(lower, upper);
    const upperBound = Math.max(lower, upper);
    current.push({
      x: getXPosition(index, valueCount, innerWidth, offsetLeft, centerSteps),
      upperY: scaleY(upperBound, min, max, innerHeight, offsetTop),
      lowerY: scaleY(lowerBound, min, max, innerHeight, offsetTop),
    });
  }

  if (current.length) {
    segments.push(current);
  }

  return segments;
}

function buildIntervalBandPath(points: IntervalPoint[]) {
  if (!points.length) {
    return "";
  }

  const upper = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.upperY}`)
    .join(" ");
  const lower = [...points]
    .reverse()
    .map(point => `L ${point.x} ${point.lowerY}`)
    .join(" ");

  return `${upper} ${lower} Z`;
}

function getIntervalDisplay(entry: ChartSeries) {
  return entry.interval?.display ?? (entry.type === "bar" ? "bars" : "band");
}

type StackedBarSegment = {
  label: string;
  color: string;
  index: number;
  start: number;
  end: number;
};

function buildStackedBarSegments(
  series: Array<ChartSeries & { color: string }>,
  valueCount: number
) {
  const positive = Array.from({ length: valueCount }, () => 0);
  const negative = Array.from({ length: valueCount }, () => 0);
  const segments: StackedBarSegment[] = [];

  series.forEach(entry => {
    entry.data.forEach((value, index) => {
      if (!Number.isFinite(value)) return;

      const start = value >= 0 ? positive[index] : negative[index];
      const end = start + value;
      if (value >= 0) {
        positive[index] = end;
      } else {
        negative[index] = end;
      }
      segments.push({ label: entry.label, color: entry.color, index, start, end });
    });
  });

  return segments;
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
