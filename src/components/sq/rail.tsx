import type { ReactNode } from "react";

/**
 * The furniture for the third column.
 *
 * A rail card is deliberately quieter than a `.sq-card`: the rail is read
 * second, after the page, and a column shouting alongside the content would
 * make the screen harder to read rather than fuller. So: a mono label, a
 * hairline, one figure or a short list, and an optional foot.
 *
 * These are presentation only. What goes in the column, and whether a screen
 * has one at all, is decided by the `@rail` parallel route beside it.
 */
export function RailCard({
  title,
  meta,
  tone = "plain",
  index = 0,
  foot,
  children,
}: {
  title: string;
  /** The small right-hand note in the header — a count, a date, a state. */
  meta?: ReactNode;
  tone?: "plain" | "tinted" | "dark";
  /** Position in the column, for the stagger. */
  index?: number;
  foot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="sq-rail-card"
      data-tone={tone}
      style={{ ["--i" as string]: index }}
    >
      <header className="sq-rail-head">
        <h2 className="sq-rail-title">{title}</h2>
        {meta ? <span className="sq-rail-title">{meta}</span> : null}
      </header>
      {children}
      {foot ? <footer className="sq-rail-foot">{foot}</footer> : null}
    </section>
  );
}

/** One big number and the sentence underneath that says what it is. */
export function RailFigure({ value, note }: { value: ReactNode; note: ReactNode }) {
  return (
    <div className="sq-rail-body">
      <b className="sq-rail-figure">{value}</b>
      <p className="sq-rail-note" style={{ marginTop: 8 }}>
        {note}
      </p>
    </div>
  );
}

/** Label left, figure right — the rail's version of a table row. */
export function RailLine({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="sq-rail-line">
      <span style={{ color: "var(--ink-2)", minWidth: 0 }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

/** How far along something is, under the line of text that names it. */
export function RailBar({ pct, fill }: { pct: number; fill?: string }) {
  return (
    <div className="sq-rail-bar">
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: fill }} />
    </div>
  );
}
