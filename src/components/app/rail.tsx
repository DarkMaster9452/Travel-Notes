import type { ReactNode } from "react";

import { Progress } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

/**
 * The furniture for the third column (design/DESIGN-SYSTEM.md §6.4, "Main +
 * rail"). A rail card is quieter than a page card: the rail is read second,
 * so it is a small label, one figure or a short list, and an optional foot.
 *
 * Presentation only. What goes in the column, and whether a screen has one at
 * all, is decided by the `@rail` parallel route beside it.
 */
export function RailCard({
  title,
  meta,
  foot,
  children,
  className,
}: {
  title: string;
  /** The small right-hand note in the header: a count, a date, a state. */
  meta?: ReactNode;
  foot?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card border border-border bg-surface", className)}>
      <header className="flex items-baseline justify-between gap-3 px-4 pt-4">
        <h2 className="text-overline font-semibold uppercase text-subtle">{title}</h2>
        {meta ? <span className="text-caption text-subtle">{meta}</span> : null}
      </header>
      <div className="p-4">{children}</div>
      {foot ? <footer className="border-t border-border px-4 py-3 text-caption">{foot}</footer> : null}
    </section>
  );
}

/** One big number and the sentence underneath that says what it is. */
export function RailFigure({ value, note }: { value: ReactNode; note: ReactNode }) {
  return (
    <div>
      <b className="block font-display text-h1 font-bold tabular-nums text-text">{value}</b>
      <p className="mt-2 text-body-sm text-muted">{note}</p>
    </div>
  );
}

/** Label left, figure right: the rail's version of a table row. */
export function RailLine({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className="min-w-0 truncate text-body-sm text-muted">{label}</span>
      <b className="shrink-0 text-body-sm font-semibold tabular-nums text-text">{value}</b>
    </div>
  );
}

/** How far along something is, under the line of text that names it. */
export function RailBar({ pct, label }: { pct: number; label: string }) {
  return <Progress value={pct} label={label} className="mt-3" />;
}
