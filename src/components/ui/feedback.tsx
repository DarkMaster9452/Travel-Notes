import { CircleAlert, CircleCheck, Info, Mountain, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Feedback surfaces (design/DESIGN-SYSTEM.md §7.10): alert, empty state,
 * skeleton, progress.
 */

type AlertTone = "info" | "success" | "warning" | "danger";

const ALERT: Record<AlertTone, { ground: string; ink: string; icon: LucideIcon }> = {
  info: { ground: "bg-info-soft", ink: "text-info", icon: Info },
  success: { ground: "bg-success-soft", ink: "text-success", icon: CircleCheck },
  warning: { ground: "bg-warning-soft", ink: "text-warning", icon: TriangleAlert },
  danger: { ground: "bg-danger-soft", ink: "text-danger", icon: CircleAlert },
};

export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
  role,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  const { ground, ink, icon: Icon } = ALERT[tone];
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-card p-4 text-text", ground, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", ink)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-body-sm font-semibold">{title}</p> : null}
        {children ? <div className={cn("text-body-sm text-muted", title && "mt-1")}>{children}</div> : null}
        {action ? <div className="mt-3 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

/** Empty state: an icon in a 72 px circle, one heading, one sentence, one action at most. */
export function EmptyState({
  icon: Icon = Mountain,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <span className="grid size-18 place-items-center rounded-pill bg-primary-soft text-primary-soft-fg">
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <h3 className="text-h3 font-semibold">{title}</h3>
      {children ? <p className="max-w-form text-body-sm text-muted">{children}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Skeletons, not spinners: a sunken block where content will land. */
export function Skeleton({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse rounded-control bg-surface-sunken", className)}
      {...props}
    />
  );
}

/** A thin progress track. `tone="monthly"` only for the monthly quest's own clock. */
export function Progress({
  value,
  label,
  tone = "primary",
  className,
}: {
  /** 0–100. */
  value: number;
  label: string;
  tone?: "primary" | "monthly" | "onFeature";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "block h-2 w-full overflow-hidden rounded-xs",
        tone === "onFeature" ? "bg-feature-fg/15" : "bg-surface-sunken",
        className,
      )}
    >
      <span
        className={cn(
          "block h-full w-(--progress) rounded-xs",
          tone === "primary" ? "bg-primary" : tone === "monthly" ? "bg-accent" : "bg-feature-fg",
        )}
        style={{ ["--progress" as string]: `${pct}%` }}
      />
    </span>
  );
}
