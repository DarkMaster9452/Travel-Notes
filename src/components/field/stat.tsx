import * as React from "react";

import { cn } from "@/lib/utils";

export type StatItem = {
  /** Big mono figure. Pre-formatted — see `formatMetres` for the thin space. */
  value: React.ReactNode;
  /** Uppercase mono caption underneath. */
  label: React.ReactNode;
};

/**
 * The hairline-gridded figure row from a quest sheet. Three columns by
 * default (distance / ascent / moving time), four for parsed proof stats.
 */
export function StatRow({
  items,
  columns = 3,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  items: StatItem[];
  columns?: 3 | 4;
}) {
  return (
    <div className={cn(columns === 4 ? "proof-row" : "qc-stats", className)} {...props}>
      {items.map((item, index) => (
        <div key={index}>
          <b>{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/** A single figure, for panel headers and dashboard summaries. */
export function Stat({
  value,
  label,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & StatItem) {
  return (
    <div className={cn("flex flex-col gap-[3px]", className)} {...props}>
      <b className="font-serif text-[26px] font-semibold tracking-[-0.02em]">{value}</b>
      <span className="meta">{label}</span>
    </div>
  );
}

/**
 * Thin space as a thousands separator, matching the landing page's "1 180".
 * A regular space would let a figure wrap mid-number.
 */
export function formatMetres(metres: number): string {
  return Math.round(metres).toLocaleString("en-GB").replace(/,/g, " ");
}
