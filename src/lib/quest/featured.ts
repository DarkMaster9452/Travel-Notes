import "server-only";

import { db } from "@/lib/db";
import {
  generateQuest,
  QuestGenerationError,
  type GeneratedQuest,
  type HistoryItem,
} from "@/lib/quest/engine";
import { getEntitlement } from "@/lib/entitlements";
import type { PlanId } from "@/lib/config";
import { paletteForSrc } from "@/lib/images";
import { toQuestSummary } from "@/types/quest";
import type { QuestSummary } from "@/types/quest";

/**
 * The weekly and monthly featured quests.
 *
 * These are *not* generated on demand and never persisted: the seed is derived
 * from the period plus the user id, so the same person opening the dashboard on
 * Monday and on Thursday sees the same quest, and two people see different
 * ones. That makes them a free showcase — they cost no quota, need no write,
 * and reset on their own when the week or month rolls over.
 */

export type FeaturedPeriod = "week" | "month";

/** Generation order. Fixed, so a period's quest never depends on who asked. */
const CANONICAL_ORDER: FeaturedPeriod[] = ["week", "month"];

/** ISO-8601 week key, e.g. `2026-W33`. Weeks start on Monday. */
export function isoWeekKey(date: Date): string {
  // Shift onto the Thursday of the same week: the ISO year is whichever year
  // that Thursday falls in, which is what makes turn-of-year weeks behave.
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
  const week =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Calendar month key, e.g. `2026-08`. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function periodKey(period: FeaturedPeriod, now = new Date()): string {
  return period === "week" ? isoWeekKey(now) : monthKey(now);
}

/** When the current period rolls over — used for the "resets in" copy. */
export function periodEnds(period: FeaturedPeriod, now = new Date()): Date {
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  const daysUntilMonday = ((7 - ((now.getDay() + 6) % 7)) % 7) || 7;
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);
  return next;
}

export type FeaturedQuest = {
  period: FeaturedPeriod;
  key: string;
  /** Absent when the slot was filled by an admin rather than generated. */
  quest: GeneratedQuest | null;
  summary: QuestSummary;
  /** True when an admin booked this slot. Those are the same quest for
   *  everybody; a generated one is different per account. */
  scheduled: boolean;
};

/** Plan ranks, for the audience gate on a scheduled slot. */
const PLAN_RANK: Record<string, number> = { FREE: 0, EXPLORER: 1, ULTRA: 2 };

/**
 * Quests an admin has booked into the current week and month.
 *
 * A booked slot wins over a generated one: the whole reason to schedule a
 * quest is that everybody gets *that* quest, and a per-account generation
 * would quietly ignore the booking. Slots aimed at a higher tier than this
 * account holds are skipped, and the generator fills the gap — a free account
 * seeing an empty panel where an Ultra-only monthly sits would be worse than
 * seeing a quest of its own.
 */
async function getScheduledFeatured(
  plan: PlanId,
  now: Date,
): Promise<Map<FeaturedPeriod, FeaturedQuest>> {
  const rank = PLAN_RANK[plan.toUpperCase()] ?? 0;

  const rows = await db.questSchedule.findMany({
    where: {
      OR: [
        { period: "WEEKLY", slotKey: isoWeekKey(now) },
        { period: "MONTHLY", slotKey: monthKey(now) },
      ],
      openAt: { lte: now },
      closeAt: { gt: now },
    },
    include: { quest: true },
  });

  const found = new Map<FeaturedPeriod, FeaturedQuest>();
  for (const row of rows) {
    if ((PLAN_RANK[row.audience] ?? 0) > rank) continue;
    const period: FeaturedPeriod = row.period === "WEEKLY" ? "week" : "month";
    found.set(period, {
      period,
      key: row.slotKey,
      quest: null,
      summary: toQuestSummary(row.quest),
      scheduled: true,
    });
  }
  return found;
}

/** Project a generated (unsaved) quest into the shape the quest UI renders. */
function toSummary(quest: GeneratedQuest, id: string): QuestSummary {
  return {
    id,
    number: null,
    title: quest.title,
    subtitle: quest.subtitle,
    location: quest.location,
    region: quest.region,
    distance: quest.distance,
    duration: quest.duration,
    difficulty: quest.difficulty,
    elevationGain: quest.elevationGain,
    travelTime: quest.travelTime,
    coverImage: quest.coverImage,
    palette: paletteForSrc(quest.coverImage),
    features: quest.features,
    terrain: quest.terrain,
    mood: quest.mood,
    objective: quest.objective,
    generatedAt: null,
  };
}

