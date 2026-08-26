import "server-only";

import type { Prisma, Quest, UserPreferences } from "@prisma/client";

import { db } from "@/lib/db";
import { UNLOCK_RATE_LIMIT } from "@/lib/config";
import { getEntitlement, type Entitlement } from "@/lib/entitlements";
import { rateLimit } from "@/lib/rate-limit";
import {
  generateQuest,
  QuestGenerationError,
  type GenerationPreferences,
  type HistoryItem,
} from "@/lib/quest/engine";
import { newSeed } from "@/lib/quest/random";
import { titleCase } from "@/lib/utils";

/**
 * Database-facing orchestration for unlocking a quest: read preferences and
 * history, shape the chosen catalogue place through the pure engine, and
 * persist the result atomically alongside the free-quota counter.
 *
 * Quests are no longer generated on demand from nothing — the reader picks a
 * place from the database and it becomes theirs. The engine still does the
 * work of turning that place into a route, objective and bonus.
 */

export type UnlockFailure =
  | { ok: false; code: "no_preferences"; message: string }
  | { ok: false; code: "quota_exhausted"; message: string; entitlement: Entitlement }
  | { ok: false; code: "rate_limited"; message: string; retryAfter: number }
  | { ok: false; code: "catalogue_exhausted"; message: string }
  | { ok: false; code: "unlock_failed"; message: string };

export type UnlockSuccess = {
  ok: true;
  quest: Quest;
  generationNumber: number;
  entitlement: Entitlement;
};

export type UnlockOutcome = UnlockSuccess | UnlockFailure;

function toEnginePreferences(prefs: UserPreferences): GenerationPreferences {
  return {
    homeLocation: prefs.homeLocation,
    homeLatitude: prefs.homeLatitude,
    homeLongitude: prefs.homeLongitude,
    maxDistance: prefs.maxDistance,
    preferredDistance: prefs.preferredDistance,
    difficulty: prefs.difficulty,
    preferredTerrain: prefs.preferredTerrain,
    preferredActivity: prefs.preferredActivity,
    preferredEnvironment: prefs.preferredEnvironment,
    timeAvailable: prefs.timeAvailable,
    transport: prefs.transport,
    questStyle: prefs.questStyle,
    sunsetPreference: prefs.sunsetPreference,
    waterPreference: prefs.waterPreference,
    elevationPreference: prefs.elevationPreference,
  };
}

type RouteDataShape = {
  locationId?: string;
  templates?: { title?: string; objective?: string; bonus?: string };
};

/** Flatten a stored quest into the shape the anti-repetition engine reads. */
function toHistoryItem(quest: Quest, generatedAt: Date): HistoryItem {
  const routeData = (quest.routeData ?? {}) as RouteDataShape;
  return {
    locationId: routeData.locationId ?? null,
    region: quest.region,
    features: quest.features,
    terrain: quest.terrain,
    difficulty: quest.difficulty,
    distance: quest.distance,
    signature: quest.signature,
    title: quest.title,
    titleTemplateId: routeData.templates?.title ?? null,
    objectiveTemplateId: routeData.templates?.objective ?? null,
    bonusTemplateId: routeData.templates?.bonus ?? null,
    generatedAt,
  };
}

/** Newest first — the engine weights recency. */
export async function loadHistory(userId: string, take = 40): Promise<HistoryItem[]> {
  const rows = await db.questHistory.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    take,
    include: { quest: true },
  });
  return rows.map((row) => toHistoryItem(row.quest, row.generatedAt));
}

/**
 * Every signature this account has ever been given.
 *
 * Deliberately not derived from `loadHistory`, which stops at forty rows
 * because that is as far back as recency-weighted scoring is worth reading.
 * Non-repetition is not a weighting — a quest issued two years ago is still
 * one you have had — so this reads the whole column, and reads only that
 * column so the cost stays flat as a history grows.
 */
export async function loadSeenSignatures(userId: string): Promise<Set<string>> {
  const rows = await db.questHistory.findMany({
    where: { userId },
    select: { quest: { select: { signature: true } } },
  });
  return new Set(rows.map((row) => row.quest.signature));
}

