import type { CSSProperties } from "react";

/**
 * The panel's charts, and no others.
 *
 * Three of them are bars drawn in CSS, because they count things that happened
 * separately, and none carries an axis: the figure that matters is printed
 * beside the chart and the bars are there to show the shape. The fourth is an
 * SVG curve, for the one thing the panel measures continuously rather than
 * counts — see `SqSpark`.
 *
 * Still no charting library. Four shapes do not need a dependency whose
 * upgrades outlive the screens that use it, and the smoothing that makes the
 * curve worth having is a dozen lines of arithmetic.
 */

export function SqStackedBars({
  bars,
  height = 92,
  wholeColour = "var(--sage)",
  partColour = "var(--pine)",
}: {
  /** Each bar's two segments, as percentages of the tallest whole. */
  bars: { whole: number; part: number }[];
  height?: number;
  wholeColour?: string;
  partColour?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height }}>
      {bars.map((bar, index) => (
        <span
          key={index}
          style={{
            flex: "1 1 0",
            minWidth: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            height: "100%",
          }}
        >
          <span
            style={{
              display: "block",
              borderRadius: "2px 2px 0 0",
              height: `${bar.whole}%`,
              background: wholeColour,
            }}
          />
          <span style={{ display: "block", height: `${bar.part}%`, background: partColour }} />
        </span>
      ))}
    </div>
  );
}

