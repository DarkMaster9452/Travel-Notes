"use client";

import { animate, stagger, utils } from "animejs";
import * as React from "react";

import { unstyle, useAnimeInView, usePrefersReducedMotion } from "@/components/motion/anime";
import { DURATION, EASE_FIELD } from "@/lib/motion";
import {
  AXIS,
  BAND_PART,
  BAND_WHOLE,
  CHART_SURFACE,
  GRID,
  RAMP_4,
  SOLO,
} from "@/lib/admin/palette";
import { cn } from "@/lib/utils";

/**
 * The admin chart library.
 *
 * Small, hand-drawn SVG rather than a charting dependency, for the same reason
 * the rest of the product has no component library: the design system is the
 * constraint, and a generic chart pack would arrive with its own palette,
 * its own type scale and its own idea of a rounded corner.
 *
 * Colour follows the same rules as everything else here, checked rather than
 * chosen. Almost nothing in this panel is *nominal* — plans, difficulties and
 * statuses are ordered — so the series take one-hue ordinal ramps, drawn from
 * the green the product is already built out of, with monotone lightness and a
 * visible gap between steps. Orange stays what it is everywhere else: stamp
 * ink, used here only where a status genuinely means "look at this".
 *
 * Those ramps are validated, not eyeballed. Because the brand green is
 * deliberately low-chroma, every chart also carries its numbers as direct
 * labels and a legend, so nothing is ever encoded by colour alone, and each one
 * offers the same figures as a table for anyone the colours fail.
 */

/* ------------------------------------------------------------------ types -- */

export type TrendPoint = {
  label: string;
  /** The whole — quests issued, accounts created. */
  value: number;
  /** The part of the whole that completed. Omit for a single-band chart. */
  part?: number;
};

export type NamedValue = { key: string; label: string; value: number };

/* ------------------------------------------------------------------ frame -- */

/**
 * The shell every chart sits in: title, legend, the chart itself, and the same
 * numbers as a table for anyone the colours don't work for.
 */
