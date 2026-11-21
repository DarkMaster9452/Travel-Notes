import type { ComponentProps, ReactNode } from "react";

import { Overline, type } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * Long text: one `h1`, `h2` sections, paragraphs no wider than the 640 px
 * column they sit in (design/DESIGN-SYSTEM.md §2.3).
 */
export function Prose({ overline, title, children }: { overline: string; title: string; children: ReactNode }) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Overline>{overline}</Overline>
        <h1 className={type.h1}>{title}</h1>
      </header>
      <div className="flex flex-col gap-4 text-body text-muted">{children}</div>
    </article>
  );
}

export function ProseHeading({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn(type.h2, "mt-4 text-text", className)} {...props} />;
}

export function ProseLink({ className, ...props }: ComponentProps<"a">) {
  return <a className={cn("text-primary underline underline-offset-2", className)} {...props} />;
}
