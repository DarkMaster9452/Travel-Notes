import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The card surface everything in the app sits on. `flush` drops the padding
 * for panels that own their own header or a full-bleed list.
 */
export function Panel({
  flush,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <div className={cn("panel", flush && "panel-flush", className)} {...props}>
      {children}
    </div>
  );
}

/** Dashed-rule header, matching the head of an issued quest. */
export function PanelHead({
  title,
  aside,
  className,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className={cn("panel-head", className)} {...props}>
      <span className="qc-id">{title}</span>
      {aside}
    </div>
  );
}

/** Eyebrow — mono, letterspaced, with the short rule in front of it. */
export function Eyebrow({
  tone = "moss",
  centered,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "moss" | "warm";
  centered?: boolean;
}) {
  return (
    <span
      className={cn("eyebrow", tone === "warm" && "warm", centered && "centered", className)}
      {...props}
    >
      {children}
    </span>
  );
}
