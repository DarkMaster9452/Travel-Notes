import type { CSSProperties } from "react";

/**
 * The two charts the panel uses, and no others.
 *
 * Both are bars, both are drawn in CSS, and neither carries an axis: the
 * figure that matters is printed beside the chart, and the bars are there to
 * show the shape. A charting library for two shapes would be a dependency
 * whose upgrades outlive the screens that use it.
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
