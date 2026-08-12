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
  icon: string;
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
  icon: string;
  target: number;
  value: (stats: UserStats) => number;
  unit?: string;
};

const DEFINITIONS: Definition[] = [
  {
    id: "first-steps",
    label: "First steps",
    description: "Complete your first quest.",
    icon: "🥾",
    target: 1,
    value: (s) => s.completedCount,
  },
  {
    id: "regular",
    label: "Regular",
    description: "Complete five quests.",
    icon: "🧭",
    target: 5,
    value: (s) => s.completedCount,
  },
  {
    id: "seasoned",
    label: "Seasoned",
    description: "Complete twenty-five quests.",
    icon: "🏔️",
    target: 25,
    value: (s) => s.completedCount,
  },
  {
    id: "distance",
    label: "Long hauler",
    description: "Cover 100 km across completed quests.",
    icon: "📏",
    target: 100,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "climber",
    label: "Climber",
    description: "Climb 5 000 m of ascent.",
    icon: "⛰️",
    target: 5000,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "explorer",
    label: "Region hopper",
    description: "Visit five different regions.",
    icon: "🗺️",
    target: 5,
    value: (s) => s.regions,
  },
  {
    id: "water",
    label: "Waterfall hunter",
    description: "Find three waterfalls.",
    icon: "💧",
    target: 3,
    value: (s) => s.waterfalls,
  },
  {
    id: "collector",
    label: "Collector",
    description: "Save ten quests for later.",
    icon: "🔖",
    target: 10,
    value: (s) => s.savedCount,
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
      icon: definition.icon,
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