/**
 * Featured quests for a user. Returns an empty array rather than throwing when
 * preferences are missing or the engine can't place a quest — a dashboard
 * panel is never worth a 500.
 */
export async function getFeaturedQuests(
  userId: string,
  periods: FeaturedPeriod[] = ["week", "month"],
  now = new Date(),
): Promise<FeaturedQuest[]> {
  // What an admin booked comes first, and is the same quest for everyone who
  // can see it. Only the slots they left empty fall through to the generator.
  const { plan } = await getEntitlement(userId);
  const scheduled = await getScheduledFeatured(plan, now);

  const preferences = await db.userPreferences.findUnique({ where: { userId } });
  if (!preferences) {
    return CANONICAL_ORDER.map((period) => scheduled.get(period)).filter(
      (entry): entry is FeaturedQuest => entry !== undefined && periods.includes(entry.period),
    );
  }

  const enginePreferences = {
    homeLocation: preferences.homeLocation,
    homeLatitude: preferences.homeLatitude,
    homeLongitude: preferences.homeLongitude,
    maxDistance: preferences.maxDistance,
    preferredDistance: preferences.preferredDistance,
    difficulty: preferences.difficulty,
    preferredTerrain: preferences.preferredTerrain,
    preferredActivity: preferences.preferredActivity,
    preferredEnvironment: preferences.preferredEnvironment,
    timeAvailable: preferences.timeAvailable,
    transport: preferences.transport,
    questStyle: preferences.questStyle,
    sunsetPreference: preferences.sunsetPreference,
    waterPreference: preferences.waterPreference,
    elevationPreference: preferences.elevationPreference,
  };

  const featured: FeaturedQuest[] = [];

  // Each period is generated against the ones already picked, so the weekly and
  // monthly cards can't land on the same place — or reuse the same title and
  // objective template — just because neither generation knew about the other.
  const preceding: HistoryItem[] = [];

  // Always walk the full chain in canonical order, then filter. Generating only
  // the requested period would give it a different (shorter) history and so a
  // different quest — the /monthly page has to agree with the dashboard card.
  for (const period of CANONICAL_ORDER) {
    const booked = scheduled.get(period);
    if (booked) {
      featured.push(booked);
      // Still counted as history for the *next* period's generation, so a
      // generated weekly can't land on the same place as a booked monthly.
      preceding.push({
        locationId: booked.summary.location,
        region: booked.summary.region,
        features: booked.summary.features,
        terrain: booked.summary.terrain,
        difficulty: booked.summary.difficulty,
        distance: booked.summary.distance,
        signature: `scheduled:${booked.key}`,
        title: booked.summary.title,
        titleTemplateId: null,
        objectiveTemplateId: null,
        bonusTemplateId: null,
        generatedAt: now,
      });
      continue;
    }

    const key = periodKey(period, now);
    try {
      const { quest } = generateQuest({
        preferences: enginePreferences,
        seed: `featured:${period}:${key}:${userId}`,
        history: preceding,
        now,
      });
      featured.push({
        period,
        key,
        quest,
        summary: toSummary(quest, `${period}-${key}`),
        scheduled: false,
      });
      preceding.push({
        locationId: quest.routeData.locationId,
        region: quest.region,
        features: quest.features,
        terrain: quest.terrain,
        difficulty: quest.difficulty,
        distance: quest.distance,
        signature: quest.signature,
        title: quest.title,
        titleTemplateId: quest.routeData.templates.title,
        objectiveTemplateId: quest.routeData.templates.objective,
        bonusTemplateId: quest.routeData.templates.bonus,
        generatedAt: now,
      });
    } catch (error) {
      if (!(error instanceof QuestGenerationError)) throw error;
      // No placeable quest for these preferences this period — skip the panel.
    }
  }

  return featured.filter((entry) => periods.includes(entry.period));
}

export async function getFeaturedQuest(
  userId: string,
  period: FeaturedPeriod,
  now = new Date(),
): Promise<FeaturedQuest | null> {
  const [featured] = await getFeaturedQuests(userId, [period], now);
  return featured ?? null;
}
