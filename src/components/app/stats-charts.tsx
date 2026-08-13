"use client";

import * as React from "react";

import type { CountPoint, MonthPoint } from "@/lib/quest/service";
import { cn } from "@/lib/utils";

/**
 * The charts on the stats page.
 *
 * Colour does one job per chart and never more: the difficulty split is
 * *ordinal*, so it takes one hue stepped light→dark and the reader sees the
 * ordering in the colour itself; the distance trend and the terrain bars are
 * single-series, so they take one hue throughout and need no legend — the
 * title names them. No chart here has two y-scales.
 *
 * Every chart ships a screen-reader table alongside the drawing, because the
 * SVG is decoration as far as assistive tech is concerned.
 */

/** Ordinal ramp — validated for monotone lightness and a light end ≥ 2:1 on white. */
const GRADE = ["#9db87a", "#6f9450", "#456b2f", "#24401b"];
const HUE = "#456b2f";

function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: [string, string];
  rows: Array<[string, string | number]>;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{columns[0]}</th>
          <th scope="col">{columns[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---- Activity rings (meters) ---------------------------------------- */

/**
 * Three ratios against their own limits — a meter each, drawn concentrically
 * the way a watch does it. Not a chart: nothing is being compared across
 * categories, so a shared axis would be meaningless.
 */
export function ActivityRings({
  rings,
  className,
}: {
  rings: Array<{ label: string; value: number; goal: number; unit?: string }>;
  className?: string;
}) {
  const size = 168;
  const stroke = 14;
  const gap = 5;

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden="true">
          {rings.map((ring, index) => {
            const radius = size / 2 - stroke / 2 - index * (stroke + gap);
            const circumference = 2 * Math.PI * radius;
            const fraction = ring.goal <= 0 ? 0 : Math.min(1, ring.value / ring.goal);
            return (
              <g key={ring.label}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={GRADE[index] ?? HUE}
                  strokeWidth={stroke}
                  opacity={0.16}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={GRADE[index] ?? HUE}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - fraction)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="flex min-w-[10rem] flex-col gap-3">
        {rings.map((ring, index) => (
          <li key={ring.label} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full"
              style={{ background: GRADE[index] ?? HUE }}
            />
            <span>
              <span className="block text-[0.6875rem] font-medium tracking-wide uppercase text-muted">
                {ring.label}
              </span>
              <span className="font-display text-lg font-extrabold tabular-nums">
                {ring.value}
                {ring.unit ?? ""}
                <span className="ml-1 text-sm font-medium text-muted">
                  / {ring.goal}
                  {ring.unit ?? ""}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>

      <DataTable
        caption="Progress this month against monthly goals"
        columns={["Measure", "Progress"]}
        rows={rings.map((r) => [r.label, `${r.value}${r.unit ?? ""} of ${r.goal}${r.unit ?? ""}`])}
      />
    </div>
  );
}

/* ---- Distance trend (area, single series) ---------------------------- */

export function DistanceTrend({ months }: { months: MonthPoint[] }) {
  const [hover, setHover] = React.useState<number | null>(null);

  const width = 560;
  const height = 190;
  const pad = { top: 14, right: 12, bottom: 26, left: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const max = Math.max(10, ...months.map((m) => m.distance));
  const step = months.length > 1 ? plotW / (months.length - 1) : 0;
  const x = (i: number) => pad.left + i * step;
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;

  const line = months.map((m, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(m.distance)}`).join(" ");
  const area = `${line} L ${x(months.length - 1)} ${pad.top + plotH} L ${x(0)} ${pad.top + plotH} Z`;

  const ticks = [0, max / 2, max];
  const active = hover != null ? months[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Kilometres completed per month"
        onMouseLeave={() => setHover(null)}
      >
        {/* Recessive grid */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="currentColor"
              className="text-ink/10"
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-current text-[10px] text-muted"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="distanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={HUE} stopOpacity="0.28" />
            <stop offset="100%" stopColor={HUE} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <path d={area} fill="url(#distanceFill)" />
        <path d={line} fill="none" stroke={HUE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {months.map((month, i) => (
          <g key={month.key}>
            <circle
              cx={x(i)}
              cy={y(month.distance)}
              r={hover === i ? 5.5 : 4}
              fill={HUE}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-current text-[10px] text-muted"
            >
              {month.label}
            </text>
            {/* Hit target wider than the mark. */}
            <rect
              x={x(i) - step / 2}
              y={pad.top}
              width={step || plotW}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}

        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.top}
            y2={pad.top + plotH}
            stroke="currentColor"
            className="text-ink/25"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {active && (
        <div
          role="status"
          className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs shadow-sm"
        >
          <span className="font-medium text-ink">{active.label}</span>
          <span className="ml-2 text-muted">
            {active.distance} km · {active.completed} quest{active.completed === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <DataTable
        caption="Kilometres completed per month"
        columns={["Month", "Kilometres"]}
        rows={months.map((m) => [m.label, m.distance])}
      />
    </div>
  );
}

/* ---- Difficulty split (ordinal, part-to-whole) ----------------------- */

export function DifficultySplit({ data }: { data: CountPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted">No completed quests yet.</p>;
  }

  return (
    <div>
      {/* 2px surface gap between segments, so adjacent fills stay separable. */}
      <div className="flex h-7 w-full gap-0.5 overflow-hidden rounded-lg" role="img" aria-label="Completed quests by difficulty">
        {data.map((point, index) =>
          point.value === 0 ? null : (
            <div
              key={point.key}
              style={{ width: `${(point.value / total) * 100}%`, background: GRADE[index] }}
              className="first:rounded-l-lg last:rounded-r-lg"
              title={`${point.label}: ${point.value}`}
            />
          ),
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {data.map((point, index) => (
          <li key={point.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm"
              style={{ background: GRADE[index] }}
            />
            <span className="text-muted">{point.label}</span>
            <span className="font-medium tabular-nums text-ink">{point.value}</span>
          </li>
        ))}
      </ul>

      <DataTable
        caption="Completed quests by difficulty"
        columns={["Difficulty", "Quests"]}
        rows={data.map((p) => [p.label, p.value])}
      />
    </div>
  );
}

/* ---- Terrain breakdown (nominal, one hue) ---------------------------- */

export function TerrainBreakdown({ data }: { data: CountPoint[] }) {
  const [hover, setHover] = React.useState<string | null>(null);
  const max = Math.max(1, ...data.map((point) => point.value));

  if (data.length === 0) {
    return <p className="text-sm text-muted">No completed quests yet.</p>;
  }

  return (
    <div>
      <ul className="flex flex-col gap-2.5">
        {data.map((point) => (
          <li
            key={point.key}
            className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3"
            onMouseEnter={() => setHover(point.key)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="truncate text-sm text-muted">{point.label}</span>
            <span className="h-3 w-full overflow-hidden rounded-full bg-ink/6">
              <span
                className="block h-full rounded-full transition-[width,opacity]"
                style={{
                  width: `${(point.value / max) * 100}%`,
                  background: HUE,
                  opacity: hover && hover !== point.key ? 0.5 : 1,
                }}
              />
            </span>
            <span className="text-right text-sm font-medium tabular-nums text-ink">
              {point.value}
            </span>
          </li>
        ))}
      </ul>

      <DataTable
        caption="Completed quests by terrain"
        columns={["Terrain", "Quests"]}
        rows={data.map((p) => [p.label, p.value])}
      />
    </div>
  );
}
