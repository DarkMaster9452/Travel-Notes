import "server-only";

import type { Prisma } from "@prisma/client";

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
    latitude: quest.latitude,
    longitude: quest.longitude,
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
    // A generated quest has no car park. Nobody has walked it to find one,
    // and inventing coordinates for one would be the worst kind of made-up
    // detail: the sort somebody would drive to.
    parkingName: null,
    parkingLat: null,
    parkingLng: null,
    parkingNote: null,
    approachTime: null,
    transitNote: null,
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

/* -------------------------------------------------------------------------- */
/* Filing proof against a featured quest                                       */
/* -------------------------------------------------------------------------- */

/**
 * The quest row a featured slot's proof can be filed against.
 *
 * A booked slot already is a row — everybody gets the same quest, and its id
 * is the one on the page. A generated one is not: it is derived from the
 * period and the account, held nowhere, and costs no quota precisely because
 * nothing is written. That was fine while the featured quests were only
 * something to look at, and stops being fine the moment somebody can log one:
 * a submission needs a quest to point at.
 *
 * So the row is written on first use and not before. The signature is the
 * seed the quest was generated from, which makes the write idempotent without
 * a second identity to keep in step — filing again, or filing after an
 * account came back to the same week, finds the row rather than making a
 * second one.
 *
 * `published: false` keeps it out of the browsable catalogue. It is one
 * account's copy of one week, not a quest anybody else should be offered.
 */
export async function ensureFeaturedQuestId(
  userId: string,
  period: FeaturedPeriod,
  now = new Date(),
): Promise<{ ok: true; questId: string; slotKey: string } | { ok: false; message: string }> {
  const featured = await getFeaturedQuest(userId, period, now);
  if (!featured) {
    return {
      ok: false,
      message: "There's no quest placed for this period — widen your range in settings.",
    };
  }

  if (featured.quest === null) {
    // Booked by an admin: the summary id is a real row.
    await claimFeatured(userId, featured.summary.id);
    return { ok: true, questId: featured.summary.id, slotKey: featured.key };
  }

  const generated = featured.quest;
  const signature = `featured:${period}:${featured.key}:${userId}`;

  const existing = await db.quest.findFirst({
    where: { signature },
    select: { id: true },
  });
  if (existing) {
    await claimFeatured(userId, existing.id);
    return { ok: true, questId: existing.id, slotKey: featured.key };
  }

  const quest = await db.quest.create({
    data: {
      title: generated.title,
      subtitle: generated.subtitle,
      description: generated.description,
      objective: generated.objective,
      bonus: generated.bonus,
      safetyNotes: generated.safetyNotes,
      location: generated.location,
      region: generated.region,
      country: generated.country,
      latitude: generated.latitude,
      longitude: generated.longitude,
      distance: generated.distance,
      duration: generated.duration,
      travelTime: generated.travelTime,
      difficulty: generated.difficulty,
      elevationGain: generated.elevationGain,
      terrain: generated.terrain,
      features: generated.features,
      mood: generated.mood,
      coverImage: generated.coverImage,
      routeData: generated.routeData as unknown as Prisma.InputJsonValue,
      signature,
      isShowcase: false,
      published: false,
      category: period === "week" ? "Weekly" : "Monthly",
    },
    select: { id: true },
  });

  await claimFeatured(userId, quest.id);
  return { ok: true, questId: quest.id, slotKey: featured.key };
}

/**
 * Record that this account has taken the featured quest.
 *
 * Taking one has always been implicit — everybody gets it, nobody unlocks it —
 * but proof needs somewhere to hang: an approval marks a `quest_history` row
 * complete, and the stats and the sticker sheet are computed from those rows.
 * So the row is written the moment somebody files, and never before. It costs
 * no quota: nothing was issued, they just went.
 */
async function claimFeatured(userId: string, questId: string): Promise<void> {
  await db.questHistory.upsert({
    where: { userId_questId: { userId, questId } },
    update: {},
    create: { userId, questId },
  });
}

/** `week`/`month` as the schedule spells it. */
function schedulePeriod(period: FeaturedPeriod): "WEEKLY" | "MONTHLY" {
  return period === "week" ? "WEEKLY" : "MONTHLY";
}

/**
 * Where this account's proof for a featured quest sits.
 *
 * Looked up by the same signature the row would have been written under, so
 * an account that has never logged a featured quest costs one indexed read
 * and no writes — the row is still only created when somebody actually files.
 */
