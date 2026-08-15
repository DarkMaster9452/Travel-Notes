import * as React from "react";

import { cn } from "@/lib/utils";

import { Panel } from "./panel";

/**
 * Empty states have a point of view — "Nothing issued yet. That's on us —
 * generate one." They are not apologies and they are not blank space, so the
 * component insists on an action or an explanation rather than allowing a
 * bare heading.
 */
export function EmptyState({
  icon,
  title,
  children,
  action,
  bare,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  /** Render without the surrounding panel, for use inside one. */
  bare?: boolean;
  className?: string;
}) {
  const body = (
    <div className={cn("empty", bare && className)}>
      {icon && <div className="empty-ico">{icon}</div>}
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );

  if (bare) return body;
  return (
    <Panel flush className={className}>
      {body}
    </Panel>
  );
}
