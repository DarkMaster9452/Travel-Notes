import "server-only";

import type { Prisma, Quest, UserPreferences } from "@prisma/client";

import { db } from "@/lib/db";
import { GENERATION_RATE_LIMIT } from "@/lib/config";
import { getEntitlement, type Entitlement } from "@/lib/entitlements";
import { rateLimit } from "@/lib/rate-limit";
import {
  generateQuest,
  QuestGenerationError,
  type GenerationPreferences,
  type HistoryItem,
} from "@/lib/quest/engine";
import { newSeed } from "@/lib/quest/random";

/**
 * Database-facing orchestration for quest generation: read preferences and
 * history, run the pure engine, and persist the result atomically alongside
 * the free-quota counter.
 */

export type GenerateFailure =
  | { ok: false; code: "no_preferences"; message: string }
  | { ok: false; code: "quota_exhausted"; message: string; entitlement: Entitlement }
  | { ok: false; code: "rate_limited"; message: string; retryAfter: number }
  | { ok: false; code: "generation_failed"; message: string };

export type GenerateSuccess = {
  ok: true;
  quest: Quest;
  generationNumber: number;
  entitlement: Entitlement;
};

export type GenerateOutcome = GenerateSuccess | GenerateFailure;

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
 * Generate and persist one quest.
 *
 * Every guard that matters runs here rather than in the UI: entitlement,
 * rate limiting, and the quota increment all happen server-side, and the
 * increment shares a transaction with the quest insert so a crash can never
 * hand out a free quest without recording it (or vice versa).
 */
export async function generateQuestForUser(userId: string): Promise<GenerateOutcome> {
  const preferences = await db.userPreferences.findUnique({ where: { userId } });
  if (!preferences) {
    return {
      ok: false,
      code: "no_preferences",
      message: "Finish onboarding first so we know what to send you towards.",
    };
  }

  const limit = await rateLimit(
    `generate:${userId}`,
    GENERATION_RATE_LIMIT.max,
    GENERATION_RATE_LIMIT.windowSeconds,
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
  if (!entitlement.canGenerate) {
    return {
      ok: false,
      code: "quota_exhausted",
      message: "You've used your free quests.",
      entitlement,
    };
  }

  const history = await loadHistory(userId);

  let generated;
  try {
    generated = generateQuest({
      preferences: toEnginePreferences(preferences),
      history,
      seed: newSeed(),
      now: new Date(),
    });
  } catch (error) {
    if (error instanceof QuestGenerationError) {
      return { ok: false, code: "generation_failed", message: error.message };
    }
    throw error;
  }

  const { quest: blueprint, trace } = generated;

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

      // Only free-tier generations burn quota. Subscribers are unlimited.
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
    console.error("[quest] persist failed", error);
    return {
      ok: false,
      code: "generation_failed",
      message: "We couldn't build an adventure right now. Try again.",
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
          select: { distance: true, elevationGain: true, features: true, terrain: true, region: true },
        },
      },
    }),
    db.savedQuest.count({ where: { userId } }),
  ]);

  const completed = history.filter((h) => h.completed);
  const countFeature = (tag: string) =>
    history.filter((h) => h.quest.features.includes(tag) || h.quest.terrain.includes(tag)).length;

  return {
    questCount: history.length,
    completedCount: completed.length,
    savedCount: saved,
    kmExplored: Math.round(completed.reduce((sum, h) => sum + h.quest.distance, 0)),
    kmOffered: Math.round(history.reduce((sum, h) => sum + h.quest.distance, 0)),
    elevation: Math.round(completed.reduce((sum, h) => sum + h.quest.elevationGain, 0)),
    mountains: countFeature("mountains"),
    forests: countFeature("forest"),
    waterfalls: countFeature("waterfall"),
    lakes: countFeature("lake"),
    ruins: countFeature("ruins") + countFeature("castle"),
    regions: new Set(history.map((h) => h.quest.region)).size,
  };
}

export type UserStats = Awaited<ReturnType<typeof getUserStats>>;
