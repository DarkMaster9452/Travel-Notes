import "server-only";

import { buildShowcaseQuests } from "../../../prisma/seed-data";
import { db } from "@/lib/db";
import { paletteForSrc } from "@/lib/images";
import { toQuestSummary, type QuestSummary } from "@/types/quest";

/**
 * Example quests for the marketing pages.
 *
 * Seeded rows are preferred, but if the database has none — a fresh clone, a
 * preview deploy, a database that is briefly unreachable — the same generator
 * that powers the product produces them in memory. The landing page is never
 * empty, and what it shows is always genuinely what the engine makes.
 */

let memo: QuestSummary[] | null = null;

function generateFallback(): QuestSummary[] {
  memo ??= buildShowcaseQuests(12).map((quest, index) => ({
    id: `showcase-${index + 1}`,
    number: index + 1,
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
    parkingName: null,
    parkingLat: null,
    parkingLng: null,
    parkingNote: null,
    approachTime: null,
    transitNote: null,
  }));
  return memo;
}

export async function getShowcaseQuests(limit = 6): Promise<QuestSummary[]> {
  try {
    const rows = await db.quest.findMany({
      where: { isShowcase: true },
      orderBy: { number: "asc" },
      take: limit,
    });

    if (rows.length > 0) {
      // The same projection every other quest in the product goes through, so
      // a field added to `QuestSummary` cannot go missing on the landing page.
      return rows.map((quest) => ({ ...toQuestSummary(quest), generatedAt: null }));
    }
  } catch (error) {
    console.warn("[showcase] database unavailable, generating in memory", error);
  }

  return generateFallback().slice(0, limit);
}