export async function getFeaturedProofStatus(
  userId: string,
  featured: FeaturedQuest | null,
): Promise<{ status: "NONE" | "PENDING" | "APPROVED" | "REJECTED"; reviewNote: string | null }> {
  if (!featured) return { status: "NONE", reviewNote: null };

  let questId = featured.summary.id;
  if (featured.quest !== null) {
    const row = await db.quest.findFirst({
      where: { signature: `featured:${featured.period}:${featured.key}:${userId}` },
      select: { id: true },
    });
    if (!row) return { status: "NONE", reviewNote: null };
    questId = row.id;
  }

  const submission = await db.submission.findUnique({
    where: { userId_questId: { userId, questId } },
    select: { status: true, reviewNote: true },
  });

  return {
    status: submission?.status ?? "NONE",
    reviewNote: submission?.reviewNote ?? null,
  };
}

/**
 * How many people filed against this slot, and how many were approved.
 *
 * Only meaningful for a slot an admin booked — that is the case where
 * everyone is looking at the same quest. A generated featured quest is one
 * account's alone, and a count of "everyone else" who did it would be a count
 * of one, dressed up as a community.
 */
export async function getFeaturedSlotCounters(
  featured: FeaturedQuest | null,
): Promise<{ filed: number; approved: number } | null> {
  if (!featured || !featured.scheduled) return null;

  const where = { period: schedulePeriod(featured.period), slotKey: featured.key };
  const [filed, approved] = await Promise.all([
    db.submission.count({ where }),
    db.submission.count({ where: { ...where, status: "APPROVED" } }),
  ]);
  return { filed, approved };

// ---------------------------------------------------------------------------
// Making a featured quest real
// ---------------------------------------------------------------------------

/**
 * The marker written into `routeData` so a generated featured quest can be
 * found again. It has to be unique per account as well as per slot, because a
 * generated weekly is a different quest for every reader.
 */
function featuredMarker(period: FeaturedPeriod, key: string, userId: string): string {
  return `${period}:${key}:${userId}`;
}

/**
 * Turn the weekly or monthly into something proof can be filed against.
 *
 * Featured quests are ordinarily never written down: the seed is the period
 * plus the account, so the same quest reappears on every page load for free.
 * That was fine while they were a showcase. Now they must be logged, and a
 * submission needs a quest row to point at and a history row proving this
 * account was actually given it.
 *
 * So the slot is materialised the first time somebody opens it — lazily, not
 * on a schedule, so a period nobody looks at costs nothing. It is idempotent
 * on the marker, and it deliberately does **not** touch the free-quest counter:
 * the weekly and the monthly have never cost quota and making them compulsory
 * is not the moment to start charging for them.
 *
 * An admin-booked slot is already a real quest; all it needs is the history
 * row. That row is also what stops the same quest being generated for this
 * account again later — the anti-repetition engine reads history, so a
 * materialised weekly is remembered like any other.
 */
export async function materialiseFeatured(
  userId: string,
  featured: FeaturedQuest,
): Promise<string> {
  if (featured.scheduled) {
    // The booked case: one quest row, shared by everybody who can see it.
    const questId = featured.summary.id;
    await db.questHistory.upsert({
      where: { userId_questId: { userId, questId } },
      create: { userId, questId },
      update: {},
    });
    return questId;
  }

  const marker = featuredMarker(featured.period, featured.key, userId);

  const existing = await db.questHistory.findFirst({
    where: { userId, quest: { routeData: { path: ["featuredKey"], equals: marker } } },
    select: { questId: true },
  });
  if (existing) return existing.questId;

  const blueprint = featured.quest;
  if (!blueprint) {
    throw new Error("A featured quest that is neither booked nor generated cannot be logged.");
  }

  // Two readers opening the same page at once would both find nothing and both
  // insert. The transaction re-checks inside, and the loser reuses the winner's
  // row rather than leaving the account holding two copies of one week.
  return db.$transaction(async (tx) => {
    const raced = await tx.questHistory.findFirst({
      where: { userId, quest: { routeData: { path: ["featuredKey"], equals: marker } } },
      select: { questId: true },
    });
    if (raced) return raced.questId;

    const quest = await tx.quest.create({
      data: {
        number: null,
        title: blueprint.title,
        subtitle: blueprint.subtitle,
        description: blueprint.description,
        objective: blueprint.objective,
        bonus: blueprint.bonus,
        safetyNotes: blueprint.safetyNotes,
        location: blueprint.location,
        region: blueprint.region,
        country: blueprint.country,
        latitude: blueprint.latitude,
        longitude: blueprint.longitude,
        distance: blueprint.distance,
        duration: blueprint.duration,
        travelTime: blueprint.travelTime,
        difficulty: blueprint.difficulty,
        elevationGain: blueprint.elevationGain,
        terrain: blueprint.terrain,
        features: blueprint.features,
        mood: blueprint.mood,
        coverImage: blueprint.coverImage,
        signature: blueprint.signature,
        routeData: {
          ...(blueprint.routeData as unknown as Record<string, unknown>),
          featuredKey: marker,
          featuredPeriod: featured.period,
          featuredSlot: featured.key,
        } as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    await tx.questHistory.create({ data: { userId, questId: quest.id } });
    return quest.id;
  });
}
