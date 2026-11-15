import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Checkbox, switch and chips. All three are real `<input>`s underneath, so
 * they post with a plain form, work without JavaScript and take the global
 * focus ring through `peer-focus-visible`.
 */

const focusPeer =
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <span className={cn("relative inline-grid size-5 shrink-0 place-items-center", className)}>
      <input
        type="checkbox"
        className="peer size-5 cursor-pointer appearance-none rounded-xs border border-border-strong bg-surface transition-colors duration-fast checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <Check
        className="pointer-events-none absolute size-3.5 text-primary-fg opacity-0 peer-checked:opacity-100"
        aria-hidden="true"
        strokeWidth={3}
      />
    </span>
  );
}

/** A switch: a checkbox with `role="switch"`, drawn as a track and a thumb. */
export function Switch({ className, ...props }: Omit<ComponentProps<"input">, "type" | "role">) {
  return (
    <span className={cn("relative inline-flex h-6 w-10 shrink-0 items-center", className)}>
      <input
        type="checkbox"
        role="switch"
        className="peer absolute inset-0 z-sticky size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        className={cn(
          "h-6 w-10 rounded-pill bg-border-strong transition-colors duration-fast ease-standard peer-checked:bg-primary peer-disabled:opacity-50",
          focusPeer,
        )}
      />
      <span className="pointer-events-none absolute left-0.5 size-5 rounded-pill bg-surface shadow-1 transition-transform duration-fast ease-standard peer-checked:translate-x-4" />
    </span>
  );
}

/**
 * One chip of a segmented choice (§7.2): a radio or a checkbox drawn as a
 * pill. Selected = `primary-soft` ground with a `primary` edge.
 */
export function Chip({
  children,
  className,
  type = "radio",
  icon,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { type?: "radio" | "checkbox"; icon?: ReactNode }) {
  return (
    <label className={cn("relative inline-flex cursor-pointer", className)}>
      <input type={type} className="peer sr-only" {...props} />
      <span
        className={cn(
          "inline-flex min-h-10 items-center gap-2 rounded-pill border border-border-strong bg-surface px-4 py-2 text-body-sm font-medium text-text",
          "transition-colors duration-fast ease-standard hover:bg-surface-sunken",
          "peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary-soft-fg",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50 [&_svg]:size-4",
          focusPeer,
        )}
      >
        {icon}
        {children}
      </span>
    </label>
  );
}

/** A row of chips with its legend. */
export function ChipGroup({
  legend,
  hint,
  className,
  children,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2", className)}>
      <legend className="mb-2 text-body-sm font-medium text-text">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {hint ? <p className="text-caption text-subtle">{hint}</p> : null}
    </fieldset>
  );
}
