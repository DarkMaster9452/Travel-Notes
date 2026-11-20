import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Card (design/DESIGN-SYSTEM.md §7.3): surface + 1 px border, no shadow.
 * A clickable card is one link; it gains a stronger border and a soft shadow
 * on hover and never moves.
 */
export const cardVariants = cva("min-w-0 rounded-card border border-border bg-surface text-text", {
  variants: {
    pad: { none: "", sm: "p-4", md: "p-5", lg: "p-6" },
    tone: {
      surface: "",
      sunken: "border-transparent bg-surface-sunken",
      /** A card sitting on a `surface` band: it takes the page ground instead. */
      ground: "bg-bg",
    },
    interactive: {
      true: "block no-underline transition duration-fast ease-standard hover:border-border-strong hover:shadow-1",
    },
  },
  defaultVariants: { pad: "md", tone: "surface" },
});

type CardProps = VariantProps<typeof cardVariants>;

export function Card({
  className,
  pad,
  tone,
  as: Tag = "div",
  ...props
}: HTMLAttributes<HTMLElement> & CardProps & { as?: "div" | "section" | "article" | "aside" | "li" }) {
  return <Tag className={cn(cardVariants({ pad, tone }), className)} {...props} />;
}

export function CardLink({
  className,
  pad,
  tone,
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & CardProps & { href: string }) {
  return <Link href={href} className={cn(cardVariants({ pad, tone, interactive: true }), className)} {...props} />;
}

/** Title row of a card: heading on the left, a quiet action or note on the right. */
export function CardHeader({
  title,
  note,
  action,
  className,
  level = 2,
}: {
  title: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  className?: string;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Heading className="text-h3 font-semibold">{title}</Heading>
        {note ? <p className="mt-1 text-caption text-muted">{note}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
