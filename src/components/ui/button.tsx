import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Button (design/DESIGN-SYSTEM.md §7.1).
 *
 * One primary per block. `monthly` is the monthly quest's own colour and is
 * used for nothing else. Heights are minimums, not fixed: a German label that
 * runs 40 % longer wraps onto a second line instead of pushing out of the card.
 */
export const buttonVariants = cva(
  [
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control border border-transparent",
    "text-center font-sans text-body-sm font-semibold no-underline",
    "transition duration-fast ease-standard",
    "active:scale-98 disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary-hover",
        monthly: "bg-accent text-accent-fg hover:bg-accent-hover",
        secondary: "border-border-strong bg-surface text-text hover:bg-surface-sunken",
        ghost: "text-text hover:bg-surface-sunken",
        danger: "bg-danger text-surface hover:bg-danger-hover",
        dangerQuiet: "border-border-strong bg-surface text-danger hover:border-danger hover:bg-danger-soft",
        onFeature: "border-feature-fg text-feature-fg hover:bg-feature-fg/10",
        link: "min-h-0 rounded-xs p-0 text-primary underline underline-offset-2 hover:text-primary-hover active:scale-100",
      },
      size: {
        sm: "min-h-8 px-3 py-1",
        md: "min-h-10 px-4 py-2",
        lg: "min-h-12 px-5 py-3 text-body [&_svg]:size-5",
      },
      block: { true: "w-full" },
    },
    compoundVariants: [{ variant: "link", class: "min-h-0 p-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  block,
  loading,
  disabled,
  children,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonVariants & { loading?: boolean }) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/** The same button as a link. Internal hrefs go through the router. */
export function ButtonLink({
  className,
  variant,
  size,
  block,
  href,
  children,
  ...props
}: Omit<ComponentProps<"a">, "href"> & ButtonVariants & { href: string }) {
  const classes = cn(buttonVariants({ variant, size, block }), className);
  const external = /^(https?:|mailto:|#)/.test(href);
  if (external) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
