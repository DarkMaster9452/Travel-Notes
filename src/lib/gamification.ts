/**
 * The game layer: categories, difficulty scale, achievements, prizes and the
 * rules people must accept.
 *
 * Thresholds live here rather than in the database so they can be tuned in a
 * pull request instead of a migration. `UserAchievement` only records *that*
 * something was unlocked.
 *
 * Safe to import from client components — no secrets.
 */

export const BRAND = {
  name: "STOPA",
  tagline: "Objavuj Slovensko. Zbieraj body.",
} as const;

// ---------------------------------------------------------------------------
// Quest categories
// ---------------------------------------------------------------------------

export type QuestCategoryId = "SUMMIT" | "WATERFALL" | "CASTLE" | "MICRO";

/**
 * Each category carries a trail-marker colour, the way Slovak hiking routes
 * are waymarked — the little coloured tile on every card.
 */
export const CATEGORIES: Record<
  QuestCategoryId,
  { marker: string; defaultPoints: number }
> = {
  SUMMIT: { marker: "#c0392b", defaultPoints: 250 },
  WATERFALL: { marker: "#2f6fa8", defaultPoints: 180 },
  CASTLE: { marker: "#e8a13a", defaultPoints: 200 },
  MICRO: { marker: "#4a7c56", defaultPoints: 80 },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as QuestCategoryId[];

// ---------------------------------------------------------------------------
// Difficulty scale (hardest → easiest, as the brief asks)
// ---------------------------------------------------------------------------

export type DifficultyId = "BRUTAL" | "HARD" | "MODERATE" | "EASY" | "VERY_EASY";

export const DIFFICULTY_ORDER: DifficultyId[] = [
  "BRUTAL",
  "HARD",
  "MODERATE",
  "EASY",
  "VERY_EASY",
];

/** 1 = very easy … 5 = brutal. Used to average crowd-sourced ratings. */
export const DIFFICULTY_WEIGHT: Record<DifficultyId, number> = {
  VERY_EASY: 1,
  EASY: 2,
  MODERATE: 3,
  HARD: 4,
  BRUTAL: 5,
};

export function difficultyFromWeight(average: number): DifficultyId {
  const rounded = Math.round(average);
  return (
    (Object.entries(DIFFICULTY_WEIGHT).find(([, w]) => w === rounded)?.[0] as DifficultyId) ??
    "MODERATE"
  );
}

export type ComparisonId = "HARDER" | "SIMILAR" | "EASIER" | "FIRST";

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export type Achievement = {
  id: string;
  icon: string;
  /** Points needed, or null when the rule is a count of completed quests. */
  points?: number;
  quests?: number;
  /** Only counts approved submissions in this category. */
  category?: QuestCategoryId;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_step", icon: "👣", quests: 1 },
  { id: "three_trails", icon: "🥾", quests: 3 },
  { id: "ten_trails", icon: "🗺️", quests: 10 },
  { id: "points_500", icon: "🔥", points: 500 },
  { id: "points_1500", icon: "⚡", points: 1500 },
  { id: "points_3000", icon: "🏔️", points: 3000 },
  { id: "summit_hunter", icon: "⛰️", quests: 3, category: "SUMMIT" },
  { id: "waterfall_chaser", icon: "💧", quests: 3, category: "WATERFALL" },
  { id: "castle_keeper", icon: "🏰", quests: 3, category: "CASTLE" },
  { id: "sharp_eye", icon: "🔍", quests: 3, category: "MICRO" },
];

export type AchievementProgress = {
  achievement: Achievement;
  unlocked: boolean;
  current: number;
  target: number;
};

/**
 * Work out which achievements a user has earned.
 *
 * Pure so the same function decides what to persist on the server and what to
 * render as progress in the UI — the two can never disagree.
 */
export function evaluateAchievements(stats: {
  points: number;
  approvedQuests: number;
  byCategory: Record<string, number>;
}): AchievementProgress[] {
  return ACHIEVEMENTS.map((achievement) => {
    if (achievement.points != null) {
      return {
        achievement,
        unlocked: stats.points >= achievement.points,
        current: Math.min(stats.points, achievement.points),
        target: achievement.points,
      };
    }

    const target = achievement.quests ?? 1;
    const current = achievement.category
      ? (stats.byCategory[achievement.category] ?? 0)
      : stats.approvedQuests;

    return { achievement, unlocked: current >= target, current: Math.min(current, target), target };
  });
}

// ---------------------------------------------------------------------------
// Prizes
// ---------------------------------------------------------------------------

export type Prize = { id: string; points: number; marker: string };

export const PRIZES: Prize[] = [
  { id: "stickers", points: 500, marker: "#4a7c56" },
  { id: "socks", points: 1500, marker: "#2f6fa8" },
  { id: "backpack", points: 3000, marker: "#e8a13a" },
  { id: "cabin", points: 6000, marker: "#c0392b" },
];

// ---------------------------------------------------------------------------
// Weekly cycle
// ---------------------------------------------------------------------------

/** A quest is live from its publish time until it closes. */
export function isQuestOpen(quest: { publishedAt: Date; closesAt: Date }, now = new Date()) {
  return quest.publishedAt.getTime() <= now.getTime() && quest.closesAt.getTime() > now.getTime();
}

/** Monday 08:00 local — the moment a new challenge appears. */
export function nextMondayRelease(from = new Date()): Date {
  const date = new Date(from);
  date.setHours(8, 0, 0, 0);
  const daysUntilMonday = (8 - date.getDay()) % 7;
  date.setDate(date.getDate() + (daysUntilMonday === 0 && from.getTime() < date.getTime() ? 0 : daysUntilMonday || 7));
  return date;
}

/** Sunday 23:59 of the week a quest was published in. */
export function weekCloseFor(publishedAt: Date): Date {
  const close = new Date(publishedAt);
  const daysUntilSunday = (7 - close.getDay()) % 7;
  close.setDate(close.getDate() + daysUntilSunday);
  close.setHours(23, 59, 0, 0);
  return close;
}

/** Rules are versioned: bump this and everyone re-accepts. */
export const RULES_VERSION = 1;

export const REACTIONS = ["🔥", "👏", "😍", "💪"] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];
