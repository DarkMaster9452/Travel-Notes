import * as React from "react";

import { cn } from "@/lib/utils";

export type TagTone =
  /** Green. The default — this is the structure. */
  | "pine"
  /** Stamp ink. Difficulty at the top end, "Most taken", bonus, flagged. */
  | "warm"
  /** Outline on paper. Counts, states, anything neutral. */
  | "ghost"
  /** Outline on a dark surface — photo overlays, the mail section. */
  | "inverse";

/**
 * Uppercase mono metadata chip. Every difficulty, count and status in the
 * product renders as one of these.
 */
export function Tag({
  tone = "pine",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      className={cn(
        "tag",
        tone === "warm" && "warm",
        tone === "ghost" && "ghost",
        tone === "inverse" && "inverse",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Difficulties that earn stamp ink rather than green. */
const WARM_DIFFICULTIES = new Set(["hard", "brutal"]);

export function isWarmDifficulty(difficulty: string): boolean {
  return WARM_DIFFICULTIES.has(difficulty.trim().toLowerCase());
}

/**
 * A difficulty tag. Wrapped rather than left to callers so the green/orange
 * rule is decided once — the top two grades are stamp ink, everything else is
 * structure.
 */
export function DifficultyTag({
  difficulty,
  className,
}: {
  difficulty: string;
  className?: string;
}) {
  return (
    <Tag tone={isWarmDifficulty(difficulty) ? "warm" : "pine"} className={className}>
      {difficulty}
    </Tag>
  );
}
