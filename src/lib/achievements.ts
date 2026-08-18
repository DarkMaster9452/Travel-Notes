import { STICKER_ALLOWANCE, type PlanId } from "@/lib/config";
import type { UserStats } from "@/lib/quest/service";

/**
 * Achievements are *derived*, never stored.
 *
 * Every badge is a pure function of the stats we already compute from quest
 * history, so there is no unlock table to migrate, nothing to backfill, and no
 * way for a badge to drift out of sync with the thing it claims to represent.
 * Recomputing on read is cheap; the stats query is one round trip either way.
 *
 * The order of `DEFINITIONS` is the order of the sheet, and the sheet is
 * ordered by reach: the first row is what a free account can hold, the first
 * ten what Explorer reaches, and the whole sheet is Ultra. That means a plan's
 * allowance is a slice of one list rather than three separate lists that could
 * disagree about what a sticker is.
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
  /**
   * Beyond this account's plan. Distinct from "not earned yet": the work
   * wouldn't unlock it, an upgrade would. The sheet blurs these rather than
   * hiding them — a sticker you can see you can't reach is the mechanic.
   */
  planLocked: boolean;
  /** The lowest plan that can hold this sticker. */
  requiredPlan: PlanId;
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
  /* ---- The first row. Free accounts hold these. ------------------------ */
  {
    id: "first-light",
    label: "First Light",
    description: "You actually went. Log your first quest.",
    sticker: "first-light",
    target: 1,
    value: (s) => s.completedCount,
  },
  {
    id: "second-wind",
    label: "Second wind",
    description: "Three logged. The first one wasn't a fluke.",
    sticker: "second-wind",
    target: 3,
    value: (s) => s.completedCount,
  },
  {
    id: "into-the-trees",
    label: "Into the trees",
    description: "A quest that spent its day under a canopy.",
    sticker: "into-the-trees",
    target: 1,
    value: (s) => s.forests,
  },
  {
    id: "first-ridge",
    label: "First ridge",
    description: "One quest with a mountain in it.",
    sticker: "first-ridge",
    target: 1,
    value: (s) => s.mountains,
  },
  {
    id: "twenty-five",
    label: "Twenty-five",
    description: "Twenty-five kilometres, all told.",
    sticker: "twenty-five",
    target: 25,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "thousand-up",
    label: "A thousand up",
    description: "A thousand metres of ascent behind you.",
    sticker: "thousand-metres",
    target: 1000,
    value: (s) => s.elevation,
    unit: "m",
  },

  /* ---- Explorer's four. ------------------------------------------------ */
  {
    id: "ten-logged",
    label: "Ten logged",
    description: "Ten quests logged, no repeats.",
    sticker: "ten-logged",
    target: 10,
    value: (s) => s.completedCount,
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
    id: "long-hauler",
    label: "Long hauler",
    description: "A hundred kilometres under your boots.",
    sticker: "long-hauler",
    target: 100,
    value: (s) => s.kmExplored,
    unit: "km",
  },

  /* ---- The rest of the sheet. Ultra. ----------------------------------- */
  {
    id: "twenty-five-logged",
    label: "Twenty-five logged",
    description: "Twenty-five quests. A season of them.",
    sticker: "twenty-five-logged",
    target: 25,
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
    id: "hundred-logged",
    label: "Hundred logged",
    description: "One hundred quests. Go outside more.",
    sticker: "hundred-logged",
    target: 100,
    value: (s) => s.completedCount,
  },
  {
    id: "two-hundred-logged",
    label: "Two hundred",
    description: "Two hundred logged. We've run out of things to say.",
    sticker: "two-hundred-logged",
    target: 200,
    value: (s) => s.completedCount,
  },
  {
    id: "five-thousand-up",
    label: "Five thousand up",
    description: "Five thousand metres of ascent, all told.",
    sticker: "five-thousand-up",
    target: 5000,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "everest",
    label: "Sea level to summit",
    description: "8,848 metres climbed. The height of the big one.",
    sticker: "everest",
    target: 8848,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "ten-thousand-up",
    label: "Ten thousand up",
    description: "Ten thousand metres of ascent.",
    sticker: "ten-thousand-up",
    target: 10000,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "twenty-five-thousand-up",
    label: "Twenty-five thousand",
    description: "Twenty-five thousand metres up. Three Everests.",
    sticker: "twenty-five-thousand-up",
    target: 25000,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "two-fifty-km",
    label: "Two-fifty",
    description: "Two hundred and fifty kilometres walked.",
    sticker: "two-fifty-km",
    target: 250,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "five-hundred-km",
    label: "Five hundred",
    description: "Five hundred kilometres. A country's worth.",
    sticker: "five-hundred-km",
    target: 500,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "thousand-km",
    label: "Four figures",
    description: "One thousand kilometres logged.",
    sticker: "thousand-km",
    target: 1000,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "ten-regions",
    label: "Ten regions",
    description: "Ten different regions visited.",
    sticker: "ten-regions",
    target: 10,
    value: (s) => s.regions,
  },
  {
    id: "twenty-regions",
    label: "Twenty regions",
    description: "Twenty regions. You are running out of map.",
    sticker: "twenty-regions",
    target: 20,
    value: (s) => s.regions,
  },
  {
    id: "border-crosser",
    label: "Border crosser",
    description: "A quest in a second country.",
    sticker: "border-crosser",
    target: 2,
    value: (s) => s.countries,
  },
  {
    id: "five-countries",
    label: "Five countries",
    description: "Five countries on the log.",
    sticker: "five-countries",
    target: 5,
    value: (s) => s.countries,
  },
  {
    id: "peak-bagger",
    label: "Peak bagger",
    description: "Ten quests with a mountain in them.",
    sticker: "peak-bagger",
    target: 10,
    value: (s) => s.mountains,
  },
  {
    id: "deep-woods",
    label: "Deep woods",
    description: "Ten quests under trees.",
    sticker: "deep-woods",
    target: 10,
    value: (s) => s.forests,
  },
  {
    id: "lake-district",
    label: "Lake district",
    description: "Five quests with a lake on the route.",
    sticker: "lake-district",
    target: 5,
    value: (s) => s.lakes,
  },
  {
    id: "waterfall-chaser",
    label: "Waterfall chaser",
    description: "Ten quests with falling water.",
    sticker: "waterfall-chaser",
    target: 10,
    value: (s) => s.waterfalls,
  },
  {
    id: "ruin-hunter",
    label: "Ruin hunter",
    description: "Five castles or ruins reached.",
    sticker: "ruin-hunter",
    target: 5,
    value: (s) => s.ruins,
  },
];

