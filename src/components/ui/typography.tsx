import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * The type scale as classes (design/DESIGN-SYSTEM.md §2.2). Display faces for
 * `display-*`, `h1`, `h2`; Inter for everything else.
 */
export const type = {
  displayXl: "font-display text-display-xl font-extrabold text-balance",
  display: "font-display text-display font-bold text-balance",
  h1: "font-display text-h1 font-bold text-balance",
  h2: "font-display text-h2 font-bold text-balance",
  h3: "text-h3 font-semibold",
  h4: "text-h4 font-semibold",
  bodyLg: "text-body-lg",
  body: "text-body",
  bodySm: "text-body-sm",
  caption: "text-caption",
  overline: "text-overline font-semibold uppercase",
} as const;

/** Eyebrow above a heading, or a column header. The only uppercase text. */
export function Overline({
  className,
  as: Tag = "p",
  ...props
}: ComponentProps<"p"> & { as?: "p" | "span" | "h2" | "h3" }) {
  return <Tag className={cn(type.overline, "text-subtle", className)} {...props} />;
}

/** A section heading inside a page (`h2`). */
export function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn(type.h2, className)} {...props} />;
}
