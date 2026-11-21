import {
  Award,
  BookOpen,
  CalendarDays,
  Castle,
  Compass,
  Flag,
  Lock,
  Map,
  MapPin,
  Medal,
  Mountain,
  MountainSnow,
  Snowflake,
  Sun,
  TreePine,
  TrendingUp,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { stickerArt, stickerTilt, type StickerCut, type StickerGlyph, type StickerTone } from "@/lib/sticker-art";
import { cn } from "@/lib/utils";

/**
 * One sticker (design/DESIGN-SYSTEM.md §7.11): a die-cut on white paper with
 * a soft shadow, tilted a degree or three. The cut and the ink come from
 * `lib/sticker-art`, so a sticker is the same sticker wherever it is drawn;
 * only the size and the state are the caller's to decide.
 *
 * Three states, kept apart because they mean different things:
 *   earned  printed in its ink
 *   open    this plan reaches it but the work has not been done: a dashed
 *           outline of its cut with the glyph in quiet ink
 *   locked  beyond the plan: the same outline with a padlock
 */

const GLYPH: Record<StickerGlyph, LucideIcon> = {
  sun: Sun,
  ridge: Mountain,
  trees: TreePine,
  peak: MountainSnow,
  ascent: TrendingUp,
  laurel: Award,
  map: Map,
  peaks: Mountain,
  winter: Snowflake,
  compass: Compass,
  marker: MapPin,
  calendar: CalendarDays,
  medal: Medal,
  water: Waves,
  ruin: Castle,
  notes: BookOpen,
  flag: Flag,
};

/* Sticker inks: a domain map, so it may name the raw palette (§1.1). */
const TONE: Record<StickerTone, string> = {
  sun: "bg-sun text-moss-950",
  gold: "bg-medal-gold text-moss-950",
  mint: "bg-meadow-200 text-moss-950",
  meadow: "bg-meadow-500 text-moss-0",
  deep: "bg-meadow-800 text-moss-0",
  lake: "bg-lake text-moss-950",
  sky: "bg-sky text-moss-950",
  berry: "bg-berry text-moss-0",
  lilac: "bg-lilac text-moss-0",
  sunset: "bg-sunset-500 text-moss-950",
  stone: "bg-moss-300 text-moss-950",
  night: "bg-moss-800 text-sun",
};

const TILT: Record<number, string> = {
  [-3]: "-rotate-3",
  [-2]: "-rotate-2",
  [-1]: "-rotate-1",
  1: "rotate-1",
  2: "rotate-2",
  3: "rotate-3",
};

const SIZE = {
  sm: "size-12 border-4",
  md: "size-16 border-4",
  lg: "size-24 border-6",
  xl: "size-32 border-6",
} as const;

export type StickerState = "earned" | "open" | "locked";

export function Sticker({
  sticker,
  state = "earned",
  size = "md",
  fresh,
  title,
  className,
}: {
  /** The `sticker` key from the achievement definition. */
  sticker: string;
  state?: StickerState;
  size?: keyof typeof SIZE;
  /** Newly earned: pops in once. */
  fresh?: boolean;
  title?: string;
  className?: string;
}) {
  const art = stickerArt(sticker);
  const Icon = state === "locked" ? Lock : GLYPH[art.glyph];
  const cut: StickerCut = art.cut;

  return (
    <span
      title={title}
      data-cut={cut}
      className={cn(
        "sticker-cut inline-grid shrink-0 place-items-center",
        SIZE[size],
        TILT[stickerTilt(sticker)],
        state === "earned"
          ? cn("border-sticker-paper shadow-1", TONE[art.tone])
          : "border-2 border-dashed border-border-strong text-subtle",
        fresh && "animate-pop-in",
        className,
      )}
    >
      <Icon className={state === "locked" ? "size-1/3" : "size-1/2"} aria-hidden="true" strokeWidth={2} />
    </span>
  );
}
