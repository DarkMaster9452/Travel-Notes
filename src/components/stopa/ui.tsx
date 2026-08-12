import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The interface kit: a trail-marker tile, cards, section labels and buttons.
 * Everything is flat with a hairline border so photographs and point totals
 * carry the colour.
 */

/** The little waymark tile that fronts every quest and reward row. */
export function Marker({
  color,
  size = "md",
  className,
}: {
  color: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "h-8 w-9" : "h-11 w-12";
  return (
    <span
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-[5px] border border-cream/30 bg-cream",
        box,
        className,
      )}
      aria-hidden="true"
    >
      <span className="h-1/3 bg-cream" />
      <span className="h-1/3" style={{ backgroundColor: color }} />
      <span className="h-1/3 bg-cream" />
    </span>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={cn("section-label", className)}>{children}</h2>;
}

export function Card({
  children,
  className,
  solid = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  solid?: boolean;
  as?: "div" | "li" | "article" | "section";
}) {
  return (
    <Tag className={cn(solid ? "card-solid" : "card", "p-5", className)}>{children}</Tag>
  );
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-serif text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-amber text-forest-deep hover:bg-amber-deep",
        outline: "border border-cream/30 text-cream hover:border-cream/70",
        ghost: "text-cream/70 hover:text-cream",
        danger: "border border-brick/60 text-cream hover:bg-brick/20",
        quiet: "bg-forest-card text-cream hover:bg-forest-line",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5",
        lg: "h-14 px-6 text-lg",
        block: "h-14 w-full px-6 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** The olive points chip in the corner of a quest card. */
export function PointsBadge({ points, label }: { points: number; label: string }) {
  return (
    <span className="flex shrink-0 flex-col items-center rounded-[8px] bg-olive px-3 py-2 leading-none text-cream">
      <span className="font-serif text-2xl font-semibold tabular-nums">{points}</span>
      <span className="mt-1 text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
        {label}
      </span>
    </span>
  );
}

export function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 15s5-5.1 5-8.6A5 5 0 0 0 3 6.4C3 9.9 8 15 8 15Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="6.3" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="11" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 7.5V11l2.4 1.6M7.5 2h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 6l1.3-2h3.4L14 6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Empty states — never a blank screen. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[14px] border border-dashed border-cream/25 px-5 py-10", className)}>
      <p className="font-serif text-xl text-cream">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-moss">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export { buttonVariants };
