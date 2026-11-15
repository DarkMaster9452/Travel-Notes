import type { ReactNode } from "react";

import { CountUp } from "@/components/ui/count-up";
import { type } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * Page furniture (design/DESIGN-SYSTEM.md §11.5): every screen is
 * shell + `PageHeader` + blocks.
 */

/** One `h1` per page, an optional overline above it and a lede below. */
export function PageHeader({
  overline,
  title,
  lede,
  actions,
  className,
}: {
  overline?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  /** Buttons or figures, right-aligned from `md` up. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {overline ? <p className={cn(type.overline, "mb-2 text-subtle")}>{overline}</p> : null}
        <h1 className={type.h1}>{title}</h1>
        {lede ? <p className="mt-2 max-w-text text-body text-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-end gap-x-8 gap-y-3">{actions}</div> : null}
    </header>
  );
}

/** A block on a page: 32 px apart on a phone, 48 from `lg` (§3). */
export function PageStack({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col gap-8 lg:gap-12", className)}>{children}</div>;
}

/** A titled section within a page. */
export function Section({
  title,
  note,
  action,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex min-w-0 flex-col gap-4", className)}>
      {title ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className={type.h2}>{title}</h2>
            {note ? <p className="mt-1 text-body-sm text-muted">{note}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * One figure: the number bold and tabular, the unit and label quiet (§2.3).
 * `count` makes it count up once per session on arrival.
 */
export function Stat({
  value,
  label,
  unit,
  count,
  countId,
  prefix,
  size = "md",
  className,
}: {
  value?: ReactNode;
  label: ReactNode;
  unit?: ReactNode;
  count?: number;
  countId?: string;
  prefix?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <span
        className={cn(
          "font-display font-bold tabular-nums text-text",
          size === "lg" ? "text-h1" : "text-h2",
        )}
      >
        {typeof count === "number" ? (
          <>
            {prefix}
            <CountUp value={count} id={countId} />
          </>
        ) : (
          value
        )}
        {unit ? <span className="ml-1 font-sans text-body-sm font-normal text-muted">{unit}</span> : null}
      </span>
      <span className="text-caption text-muted">{label}</span>
    </div>
  );
}

/** Stat row: 2 across on a phone, 4 from `lg` (§6.4). */
export function StatRow({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6", className)}>{children}</div>;
}

/** A stat in its own card, for stat rows. */
export function StatCard({
  className,
  ...props
}: Parameters<typeof Stat>[0]) {
  return (
    <div className={cn("rounded-card border border-border bg-surface p-5", className)}>
      <Stat {...props} />
    </div>
  );
}

/** Label / value rows with hairlines between them. */
export function DataList({
  rows,
  className,
}: {
  rows: { label: ReactNode; value: ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn("divide-y divide-border", className)}>
      {rows.map((row, index) => (
        <div key={index} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="text-body-sm text-muted">{row.label}</dt>
          <dd className="text-right text-body-sm font-semibold tabular-nums text-text">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
