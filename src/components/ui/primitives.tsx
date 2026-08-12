import * as React from "react";

import { cn } from "@/lib/utils";

/** Small uppercase eyebrow label. */
export function Kicker({
  children,
  className,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
}) {
  return <Tag className={cn("kicker text-stone", className)}>{children}</Tag>;
}

export function Badge({
  children,
  className,
  tone = "ink",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "ink" | "light" | "ember" | "moss" | "outline";
}) {
  const tones = {
    ink: "bg-ink text-paper",
    light: "bg-paper text-ink",
    ember: "bg-ember text-paper",
    moss: "bg-moss text-paper",
    outline: "border border-current text-current",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Section heading with an index number, used across the marketing page. */
export function SectionHeading({
  index,
  title,
  lede,
  className,
  tone = "dark",
}: {
  index?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {index && (
        <Kicker className={tone === "light" ? "text-paper/55" : "text-stone"}>{index}</Kicker>
      )}
      <h2 className={cn("display-md mt-4", tone === "light" ? "text-paper" : "text-ink")}>{title}</h2>
      {lede && (
        <p
          className={cn(
            "mt-6 max-w-xl text-base leading-relaxed sm:text-lg",
            tone === "light" ? "text-paper/70" : "text-stone",
          )}
        >
          {lede}
        </p>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  className,
  tone = "dark",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          "font-display text-3xl leading-none font-extrabold tabular-nums sm:text-4xl",
          tone === "light" ? "text-paper" : "text-ink",
        )}
      >
        {value}
      </span>
      <span className={cn("kicker", tone === "light" ? "text-paper/50" : "text-stone")}>{label}</span>
    </div>
  );
}

/** Loading placeholder that matches the flat, borderless visual language. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-ink/8", className)} aria-hidden="true" />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Empty and error states share one composition so no screen is ever blank. */
export function StateBlock({
  title,
  message,
  action,
  className,
  tone = "dark",
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-5 border border-dashed px-6 py-14 sm:px-10",
        tone === "light" ? "border-paper/25" : "border-ink/20",
        className,
      )}
    >
      <h3 className={cn("display-md", tone === "light" ? "text-paper" : "text-ink")}>{title}</h3>
      <p className={cn("max-w-md text-sm leading-relaxed", tone === "light" ? "text-paper/65" : "text-stone")}>
        {message}
      </p>
      {action}
    </div>
  );
}
