import { LogoPeak } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/**
 * A medal disc (design/DESIGN-SYSTEM.md §1.5, §7.11): the peak on gold, silver
 * or bronze. A domain map, so it names the medal colours directly; the ink on
 * top is the same dark in both themes because the metals do not change.
 */
export type MedalKind = "GOLD" | "SILVER" | "BRONZE";

const METAL: Record<MedalKind, string> = {
  GOLD: "bg-medal-gold",
  SILVER: "bg-medal-silver",
  BRONZE: "bg-medal-bronze",
};

const SIZE = {
  sm: "size-7",
  md: "size-10",
  lg: "size-16",
} as const;

export const MEDAL_ORDER: readonly MedalKind[] = ["GOLD", "SILVER", "BRONZE"];

export function MedalDisc({
  medal,
  size = "md",
  className,
  children,
}: {
  medal: MedalKind;
  size?: keyof typeof SIZE;
  className?: string;
  /** A rank number instead of the peak (leaderboard rows). */
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-pill text-moss-950",
        METAL[medal],
        SIZE[size],
        className,
      )}
    >
      {children ?? <LogoPeak className="size-1/2" />}
    </span>
  );
}
