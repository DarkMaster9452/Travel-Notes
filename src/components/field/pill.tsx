"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Toggle pill. Selection is carried on `aria-pressed`, which is both the
 * accessible state and the styling hook — there is no separate `selected`
 * class to fall out of sync with it.
 */
export function Pill({
  pressed,
  className,
  children,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> & {
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed ?? false}
      className={cn("pill", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function PillGroup({
  label,
  hint,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode;
  /** Mono counter on the right of the label, e.g. "01 / Range". */
  hint?: React.ReactNode;
}) {
  return (
    <div className={cn("field", className)} {...props}>
      {label && (
        <div className="field-label">
          <b>{label}</b>
          {hint && <span>{hint}</span>}
        </div>
      )}
      <div className="pills">{children}</div>
    </div>
  );
}
