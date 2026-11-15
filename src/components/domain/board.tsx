import type { ReactNode } from "react";

import { MEDAL_ORDER, MedalDisc } from "@/components/domain/medal";
import { cn } from "@/lib/utils";

/**
 * A leaderboard row (design/DESIGN-SYSTEM.md §7.11): the top three carry a
 * 28 px medal disc with their place in it, and the reader's own row sits on
 * `primary-soft`. Used by the leaderboard, the dashboard and the rail, so a
 * place on the board looks the same wherever it is read.
 */
export function BoardRow({
  rank,
  name,
  leading,
  score,
  meta,
  me,
  meLabel,
  href,
  medals = true,
  className,
}: {
  rank: number;
  name: ReactNode;
  /** An avatar in front of the name. */
  leading?: ReactNode;
  score: ReactNode;
  /** A quiet figure between the name and the score ("2 quests"). */
  meta?: ReactNode;
  me?: boolean;
  /** "you", shown after the reader's own name. */
  meLabel?: string;
  href?: string;
  /** Off for lists that are not a ranking of the whole board. */
  medals?: boolean;
  className?: string;
}) {
  const medal = medals && rank >= 1 && rank <= 3 ? MEDAL_ORDER[rank - 1] : null;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-control px-3 py-2",
        me ? "bg-primary-soft text-primary-soft-fg" : "text-text",
        className,
      )}
    >
      {medal ? (
        <MedalDisc medal={medal} size="sm" className="text-caption font-semibold tabular-nums">
          {rank}
        </MedalDisc>
      ) : (
        <span className={cn("grid size-7 shrink-0 place-items-center text-body-sm tabular-nums", !me && "text-subtle")}>
          {rank}
        </span>
      )}
      {leading}
      <span className={cn("min-w-0 flex-1 truncate text-body-sm", me && "font-semibold")}>
        {href ? (
          <a href={href} className="no-underline hover:underline">
            {name}
          </a>
        ) : (
          name
        )}
        {me && meLabel ? <span className="font-normal"> · {meLabel}</span> : null}
      </span>
      {meta ? (
        <span className={cn("hidden shrink-0 text-caption sm:inline", !me && "text-muted")}>{meta}</span>
      ) : null}
      <b className="shrink-0 text-body font-semibold tabular-nums">{score}</b>
    </li>
  );
}

export function BoardList({
  children,
  className,
  "aria-label": label,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <ol aria-label={label} className={cn("flex flex-col gap-1", className)}>
      {children}
    </ol>
  );
}
