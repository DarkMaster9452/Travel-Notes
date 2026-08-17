import type { UserStats } from "@/lib/quest/service";

/**
 * Achievements are *derived*, never stored.
 *
 * Every badge is a pure function of the stats we already compute from quest
 * history, so there is no unlock table to migrate, nothing to backfill, and no
 * way for a badge to drift out of sync with the thing it claims to represent.
 * Recomputing on read is cheap; the stats query is one round trip either way.
 */

export type Achievement = {
  id: string;
  label: string;
  description: string;
  sticker: string;
  /** Progress toward the badge, 0–1. */
  progress: number;
  earned: boolean;
  /** e.g. "3 / 5" — shown while the badge is still locked. */
  progressLabel: string;
};

type Definition = {
  id: string;
  label: string;
  description: string;
  /** Key into `STICKER_ARTWORK` — the die-cut design this unlocks. */
  sticker: string;
  target: number;
  value: (stats: UserStats) => number;
  unit?: string;
};

const DEFINITIONS: Definition[] = [
  {
    id: "first-light",
    label: "First Light",
    description: "You actually went. Log your first quest.",
    sticker: "first-light",
    target: 1,
    value: (s) => s.completedCount,
  },
  {
    id: "ten-logged",
    label: "Ten logged",
    description: "Ten quests logged, no repeats.",
    sticker: "ten-logged",
    target: 10,
    value: (s) => s.completedCount,
  },
  {
    id: "fifty-logged",
    label: "Fifty logged",
    description: "Fifty quests logged. That is a habit now.",
    sticker: "fifty-logged",
    target: 50,
    value: (s) => s.completedCount,
  },
  {
    id: "long-hauler",
    label: "Long hauler",
    description: "A hundred kilometres under your boots.",
    sticker: "long-hauler",
    target: 100,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "thousand-metres",
    label: "Five thousand up",
    description: "Five thousand metres of ascent, all told.",
    sticker: "thousand-metres",
    target: 5000,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "cartographer",
    label: "Cartographer",
    description: "Five different regions.",
    sticker: "cartographer",
    target: 5,
    value: (s) => s.regions,
  },
  {
    id: "gorge-rat",
    label: "Gorge Rat",
    description: "Three quests with water in them.",
    sticker: "gorge-rat",
    target: 3,
    value: (s) => s.waterfalls,
  },
  {
    id: "hundred-logged",
    label: "Hundred logged",
    description: "One hundred quests. Go outside more.",
    sticker: "hundred-logged",
    target: 100,
    value: (s) => s.completedCount,
  },
];

export function getAchievements(stats: UserStats): Achievement[] {
  return DEFINITIONS.map((definition) => {
    const value = definition.value(stats);
    const earned = value >= definition.target;
    const unit = definition.unit ? ` ${definition.unit}` : "";
    return {
      id: definition.id,
      label: definition.label,
      description: definition.description,
      sticker: definition.sticker,
      progress: Math.min(1, definition.target === 0 ? 1 : value / definition.target),
      earned,
      progressLabel: earned
        ? "Earned"
        : `${Math.min(value, definition.target)}${unit} / ${definition.target}${unit}`,
    };
  });
}

export function countEarned(achievements: Achievement[]): number {
  return achievements.filter((a) => a.earned).length;
}
