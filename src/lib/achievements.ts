import { STICKER_ALLOWANCE, type PlanId } from "@/lib/config";
import { en } from "@/lib/i18n/en";
import type { Messages } from "@/lib/i18n";
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
  /** Taken back by an admin. Distinct again from both other locked states:
   *  the work was done and the plan reaches it, but it has been withdrawn. */
  revoked: boolean;
  /**
   * This one is actually printed and posted.
   *
   * Most of the sheet is ink on a screen. A minority are real die-cut stickers
   * that go in the envelope, and somebody deciding whether a plan is worth
   * paying for should be able to see which is which — "thirty stickers" and
   * "thirty stickers you will hold" are different offers.
   */
  printed: boolean;
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
  /** Goes in the envelope. See `Achievement.printed`. */
  printed?: boolean;
};

const DEFINITIONS: Definition[] = [
  /* ---- The first row. Free accounts hold these. ------------------------ */
  {
    id: "first-light",
    label: "First Light",
    description: "You actually went. Log your first quest.",
    sticker: "first-light",
    target: 1,
    printed: true,
    value: (s) => s.completedCount,
  },
  {
    id: "second-wind",
    label: "Second wind",
    description: "Five logged. The first one was not a fluke.",
    sticker: "second-wind",
    target: 5,
    value: (s) => s.completedCount,
  },
  {
    id: "into-the-trees",
    label: "Into the trees",
    description: "Three days spent under a canopy.",
    sticker: "into-the-trees",
    target: 3,
    value: (s) => s.forests,
  },
  {
    id: "first-ridge",
    label: "First ridge",
    description: "Three quests with a mountain in them.",
    sticker: "first-ridge",
    target: 3,
    value: (s) => s.mountains,
  },
  {
    id: "twenty-five",
    label: "Sixty",
    description: "Sixty kilometres, all told.",
    sticker: "twenty-five",
    target: 60,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "thousand-up",
    label: "Two and a half",
    description: "Two and a half thousand metres of ascent behind you.",
    sticker: "thousand-metres",
    target: 2500,
    printed: true,
    value: (s) => s.elevation,
    unit: "m",
  },

  /* ---- Explorer's four. ------------------------------------------------ */
  {
    id: "ten-logged",
    label: "Twenty-five logged",
    description: "Twenty-five quests logged, no repeats.",
    sticker: "ten-logged",
    target: 25,
    printed: true,
    value: (s) => s.completedCount,
  },
  {
    id: "cartographer",
    label: "Cartographer",
    description: "Eight different regions.",
    sticker: "cartographer",
    target: 8,
    value: (s) => s.regions,
  },
  {
    id: "gorge-rat",
    label: "Gorge Rat",
    description: "Six quests with water in them.",
    sticker: "gorge-rat",
    target: 6,
    value: (s) => s.waterfalls,
  },
  {
    id: "long-hauler",
    label: "Long hauler",
    description: "Two hundred and fifty kilometres under your boots.",
    sticker: "long-hauler",
    target: 250,
    printed: true,
    value: (s) => s.kmExplored,
    unit: "km",
  },

  /* ---- The rest of the sheet. Ultra. ----------------------------------- */
  {
    id: "twenty-five-logged",
    label: "Sixty logged",
    description: "Sixty quests. More than a season of them.",
    sticker: "twenty-five-logged",
    target: 60,
    value: (s) => s.completedCount,
  },
  {
    id: "fifty-logged",
    label: "Hundred and twenty",
    description: "A hundred and twenty quests logged.",
    sticker: "fifty-logged",
    target: 120,
    value: (s) => s.completedCount,
  },
  {
    id: "hundred-logged",
    label: "Two hundred and fifty",
    description: "Two hundred and fifty quests. Go outside less, perhaps.",
    sticker: "hundred-logged",
    target: 250,
    printed: true,
    value: (s) => s.completedCount,
  },
  {
    id: "two-hundred-logged",
    label: "Five hundred",
    description: "Five hundred logged. We have run out of things to say.",
    sticker: "two-hundred-logged",
    target: 500,
    printed: true,
    value: (s) => s.completedCount,
  },
  {
    id: "five-thousand-up",
    label: "Twelve thousand up",
    description: "Twelve thousand metres of ascent, all told.",
    sticker: "five-thousand-up",
    target: 12000,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "everest",
    label: "Sea level to summit",
    description: "8,848 metres climbed. The height of the big one.",
    sticker: "everest",
    target: 8848,
    printed: true,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "ten-thousand-up",
    label: "Twenty-five thousand up",
    description: "Twenty-five thousand metres of ascent.",
    sticker: "ten-thousand-up",
    target: 25000,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "twenty-five-thousand-up",
    label: "Sixty thousand",
    description: "Sixty thousand metres up. Nearly seven Everests.",
    sticker: "twenty-five-thousand-up",
    target: 60000,
    printed: true,
    value: (s) => s.elevation,
    unit: "m",
  },
  {
    id: "two-fifty-km",
    label: "Six hundred",
    description: "Six hundred kilometres walked.",
    sticker: "two-fifty-km",
    target: 600,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "five-hundred-km",
    label: "Twelve hundred",
    description: "Twelve hundred kilometres. A long country's worth.",
    sticker: "five-hundred-km",
    target: 1200,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "thousand-km",
    label: "Four figures, twice",
    description: "Two and a half thousand kilometres logged.",
    sticker: "thousand-km",
    target: 2500,
    printed: true,
    value: (s) => s.kmExplored,
    unit: "km",
  },
  {
    id: "ten-regions",
    label: "Fifteen regions",
    description: "Fifteen different regions visited.",
    sticker: "ten-regions",
    target: 15,
    value: (s) => s.regions,
  },
  {
    id: "twenty-regions",
    label: "Thirty regions",
    description: "Thirty regions. You are running out of map.",
    sticker: "twenty-regions",
    target: 30,
    printed: true,
    value: (s) => s.regions,
  },
  {
    id: "border-crosser",
    label: "Border crosser",
    description: "A quest in a second country.",
    sticker: "border-crosser",
    target: 2,
    printed: true,
    value: (s) => s.countries,
  },
  {
    id: "five-countries",
    label: "Eight countries",
    description: "Eight countries on the log.",
    sticker: "five-countries",
    target: 8,
    value: (s) => s.countries,
  },
  {
    id: "peak-bagger",
    label: "Peak bagger",
    description: "Twenty-five quests with a mountain in them.",
    sticker: "peak-bagger",
    target: 25,
    printed: true,
    value: (s) => s.mountains,
  },
  {
    id: "deep-woods",
    label: "Deep woods",
    description: "Twenty-five quests under trees.",
    sticker: "deep-woods",
    target: 25,
    value: (s) => s.forests,
  },
  {
    id: "lake-district",
    label: "Lake district",
    description: "Twelve quests with a lake on the route.",
    sticker: "lake-district",
    target: 12,
    value: (s) => s.lakes,
  },
  {
    id: "waterfall-chaser",
    label: "Waterfall chaser",
    description: "Twenty-five quests with falling water.",
    sticker: "waterfall-chaser",
    target: 25,
    value: (s) => s.waterfalls,
  },
  {
    id: "ruin-hunter",
    label: "Ruin hunter",
    description: "Twelve castles or ruins reached.",
    sticker: "ruin-hunter",
    target: 12,
    value: (s) => s.ruins,
  },

  /* ---- The rare tier. --------------------------------------------------
     Everything above this line is a ladder: walk further, climb higher, go
     again. These six are not. They ask what *kind* of walker somebody is —
     whether they go in February as well as July, whether they take the hard
     one occasionally, whether they keep turning up. None of them can be
     reached by one enormous weekend, which is the point of them, and every
     one is printed. */
  {
    id: "every-grade",
    label: "All four grades",
    description: "Easy, Moderate, Hard and Expert — one of each, at least once.",
    sticker: "field-notes",
    target: 4,
    value: (s) => s.gradesWalked,
    printed: true,
  },
  {
    id: "four-seasons",
    label: "Four seasons",
    description: "A quest in winter, in spring, in summer and in autumn.",
    sticker: "winter-ridge",
    target: 4,
    value: (s) => s.seasons,
    printed: true,
  },
  {
    id: "twelve-months",
    label: "Every month",
    description: "You have walked in all twelve months of the year.",
    sticker: "twelve-months",
    target: 12,
    value: (s) => s.monthsWalked,
    printed: true,
  },
  {
    id: "unbroken",
    label: "Unbroken",
    description: "Eight weeks running with something logged in every one.",
    sticker: "unbroken",
    target: 8,
    value: (s) => s.bestStreakWeeks,
    printed: true,
  },
  {
    id: "all-terrain",
    label: "All terrain",
    description: "Mountain, forest, lake, waterfall and ruin. Every kind of ground.",
    sticker: "dawn-start",
    target: 5,
    value: (s) => s.terrainsWalked,
    printed: true,
  },
  {
    id: "the-long-year",
    label: "The long year",
    description: "A thousand kilometres inside a single calendar year.",
    sticker: "honest-retreat",
    target: 1000,
    value: (s) => s.bestYearKm,
    unit: "km",
    printed: true,
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
export function getAchievements(
  stats: UserStats,
  plan: PlanId = "ultra",
  /** Achievement ids an admin has taken back from this account. */
  revokedIds: readonly string[] = [],
  /**
   * The reader's language. Ids are frozen and the numbers live here, but the
   * words come from the dictionary — keyed by the same id, so a sticker keeps
   * its identity across all three languages and across a retune.
   */
  t: Messages = en,
): Achievement[] {
  const allowance = stickerAllowance(plan);
  const revokedSet = new Set(revokedIds);

  return DEFINITIONS.map((definition, index) => {
    const value = definition.value(stats);
    const planLocked = index >= allowance;
    const revoked = revokedSet.has(definition.id);
    // A sticker beyond the plan is never "earned", however far along the
    // underlying stat is — otherwise upgrading would hand over a fistful of
    // stickers the account was quietly holding all along, and the count on
    // the free sheet would be describing work the account can't collect.
    const earned = !planLocked && !revoked && value >= definition.target;
    const unit = definition.unit ? ` ${definition.unit}` : "";

    const copy = t.sheet[definition.id as keyof Messages["sheet"]] ?? {
      label: definition.label,
      description: definition.description,
    };

    return {
      id: definition.id,
      label: copy.label,
      description: copy.description,
      sticker: definition.sticker,
      progress: Math.min(1, definition.target === 0 ? 1 : value / definition.target),
      earned,
      progressLabel: revoked
        ? t.stickers.withdrawn
        : earned
          ? t.stickers.earned
          : t.stickers.progress(
              `${Math.min(value, definition.target)}${unit}`,
              `${definition.target}${unit}`,
            ),
      planLocked,
      requiredPlan: requiredPlanFor(index),
      revoked,
      printed: definition.printed === true,
    };
  });
}

/** The ones that are really printed, in sheet order. */
export function printedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.filter((entry) => entry.printed);
}

export function countEarned(achievements: Achievement[]): number {
  return achievements.filter((a) => a.earned).length;
}

/** How many stickers this account could hold if it earned them all. */
export function countReachable(achievements: Achievement[]): number {
  return achievements.filter((a) => !a.planLocked).length;
}