/**
 * Unlock a catalogue place as a quest and persist it.
 *
 * Every guard that matters runs here rather than in the UI: entitlement,
 * rate limiting, and the quota increment all happen server-side, and the
 * increment shares a transaction with the quest insert so a crash can never
 * hand out a free quest without recording it (or vice versa).
 *
 * `locations` is a *ranked preference*, not a single instruction. The engine
 * refuses to hand back a quest this account has already had, so a place whose
 * every shape is spent has nothing to give and the next place on the list is
 * tried instead. One place is still a legitimate list — it just means "here
 * or nowhere", which is what a reader who picked a place off the map meant.
 *
 * The guards run once, before the walk: trying four places is one unlock, not
 * four, and must cost one quota.
 */
export async function unlockQuestForUser(
  userId: string,
  locations: string | readonly string[],
): Promise<UnlockOutcome> {
  const ranked = typeof locations === "string" ? [locations] : [...locations];
  if (ranked.length === 0) {
    return {
      ok: false,
      code: "unlock_failed",
      message: "We couldn't add that quest right now. Try again.",
    };
  }
  const preferences = await db.userPreferences.findUnique({ where: { userId } });
  if (!preferences) {
    return {
      ok: false,
      code: "no_preferences",
      message: "Finish onboarding first so we know how to shape your quest.",
    };
  }

  const limit = await rateLimit(
    `unlock:${userId}`,
    UNLOCK_RATE_LIMIT.max,
    UNLOCK_RATE_LIMIT.windowSeconds,
  );
  if (!limit.ok) {
    return {
      ok: false,
      code: "rate_limited",
      message: "That's a lot of quests in one hour. Give it a few minutes.",
      retryAfter: limit.retryAfter,
    };
  }

  const entitlement = await getEntitlement(userId);
  if (!entitlement.canUnlock) {
    return {
      ok: false,
      code: "quota_exhausted",
      message: "You've used your free quests.",
      entitlement,
    };
  }

  const [history, usedSignatures] = await Promise.all([
    loadHistory(userId),
    loadSeenSignatures(userId),
  ]);
  const enginePreferences = toEnginePreferences(preferences);

  // Walk the ranked places until one has something this account has not had.
  let built: ReturnType<typeof generateQuest> | null = null;
  let locationId = ranked[0]!;
  let lastInvalid: QuestGenerationError | null = null;

  for (const candidate of ranked) {
    try {
      built = generateQuest({
        preferences: enginePreferences,
        history,
        usedSignatures,
        locationId: candidate,
        seed: newSeed(),
        now: new Date(),
      });
      locationId = candidate;
      break;
    } catch (error) {
      if (!(error instanceof QuestGenerationError)) throw error;
      // A place with nothing new left is expected; a place the catalogue does
      // not have is a bug in the caller's list, and worth reporting if the
      // whole walk comes up empty.
      if (error.code !== "exhausted") lastInvalid = error;
    }
  }

  if (!built) {
    if (lastInvalid) {
      return { ok: false, code: "unlock_failed", message: lastInvalid.message };
    }
    return {
      ok: false,
      code: "catalogue_exhausted",
      message:
        "You have been everywhere we know. Nothing here would be new — new places are added as we walk them.",
    };
  }

  const { quest: blueprint, trace } = built;

  try {
    const result = await db.$transaction(async (tx) => {
      const previous = await tx.questGeneration.aggregate({
        where: { userId },
        _max: { generationNumber: true },
      });
      const generationNumber = (previous._max.generationNumber ?? 0) + 1;

      const quest = await tx.quest.create({
        data: {
          number: generationNumber,
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
          routeData: blueprint.routeData as unknown as Prisma.InputJsonValue,
          signature: blueprint.signature,
        },
      });

      await tx.questGeneration.create({
        data: {
          userId,
          questId: quest.id,
          generationNumber,
          generationParameters: {
            ...trace.parameters,
            unlockedLocationId: locationId,
            trace: {
              attempts: trace.attempts,
              collisions: trace.collisions.length,
              noveltyScore: trace.noveltyScore,
              candidatesScored: trace.candidatesScored,
            },
          } as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.questHistory.create({ data: { userId, questId: quest.id } });

      // Only free-tier unlocks burn quota. Subscribers are unlimited.
      if (!entitlement.isSubscribed) {
        await tx.user.update({
          where: { id: userId },
          data: { freeQuestsUsed: { increment: 1 } },
        });
      }

      return { quest, generationNumber };
    });

    return {
      ok: true,
      quest: result.quest,
      generationNumber: result.generationNumber,
      entitlement: await getEntitlement(userId),
    };
  } catch (error) {
    console.error("[quest] unlock persist failed", error);
    return {
      ok: false,
      code: "unlock_failed",
      message: "We couldn't add that quest right now. Try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Load a quest the user is allowed to see: one they generated, or a showcase
 * quest. Ownership is enforced here so no page can leak another user's quest.
 */
export async function getQuestForUser(questId: string, userId: string) {
  const quest = await db.quest.findUnique({
    where: { id: questId },
    include: {
      history: { where: { userId }, take: 1 },
      saved: { where: { userId }, take: 1 },
      generations: { where: { userId }, take: 1 },
    },
  });

  if (!quest) return null;

  const owned = quest.generations.length > 0 || quest.history.length > 0;
  if (!owned && !quest.isShowcase) return null;

  return {
    quest,
    isSaved: quest.saved.length > 0,
    isCompleted: quest.history[0]?.completed ?? false,
    completedAt: quest.history[0]?.completedAt ?? null,
    generatedAt: quest.history[0]?.generatedAt ?? quest.createdAt,
    owned,
  };
}

export async function getUserStats(userId: string) {
  const [history, saved] = await Promise.all([
    db.questHistory.findMany({
      where: { userId },
      include: {
        quest: {
          select: {
            distance: true,
            elevationGain: true,
            features: true,
            terrain: true,
            region: true,
            country: true,
            difficulty: true,
          },
        },
      },
    }),
    db.savedQuest.count({ where: { userId } }),
  ]);

  const completed = history.filter((h) => h.completed);
  const countFeature = (tag: string) =>
    history.filter((h) => h.quest.features.includes(tag) || h.quest.terrain.includes(tag)).length;

  // The rare stickers ask questions about *when* and *how varied*, not just
  // how much, so they need the dates and the grades rather than another
  // running total. All of it comes off the rows already loaded above.
  const when = completed.map((h) => h.completedAt ?? h.generatedAt);

  const mountains = countFeature("mountains");
  const forests = countFeature("forest");
  const waterfalls = countFeature("waterfall");
  const lakes = countFeature("lake");
  const ruins = countFeature("ruins") + countFeature("castle");

  const kmByYear = new Map<number, number>();
  for (const entry of completed) {
    const year = (entry.completedAt ?? entry.generatedAt).getUTCFullYear();
    kmByYear.set(year, (kmByYear.get(year) ?? 0) + entry.quest.distance);
  }

  return {
    questCount: history.length,
    completedCount: completed.length,
    savedCount: saved,
    kmExplored: Math.round(completed.reduce((sum, h) => sum + h.quest.distance, 0)),
    kmOffered: Math.round(history.reduce((sum, h) => sum + h.quest.distance, 0)),
    elevation: Math.round(completed.reduce((sum, h) => sum + h.quest.elevationGain, 0)),
    mountains,
    forests,
    waterfalls,
    lakes,
    ruins,
    regions: new Set(history.map((h) => h.quest.region)).size,
    countries: new Set(history.map((h) => h.quest.country)).size,

    /* ---- the rare tier -------------------------------------------------- */

    /** How many of the four grades have been walked at least once. */
    gradesWalked: new Set(completed.map((h) => h.quest.difficulty)).size,
    /** How many of the four seasons. */
    seasons: new Set(when.map(seasonOf)).size,
    /** How many distinct calendar months, ever — not months in a row. */
    monthsWalked: new Set(when.map((date) => date.getUTCMonth())).size,
    /** The longest run of consecutive weeks with something logged in each. */
    bestStreakWeeks: longestWeekStreak(when),
    /** How many of the five kinds of ground have been touched at least once. */
    terrainsWalked: [mountains, forests, waterfalls, lakes, ruins].filter((n) => n > 0).length,
    /** The best single calendar year, in kilometres. */
    bestYearKm: Math.round(Math.max(0, ...kmByYear.values())),
  };
}

/** Meteorological seasons: whole months, which is how people talk about them. */
function seasonOf(date: Date): 0 | 1 | 2 | 3 {
  const month = date.getUTCMonth();
  if (month <= 1 || month === 11) return 0; // Dec–Feb
  if (month <= 4) return 1; // Mar–May
  if (month <= 7) return 2; // Jun–Aug
  return 3; // Sep–Nov
}

/**
 * Which Monday-started week a date falls in, as a single integer.
 *
 * Counted from the epoch rather than reusing the ISO week *key*, because a
 * streak needs weeks to be comparable by subtraction — "2026-W52" and
 * "2027-W01" are consecutive but do not look it as strings.
 */
function weekIndex(date: Date): number {
  const day = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
  // 1 Jan 1970 was a Thursday, so +3 shifts the boundary onto Monday.
  return Math.floor((day + 3) / 7);
}

function longestWeekStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const weeks = [...new Set(dates.map(weekIndex))].sort((a, b) => a - b);

  let best = 1;
  let run = 1;
  for (let i = 1; i < weeks.length; i += 1) {
    run = weeks[i] === weeks[i - 1] + 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

export type UserStats = Awaited<ReturnType<typeof getUserStats>>;

// ---------------------------------------------------------------------------
// Activity series (for the stats charts)
// ---------------------------------------------------------------------------

export type MonthPoint = { key: string; label: string; distance: number; completed: number };
export type CountPoint = { key: string; label: string; value: number };

export type ActivitySeries = {
  months: MonthPoint[];
  byDifficulty: CountPoint[];
  byTerrain: CountPoint[];
  /** Completed quests in the current calendar month. */
  monthCompleted: number;
  monthDistance: number;
  monthElevation: number;
};

const DIFFICULTY_ORDER = ["EASY", "MODERATE", "HARD", "EXPERT"] as const;
const DIFFICULTY_TEXT: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Medium",
  HARD: "Hard",
  EXPERT: "Expert",
};

/**
 * Completed quests bucketed for the charts on the stats page.
 *
 * Only *completed* quests count — the graphs claim to show what you did, and
 * unlocking something you never walked shouldn't move the line. Months are
 * emitted even when empty so the axis stays evenly spaced rather than skipping
 * a quiet month and implying it never happened.
 */
export async function getActivitySeries(userId: string, monthCount = 6): Promise<ActivitySeries> {
  const history = await db.questHistory.findMany({
    where: { userId, completed: true },
    include: {
      quest: {
        select: {
          distance: true,
          elevationGain: true,
          difficulty: true,
          terrain: true,
        },
      },
    },
    orderBy: { generatedAt: "asc" },
  });

  const now = new Date();
  const months: MonthPoint[] = [];
  const index = new Map<string, MonthPoint>();

  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const point: MonthPoint = {
      key,
      label: date.toLocaleDateString("en-GB", { month: "short" }),
      distance: 0,
      completed: 0,
    };
    months.push(point);
    index.set(key, point);
  }

  const difficulty = new Map<string, number>();
  const terrain = new Map<string, number>();

  const monthKeyNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let monthCompleted = 0;
  let monthDistance = 0;
  let monthElevation = 0;

  for (const entry of history) {
    const completedAt = entry.completedAt ?? entry.generatedAt;
    const key = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, "0")}`;

    const point = index.get(key);
    if (point) {
      point.distance += entry.quest.distance;
      point.completed += 1;
    }

    if (key === monthKeyNow) {
      monthCompleted += 1;
      monthDistance += entry.quest.distance;
      monthElevation += entry.quest.elevationGain;
    }

    difficulty.set(entry.quest.difficulty, (difficulty.get(entry.quest.difficulty) ?? 0) + 1);
    for (const tag of entry.quest.terrain) {
      terrain.set(tag, (terrain.get(tag) ?? 0) + 1);
    }
  }

  for (const point of months) point.distance = Math.round(point.distance);

  return {
    months,
    byDifficulty: DIFFICULTY_ORDER.map((level) => ({
      key: level,
      label: DIFFICULTY_TEXT[level] ?? level,
      value: difficulty.get(level) ?? 0,
    })),
    byTerrain: [...terrain.entries()]
      .map(([key, value]) => ({ key, label: titleCase(key), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
    monthCompleted,
    monthDistance: Math.round(monthDistance),
    monthElevation: Math.round(monthElevation),
  };
}
