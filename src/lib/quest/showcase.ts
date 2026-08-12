import "server-only";

import { buildShowcaseQuests } from "../../../prisma/seed-data";
import { db } from "@/lib/db";
import { paletteForSrc } from "@/lib/images";
import type { QuestSummary } from "@/types/quest";

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
      return rows.map((quest) => ({
        id: quest.id,
        number: quest.number,
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
      }));
    }
  } catch (error) {
    console.warn("[showcase] database unavailable, generating in memory", error);
  }

  return generateFallback().slice(0, limit);
}