/** How far down the sheet a plan can reach. */
export function stickerAllowance(plan: PlanId): number {
  return Math.min(STICKER_ALLOWANCE[plan], DEFINITIONS.length);
}

/** The lowest plan whose allowance covers the sticker at `index`. */
function requiredPlanFor(index: number): PlanId {
  if (index < STICKER_ALLOWANCE.free) return "free";
  if (index < STICKER_ALLOWANCE.explorer) return "explorer";
  return "ultra";
}

/**
 * The whole sheet, with this account's state on it.
 *
 * Always returns every definition, including the ones the plan can't reach —
 * the sheet is meant to be seen in full, with the unreachable ones blurred.
 * Callers that need only the reachable slice can filter on `planLocked`.
 */
export function getAchievements(stats: UserStats, plan: PlanId = "ultra"): Achievement[] {
  const allowance = stickerAllowance(plan);

  return DEFINITIONS.map((definition, index) => {
    const value = definition.value(stats);
    const planLocked = index >= allowance;
    // A sticker beyond the plan is never "earned", however far along the
    // underlying stat is — otherwise upgrading would hand over a fistful of
    // stickers the account was quietly holding all along, and the count on
    // the free sheet would be describing work the account can't collect.
    const earned = !planLocked && value >= definition.target;
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
      planLocked,
      requiredPlan: requiredPlanFor(index),
    };
  });
}

export function countEarned(achievements: Achievement[]): number {
  return achievements.filter((a) => a.earned).length;
}

/** How many stickers this account could hold if it earned them all. */
export function countReachable(achievements: Achievement[]): number {
  return achievements.filter((a) => !a.planLocked).length;
}