export function ChartFrame({
  title,
  aside,
  legend,
  note,
  table,
  bare,
  children,
  className,
}: {
  title: string;
  aside?: React.ReactNode;
  legend?: { color: string; label: string }[];
  note?: string;
  table?: { columns: string[]; rows: (string | number)[][] };
  /**
   * Drop the frame's own caption bar, because the surrounding panel already
   * carries one. The overview needs a head this frame cannot draw — a serif
   * title beside a headline figure, with the range control on the right — and
   * two stacked heads is what the first cut of that page looked like. `title`
   * is still required: it keeps naming the figures table below the chart.
   */
  bare?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("chart", bare && "is-bare", className)}>
      {!bare && (
        <figcaption className="chart-head">
          <span className="qc-id">{title}</span>
          {aside}
        </figcaption>
      )}

      {legend && legend.length > 0 && (
        <ul className="chart-legend">
          {legend.map((item) => (
            <li key={item.label}>
              <i style={{ background: item.color }} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <ChartPlot>{children}</ChartPlot>

      {note && <p className="chart-note">{note}</p>}

      {table && (
        <details className="chart-table">
          <summary>Show the figures</summary>
          <div className="chart-table-scroll">
            <table>
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

/**
 * The plot area, and the entrance every chart in the panel shares.
 *
 * A chart should look measured rather than printed, so the bars grow out of
 * their baseline, the trend wipes in from the left, and the numbers arrive
 * after the shapes they label. anime.js drives it — the parts are SVG nodes
 * scattered through each chart's markup, and a stagger across a queried set is
 * exactly the thing a per-element CSS delay cannot express.
 *
 * It waits for the chart to be on screen: the admin overview stacks eight of
 * these, and the ones below the fold should still be worth scrolling to.
 */
function ChartPlot({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();

  const ref = useAnimeInView<HTMLDivElement>({
    enabled: !reduced,
    threshold: 0.15,
    prepare: (plot) => {
      utils.set(plot.querySelectorAll(".grow-y"), { scaleY: 0 });
      utils.set(plot.querySelectorAll(".grow-x"), { scaleX: 0 });
      utils.set(plot.querySelectorAll(".wipe"), { scaleX: 0 });
      utils.set(plot.querySelectorAll(".chart-value"), { opacity: 0 });
    },
    play: (plot) => {
      const bars = Array.from(plot.querySelectorAll<SVGElement>(".grow-y"));
      const tracks = Array.from(plot.querySelectorAll<SVGElement | HTMLElement>(".grow-x"));
      const wipes = Array.from(plot.querySelectorAll<SVGElement>(".wipe"));
      const labels = Array.from(plot.querySelectorAll<SVGTextElement>(".chart-value"));

      if (bars.length) {
        animate(bars, {
          scaleY: [0, 1],
          duration: DURATION.base,
          ease: EASE_FIELD,
          delay: stagger(70),
          onComplete: () => unstyle(bars, ["transform"]),
        });
      }
      if (tracks.length) {
        animate(tracks, {
          scaleX: [0, 1],
          duration: 660,
          ease: EASE_FIELD,
          delay: stagger(70),
          onComplete: () => unstyle(tracks, ["transform"]),
        });
      }
      if (wipes.length) {
        animate(wipes, {
          scaleX: [0, 1],
          duration: 850,
          ease: EASE_FIELD,
          onComplete: () => unstyle(wipes, ["transform"]),
        });
      }
      if (labels.length) {
        animate(labels, {
          opacity: [0, 1],
          translateY: [4, 0],
          duration: DURATION.quick,
          delay: stagger(70, { start: 240 }),
          onComplete: () => unstyle(labels),
        });
      }
    },
    // Whatever was mid-flight, the chart is left drawn at full size: a bar
    // frozen at a third of its height is a chart that lies.
    reset: (plot) => {
      utils.set(plot.querySelectorAll(".grow-y, .grow-x, .wipe"), { scaleX: 1, scaleY: 1 });
      utils.set(plot.querySelectorAll(".chart-value"), { opacity: 1, translateY: 0 });
    },
  });

  return (
    <div className="chart-plot" ref={ref}>
      {children}
    </div>
  );
}

function EmptyPlot({ children }: { children: React.ReactNode }) {
  return <p className="chart-empty">{children}</p>;
}

/* ------------------------------------------------------------------ trend -- */

/**
 * The drawing box.
 *
 * Sized to roughly what a chart cell actually gets (the grid lays out columns
 * of 340–620px), because an SVG viewBox much wider than its rendered width
 * scales the type down with it — a 720-unit box in a 340px column renders 10px
 * labels at four. Keeping the box near the real width keeps the axis readable
 * without measuring anything at runtime.
 */
const W = 460;
const H = 200;
const PAD = { top: 16, right: 10, bottom: 28, left: 34 };

/**
 * Time series as a filled area, with the completed part nested inside the whole.
 *
 * Issued and logged are not two independent series — every logged quest was
 * issued first — so they are drawn as bands of one shape rather than two lines
 * that could cross, which would imply something impossible.
 */
export function TrendArea({
  points,
  wholeLabel,
  partLabel,
  title,
  aside,
  note,
  bare,
}: {
  points: TrendPoint[];
  wholeLabel: string;
  partLabel?: string;
  title: string;
  aside?: React.ReactNode;
  note?: string;
  /** Let the surrounding panel draw the head. See `ChartFrame`. */
  bare?: boolean;
}) {
  const clipId = React.useId();
  const [hover, setHover] = React.useState<number | null>(null);
  const hasPart = points.some((point) => point.part !== undefined);

  const max = Math.max(1, ...points.map((point) => point.value));
  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom };
  const step = points.length > 1 ? inner.w / (points.length - 1) : 0;

  const x = (index: number) => PAD.left + index * step;
  const y = (value: number) => PAD.top + inner.h - (value / max) * inner.h;

  const line = (pick: (point: TrendPoint) => number) =>
    points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)} ${y(pick(point))}`).join(" ");

  const area = (pick: (point: TrendPoint) => number) =>
    `${line(pick)} L${x(points.length - 1)} ${PAD.top + inner.h} L${PAD.left} ${PAD.top + inner.h} Z`;

  const ticks = [0, Math.round(max / 2), max].filter(
    (value, index, all) => all.indexOf(value) === index,
  );

  const active = hover !== null ? points[hover] : null;

  if (points.length === 0) {
    return (
      <ChartFrame title={title} aside={aside} bare={bare}>
        <EmptyPlot>Nothing recorded in this window yet.</EmptyPlot>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame
      title={title}
      aside={aside}
      bare={bare}
      legend={
        hasPart
          ? [
              { color: BAND_WHOLE, label: wholeLabel },
              { color: BAND_PART, label: partLabel ?? "Completed" },
            ]
          : undefined
      }
      note={note}
      table={{
        columns: hasPart ? ["Day", wholeLabel, partLabel ?? "Completed"] : ["Day", wholeLabel],
        rows: points.map((point) =>
          hasPart ? [point.label, point.value, point.part ?? 0] : [point.label, point.value],
        ),
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        role="img"
        aria-label={`${title}. ${wholeLabel} over ${points.length} days.`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const local = ((event.clientX - box.left) / box.width) * W;
          const index = Math.round((local - PAD.left) / (step || 1));
          setHover(Math.max(0, Math.min(points.length - 1, index)));
        }}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke={GRID}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <text x={PAD.left - 8} y={y(tick) + 3.5} className="chart-tick" textAnchor="end">
              {tick}
            </text>
          </g>
        ))}

        <clipPath id={clipId}>
          <rect className="wipe" x={0} y={0} width={W} height={H} />
        </clipPath>

        <g clipPath={`url(#${clipId})`}>
          <path d={area((point) => point.value)} fill={BAND_WHOLE} opacity={0.5} />
          <path
            d={line((point) => point.value)}
            fill="none"
            stroke={BAND_WHOLE}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {hasPart && (
            <>
              <path d={area((point) => point.part ?? 0)} fill={BAND_PART} opacity={0.72} />
              <path
                d={line((point) => point.part ?? 0)}
                fill="none"
                stroke={BAND_PART}
                strokeWidth={2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </g>

        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + inner.h}
          y2={PAD.top + inner.h}
          stroke={AXIS}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) =>
          index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2) ? (
            <text
              key={point.label}
              x={x(index)}
              y={H - 8}
              className="chart-tick"
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
            >
              {point.label}
            </text>
          ) : null,
        )}

        {hover !== null && active && (
          <g className="chart-cursor">
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + inner.h}
              stroke={AXIS}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={x(hover)} cy={y(active.value)} r={5} fill={BAND_WHOLE} stroke={CHART_SURFACE} strokeWidth={2} />
            {hasPart && (
              <circle
                cx={x(hover)}
                cy={y(active.part ?? 0)}
                r={5}
                fill={BAND_PART}
                stroke={CHART_SURFACE}
                strokeWidth={2}
              />
            )}
          </g>
        )}
      </svg>

      <p className="chart-readout" aria-live="polite">
        {active ? (
          <>
            <b>{active.label}</b>
            <span>
              {active.value} {wholeLabel.toLowerCase()}
            </span>
            {hasPart && (
              <span>
                {active.part ?? 0} {(partLabel ?? "completed").toLowerCase()}
              </span>
            )}
          </>
        ) : (
          <span className="chart-readout-hint">Hover the chart for a day.</span>
        )}
      </p>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------- bars -- */

/** Rounded data-end anchored to the baseline; the other end stays square. */
function barPath(x: number, y: number, width: number, height: number, radius = 4) {
  const r = Math.min(radius, width / 2, Math.max(height, 0.01));
  if (height <= 0) return "";
  return `M${x} ${y + height} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} L${x + width - r} ${y} Q${
    x + width
  } ${y} ${x + width} ${y + r} L${x + width} ${y + height} Z`;
}

/**
 * Vertical bars for an ordered set — difficulty grades, weekday buckets.
 *
 * Ordered, so the colour is an ordinal ramp and carries the order; the height
 * carries the magnitude and the label carries the identity.
 */
export function BarSeries({
  points,
  title,
  aside,
  note,
  ramp = RAMP_4,
  unitLabel = "quests",
}: {
  points: NamedValue[];
  title: string;
  aside?: React.ReactNode;
  note?: string;
  ramp?: readonly string[];
  unitLabel?: string;
}) {
  if (points.length === 0 || points.every((point) => point.value === 0)) {
    return (
      <ChartFrame title={title} aside={aside}>
        <EmptyPlot>Nothing to count yet.</EmptyPlot>
      </ChartFrame>
    );
  }

  const max = Math.max(1, ...points.map((point) => point.value));
  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom };
  // 2px of surface between neighbours, in user units.
  const slot = inner.w / points.length;
  const width = Math.max(6, slot - 10);

  return (
    <ChartFrame
      title={title}
      aside={aside}
      note={note}
      table={{
        columns: ["Band", unitLabel],
        rows: points.map((point) => [point.label, point.value]),
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label={title}>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + inner.h}
          y2={PAD.top + inner.h}
          stroke={AXIS}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) => {
          const height = (point.value / max) * inner.h;
          const x = PAD.left + index * slot + (slot - width) / 2;
          const y = PAD.top + inner.h - height;
          const color = ramp[Math.min(index, ramp.length - 1)];

          return (
            <g key={point.key}>
              <g className="grow-y">
                <path d={barPath(x, y, width, height)} fill={color}>
                  <title>{`${point.label}: ${point.value} ${unitLabel}`}</title>
                </path>
              </g>
              <text x={x + width / 2} y={y - 7} className="chart-value" textAnchor="middle">
                {point.value}
              </text>
              <text x={x + width / 2} y={H - 8} className="chart-tick" textAnchor="middle">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------- rank rows -- */

/**
 * A ranked list — top regions, busiest locations.
 *
 * Nominal categories, so every row is the same hue: length already says which
 * is bigger, and spending the identity channel on repeating that would be
 * decoration.
 */
export function RankBars({
  rows,
  title,
  aside,
  note,
  unitLabel = "quests",
  color = SOLO,
  bare,
}: {
  rows: NamedValue[];
  title: string;
  aside?: React.ReactNode;
  note?: string;
  unitLabel?: string;
  color?: string;
  /** Let the surrounding panel draw the head. See `ChartFrame`. */
  bare?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <ChartFrame title={title} aside={aside} bare={bare}>
        <EmptyPlot>No quests issued yet.</EmptyPlot>
      </ChartFrame>
    );
  }

  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ChartFrame
      title={title}
      aside={aside}
      bare={bare}
      note={note}
      table={{ columns: ["Name", unitLabel], rows: rows.map((row) => [row.label, row.value]) }}
    >
      <ul className="rank-rows">
        {rows.map((row) => (
          <li key={row.key}>
            <span className="rank-label" title={row.label}>
              {row.label}
            </span>
            <span className="rank-track">
              <i
                className="grow-x"
                style={{
                  width: `${Math.max(2, (row.value / max) * 100)}%`,
                  background: color,
                }}
              />
            </span>
            <b className="rank-value">{row.value}</b>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

/* -------------------------------------------------------------- split bar -- */

export type Segment = { key: string; label: string; value: number; color: string };

/**
 * One bar, split into parts of a whole — the plan mix, the status mix.
 *
 * A pie would make the same point worse: these are compared against each other
 * and against 100%, which is what a single bar is for. Segments are separated
 * by 2px of surface, and every one is labelled, so the colour is confirmation
 * rather than the only way to read it.
 */
export function SplitBar({
  segments,
  title,
  aside,
  note,
  unitLabel = "accounts",
}: {
  segments: Segment[];
  title: string;
  aside?: React.ReactNode;
  note?: string;
  unitLabel?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return (
      <ChartFrame title={title} aside={aside}>
        <EmptyPlot>No {unitLabel} yet.</EmptyPlot>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame
      title={title}
      aside={aside}
      note={note}
      table={{
        columns: ["Segment", unitLabel, "Share"],
        rows: segments.map((segment) => [
          segment.label,
          segment.value,
          `${Math.round((segment.value / total) * 100)}%`,
        ]),
      }}
    >
      <div className="split-bar" role="img" aria-label={title}>
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.key}
              className="grow-x"
              style={{
                flexGrow: segment.value,
                background: segment.color,
              }}
              title={`${segment.label}: ${segment.value} (${Math.round(
                (segment.value / total) * 100,
              )}%)`}
            />
          ))}
      </div>

      <ul className="split-key">
        {segments.map((segment) => (
          <li key={segment.key}>
            <i style={{ background: segment.color }} aria-hidden="true" />
            <span>{segment.label}</span>
            <b>{segment.value}</b>
            <em>{total > 0 ? `${Math.round((segment.value / total) * 100)}%` : "0%"}</em>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}