export function SqColumnChart({
  columns,
  height = 130,
}: {
  columns: { label: string; value: number; colour?: string }[];
  height?: number;
}) {
  const max = Math.max(1, ...columns.map((column) => column.value));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns.length},minmax(0,1fr))`,
        gap: 14,
        alignItems: "end",
        height,
      }}
    >
      {columns.map((column, index) => (
        <span
          key={column.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            justifyContent: "flex-end",
            height: "100%",
          }}
        >
          <b className="sq-mono" style={{ fontWeight: 500, fontSize: 13 }}>
            {column.value}
          </b>
          <span
            style={
              {
                width: "100%",
                borderRadius: "4px 4px 0 0",
                height: `${Math.max(4, (column.value / max) * 78)}%`,
                background: column.colour ?? "var(--moss)",
                transformOrigin: "bottom",
                animation: "sq-grow 320ms var(--ease-settle) both",
                animationDelay: `${index * 60}ms`,
              } as CSSProperties
            }
          />
          <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
            {column.label}
          </span>
        </span>
      ))}
    </div>
  );
}

/** A single proportional bar with a legend under it. */
export function SqSplitBar({
  parts,
}: {
  parts: { label: string; value: number; colour: string }[];
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;

  return (
    <>
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
        {parts.map((part) => (
          <span
            key={part.label}
            style={{ display: "block", width: `${(part.value / total) * 100}%`, background: part.colour }}
          />
        ))}
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {parts.map((part) => (
          <li key={part.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
            <i style={{ width: 9, height: 9, borderRadius: 2, display: "block", background: part.colour }} />
            <span style={{ flex: 1 }}>{part.label}</span>
            <b className="sq-mono" style={{ fontWeight: 500 }}>
              {part.value}
            </b>
            <span className="sq-mono" style={{ width: 44, textAlign: "right", color: "var(--ink-3)" }}>
              {Math.round((part.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Smooth lines                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A curve through a series of points, with no corners in it.
 *
 * Every other chart in the panel is bars, because every other chart counts
 * things that happened separately. This one traces a measurement over time —
 * how long the database took to answer, hour by hour — and a measurement that
 * varies smoothly should not be drawn as a zigzag of straight segments: the
 * kinks are an artefact of how often we sampled, not something the system did.
 *
 * The smoothing is Catmull-Rom converted to cubic Béziers. Each segment's two
 * control points are placed a sixth of the way along the *neighbouring*
 * points' direction, which is the standard conversion and has the property
 * that matters here: the curve passes exactly through every reading. A spline
 * that merely approximates its points would draw a latency the system never
 * had.
 *
 * `tension` pulls the control points back towards the segment. At 1 it is the
 * plain Catmull-Rom curve, which can overshoot on a spike; the default of 0.85
 * keeps the softness without letting the line bulge past a peak it should be
 * touching.
 */
function smoothPath(points: { x: number; y: number }[], tension = 0.85): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    // The two points either side of this segment. At the ends there is no
    // neighbour, so the segment's own endpoint stands in — which makes the
    // curve leave and arrive along the segment rather than flicking outward.
    const before = points[index === 0 ? 0 : index - 1];
    const start = points[index];
    const end = points[index + 1];
    const after = points[index + 2] ?? end;

    const factor = tension / 6;

    path +=
      ` C ${round(start.x + (end.x - before.x) * factor)} ${round(start.y + (end.y - before.y) * factor)}` +
      ` ${round(end.x - (after.x - start.x) * factor)} ${round(end.y - (after.y - start.y) * factor)}` +
      ` ${round(end.x)} ${round(end.y)}`;
  }

  return path;
}

/** Two decimals is finer than a device pixel and keeps the markup readable. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export type SqSparkPoint = { value: number | null; colour?: string };

/**
 * A smoothed area chart, sized by its container.
 *
 * Drawn in SVG with `preserveAspectRatio="none"` so one viewBox stretches to
 * whatever width it is given — the panel's cards are fluid, and a chart that
 * needed to know its own pixel width would need to be a client component
 * measuring itself.
 *
 * Gaps are real. A `null` reading is an hour nobody probed, and the line
 * breaks rather than interpolating across it: a straight run through a gap
 * would be the chart inventing readings.
 *
 * `id` must be unique on the page — the gradient is referenced by `url(#…)`,
 * and two charts sharing an id would both paint with the first one's colour.
 * It is a required prop rather than a generated one because this renders on
 * the server, where `useId` is not available.
 */
export function SqSpark({
  id,
  points,
  colour = "var(--moss)",
  height = 44,
  fill = true,
  floor = 0,
}: {
  id: string;
  points: SqSparkPoint[];
  colour?: string;
  height?: number;
  /** The soft wash under the line. Off for a bare trace. */
  fill?: boolean;
  /** Lowest value the y-axis shows. Zero unless a floor reads better. */
  floor?: number;
}) {
  const width = 240;
  const pad = 3;
  const values = points.map((point) => point.value).filter((value): value is number => value !== null);

  if (values.length < 2) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "var(--ink-3)",
          border: "1px dashed var(--line-2)",
          borderRadius: 8,
        }}
      >
        Not enough readings yet
      </div>
    );
  }

  const top = Math.max(...values);
  const bottom = Math.min(floor, ...values);
  // A flat series has no range to divide by, and would put every point on the
  // same row anyway — 1 keeps the arithmetic finite and draws it mid-height.
  const range = top - bottom || 1;
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const toPoint = (value: number, index: number) => ({
    x: pad + index * step,
    y: pad + (1 - (value - bottom) / range) * (height - pad * 2),
  });

  // Split on gaps: each run of consecutive readings becomes its own path.
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  points.forEach((point, index) => {
    if (point.value === null) {
      if (run.length > 0) runs.push(run);
      run = [];
      return;
    }
    run.push(toPoint(point.value, index));
  });
  if (run.length > 0) runs.push(run);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height, overflow: "visible" }}
      role="img"
      aria-label={`${points.filter((point) => point.value !== null).length} readings, most recent ${Math.round(values[values.length - 1])}`}
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colour} stopOpacity="0" />
        </linearGradient>
      </defs>

      {runs.map((segment, index) => {
        const line = smoothPath(segment);
        return (
          <g key={index}>
            {fill && segment.length > 1 ? (
              <path
                d={`${line} L ${round(segment[segment.length - 1].x)} ${height - pad} L ${round(segment[0].x)} ${height - pad} Z`}
                fill={`url(#spark-${id})`}
              />
            ) : null}
            <path
              d={line}
              fill="none"
              stroke={colour}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              // The stroke would stretch with the viewBox otherwise, so a wide
              // card would draw a fat line and a narrow one a hairline.
              vectorEffect="non-scaling-stroke"
              // Renormalises the curve's length to 1 so the draw-in animation
              // in the stylesheet can use one dash value for every chart.
              pathLength={1}
              className="sq-spark-line"
            />
          </g>
        );
      })}

      {/* The most recent reading, marked. It is the number the desk is after. */}
      {runs.length > 0 && runs[runs.length - 1].length > 0
        ? (() => {
            const last = runs[runs.length - 1][runs[runs.length - 1].length - 1];
            return <circle cx={last.x} cy={last.y} r="2.4" fill={colour} vectorEffect="non-scaling-stroke" />;
          })()
        : null}
    </svg>
  );
}

/**
 * The status of each bucket as a run of rounded blocks under a chart.
 *
 * The curve says how fast, this says whether it worked — two different
 * questions that would fight for the same y-axis if drawn together. Reading it
 * needs no legend: a solid green run is a good day and any other colour in it
 * is where to look.
 */
export function SqStatusRibbon({
  buckets,
  height = 8,
}: {
  buckets: { colour: string; title: string }[];
  height?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 2, height }}>
      {buckets.map((bucket, index) => (
        <span
          key={index}
          title={bucket.title}
          style={{
            flex: "1 1 0",
            minWidth: 2,
            borderRadius: 2,
            background: bucket.colour,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}
