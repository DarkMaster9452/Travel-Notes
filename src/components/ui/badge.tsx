import { cva, type VariantProps } from "class-variance-authority";
import { Check, Clock, X, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Badge / chip / status (design/DESIGN-SYSTEM.md §7.6).
 *
 * `monthly` is the only tone that carries the accent. A status is never colour
 * alone: every status badge has an icon and a word.
 */
export const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-pill font-sans font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-surface-sunken text-muted",
        outline: "border border-border-strong text-muted",
        primary: "bg-primary-soft text-primary-soft-fg",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        monthly: "bg-accent font-semibold text-accent-fg",
        monthlySoft: "bg-accent-soft text-accent-soft-fg",
        weekly: "bg-sky-soft text-sky-fg",
        sky: "bg-sky-soft text-sky-fg",
        lake: "bg-lake-soft text-lake-fg",
        lilac: "bg-lilac-soft text-lilac-fg",
        berry: "bg-berry-soft text-berry-fg",
        sun: "bg-sun-soft text-sun-fg",
        /** A chip sitting on a photograph: solid ground, never a gradient. */
        photo: "bg-surface/90 text-text shadow-1",
        /** A chip sitting on the monthly feature panel. */
        onFeature: "bg-surface/60 text-feature-fg",
      },
      size: {
        sm: "h-5 px-2 text-overline tracking-normal",
        md: "h-6 px-3 text-caption",
        lg: "h-8 px-3 text-body-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  className,
  tone,
  size,
  icon: Icon,
  children,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { icon?: LucideIcon }) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/* --- status maps ---------------------------------------------------------- */

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

const SUBMISSION: Record<SubmissionStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  PENDING: { tone: "warning", icon: Clock },
  APPROVED: { tone: "success", icon: Check },
  REJECTED: { tone: "danger", icon: X },
};

/** A proof's verdict: icon + word + colour, never colour alone. */
export function SubmissionBadge({
  status,
  children,
  size,
}: {
  status: SubmissionStatus;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const { tone, icon } = SUBMISSION[status];
  return (
    <Badge tone={tone} icon={icon} size={size}>
      {children}
    </Badge>
  );
}

const PLAN_TONE: Record<string, BadgeTone> = {
  free: "neutral",
  explorer: "primary",
  ultra: "lilac",
};

export function PlanBadge({ plan, children }: { plan: string; children: ReactNode }) {
  return <Badge tone={PLAN_TONE[plan.toLowerCase()] ?? "neutral"}>{children}</Badge>;
}

const TAG_TONES = ["sky", "lake", "lilac", "berry", "sun"] as const satisfies readonly BadgeTone[];

/** A stable, playful tone per tag word, so "waterfall" is always the same colour. */
export function tagTone(tag: string): BadgeTone {
  let hash = 0;
  for (const char of tag) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}
