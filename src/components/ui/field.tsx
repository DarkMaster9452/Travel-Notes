import { ChevronDown, CircleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Form fields (design/DESIGN-SYSTEM.md §7.2).
 *
 * Label above, helper below, and an error replaces the helper. Inputs are 44
 * px tall on a phone (a touch target) and 40 from `md` up; the phone size also
 * keeps the text at 16 px, which is what stops iOS zooming on focus.
 */

const control =
  "w-full rounded-control border border-border-strong bg-surface px-3 font-sans text-body text-text md:text-body-sm " +
  "placeholder:text-subtle transition-colors duration-fast ease-standard hover:border-muted " +
  "aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-surface-sunken";

export const inputClass = cn(control, "h-11 md:h-10");

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-body-sm font-medium text-text", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select className={cn(inputClass, "cursor-pointer appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
        aria-hidden="true"
      />
    </span>
  );
}

export function FieldHint({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-caption text-subtle", className)} {...props} />;
}

export function FieldError({ className, children, ...props }: ComponentProps<"p">) {
  return (
    <p role="alert" className={cn("flex items-start gap-1 text-caption text-danger", className)} {...props}>
      <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Label + control + helper/error, spaced 6 px apart (the one off-scale gap). */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** A quiet "(optional)" beside the label. */
  optional?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? <span className="ml-2 font-normal text-subtle">{optional}</span> : null}
      </Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

/** A stack of fields: 20 px apart (§3). */
export function FieldStack({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-5", className)} {...props} />;
}
