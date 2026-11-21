import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tabs and segmented controls, as links (design/DESIGN-SYSTEM.md §7.8).
 *
 * Every filter in the product is a URL rather than component state: a
 * filtered list is something people send each other, and the back button
 * should undo a filter like it undoes anything else.
 */

export type NavOption = { key: string; label: ReactNode; href: string; badge?: ReactNode };

/** Underlined tabs: 2 px `primary` under the current one. */
export function TabsNav({
  options,
  active,
  label,
  className,
}: {
  options: NavOption[];
  active: string;
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("no-scrollbar overflow-x-auto border-b border-border", className)}>
      <ul className="flex min-w-max gap-6">
        {options.map((option) => {
          const current = option.key === active;
          return (
            <li key={option.key}>
              <Link
                href={option.href}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center gap-2 border-b-2 text-body-sm font-medium no-underline transition-colors duration-fast",
                  current
                    ? "border-primary font-semibold text-text"
                    : "border-transparent text-muted hover:text-text",
                )}
              >
                {option.label}
                {option.badge}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Segmented control: a sunken rail, the current segment raised on `surface`. */
export function SegmentedLinks({
  options,
  active,
  label,
  className,
}: {
  options: NavOption[];
  active: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-control bg-surface-sunken p-1", className)}
    >
      {options.map((option) => {
        const current = option.key === active;
        return (
          <Link
            key={option.key}
            href={option.href}
            scroll={false}
            aria-current={current ? "true" : undefined}
            className={cn(
              "inline-flex min-h-8 items-center justify-center gap-2 rounded-xs px-3 py-1 text-body-sm font-medium no-underline transition-colors duration-fast",
              current ? "bg-surface font-semibold text-text shadow-1" : "text-muted hover:text-text",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
