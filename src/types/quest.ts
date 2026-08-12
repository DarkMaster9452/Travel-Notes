import type { Quest } from "@prisma/client";

import { paletteForSrc } from "@/lib/images";

/**
 * The projection of a quest that the UI needs. Server components map Prisma
 * records into this before handing them to client components, so no page ever
 * ships a full database row (or another user's fields) to the browser.
 */
export type QuestSummary = {
  id: string;
  number: number | null;
  title: string;
  subtitle: string;
  location: string;
  region: string;
  distance: number;
  duration: number;
  difficulty: "EASY" | "MODERATE" | "HARD" | "EXPERT";
  elevationGain: number;
  travelTime: number | null;
  coverImage: string;
  palette: readonly [string, string, string];
  features: string[];
  terrain: string[];
  mood: string | null;
  objective: string;
  generatedAt: string | null;
  completed?: boolean;
  saved?: boolean;
};

export function toQuestSummary(
  quest: Quest,
  extra?: { generatedAt?: Date | null; completed?: boolean; saved?: boolean },
): QuestSummary {
  return {
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
    generatedAt: (extra?.generatedAt ?? quest.createdAt)?.toISOString() ?? null,
    completed: extra?.completed,
    saved: extra?.saved,
  };
}
