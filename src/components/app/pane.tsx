import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * One settings pane: a card with its title row, edge-to-edge content below
 * (a `SaveForm`, a list of switches), and an optional danger tone for the
 * irreversible ones.
 */
export function Pane({
  title,
  note,
  action,
  tone,
  children,
  padded,
}: {
  title: ReactNode;
  /** A quiet line under the title: what this pane is for. */
  note?: ReactNode;
  /** A link or a badge on the right of the title row. */
  action?: ReactNode;
  tone?: "danger";
  children: ReactNode;
  /** The content is plain text and buttons rather than its own padded form. */
  padded?: boolean;
}) {
  return (
    <Card pad="none" as="section" className={cn("overflow-hidden", tone === "danger" && "border-danger")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold">{title}</h2>
          {note ? <p className="mt-1 text-body-sm text-muted">{note}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={padded ? "flex flex-col items-start gap-4 p-5" : "pt-2"}>{children}</div>
    </Card>
  );
}
