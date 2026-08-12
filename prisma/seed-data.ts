import { generateQuest, type GenerationPreferences, type HistoryItem } from "../src/lib/quest/engine";

/**
 * Development and showcase content.
 *
 * These quests are produced by the real generator rather than written by hand:
 * the landing page therefore shows exactly what the product produces, and the
 * seed doubles as a smoke test of the engine.
 */

const basePreferences: GenerationPreferences = {
  homeLocation: "Žilina",
  homeLatitude: 49.2231,
  homeLongitude: 18.7394,
  maxDistance: 120,
  preferredDistance: 11,
  difficulty: "SURPRISE",
  preferredTerrain: ["forest", "mountains", "views"],
  preferredActivity: ["exploration", "photography"],
  preferredEnvironment: [],
  timeAvailable: "HALF",
  transport: "CAR",
  questStyle: "ADVENTUROUS",
  sunsetPreference: "SURPRISE",
  waterPreference: "SURPRISE",
  elevationPreference: "SURPRISE",
};

/** Each profile steers the generator towards a different kind of adventure. */
const PROFILES: Array<{ label: string; overrides: Partial<GenerationPreferences> }> = [
  { label: "hidden waterfall", overrides: { preferredTerrain: ["water", "forest"], waterPreference: "YES", preferredDistance: 9 } },
  { label: "sunset viewpoint", overrides: { preferredTerrain: ["views", "mountains"], sunsetPreference: "YES", preferredDistance: 8 } },
  { label: "forest loop", overrides: { preferredTerrain: ["forest"], difficulty: "EASY", questStyle: "RELAXED", preferredDistance: 7 } },
  { label: "mountain challenge", overrides: { preferredTerrain: ["mountains"], difficulty: "HARD", questStyle: "CHALLENGING", preferredDistance: 17, timeAvailable: "FULL" } },
  { label: "forgotten ruins", overrides: { preferredTerrain: ["history", "hidden"], preferredDistance: 10 } },
  { label: "lake adventure", overrides: { preferredTerrain: ["water", "mountains"], preferredEnvironment: ["lake"], preferredDistance: 14, timeAvailable: "LONG" } },
  { label: "rock and gorge", overrides: { preferredTerrain: ["rocks", "hidden"], preferredDistance: 8 } },
  { label: "long ridge", overrides: { preferredTerrain: ["long_hikes", "views"], preferredDistance: 19, timeAvailable: "FULL", difficulty: "HARD" } },
  { label: "sunrise start", overrides: { preferredTerrain: ["views", "mountains"], sunsetPreference: "NO", preferredDistance: 12 } },
  { label: "car-free", overrides: { transport: "PUBLIC_TRANSPORT", maxDistance: 90, preferredDistance: 10 } },
];

export type SeedQuest = ReturnType<typeof generateQuest>["quest"] & { showcaseLabel: string };

/**
 * Build a varied set of showcase quests, rejecting anything that repeats a
 * location or signature — the same anti-repetition rule the app applies to a
 * real user's history.
 */
export function buildShowcaseQuests(count = 20): SeedQuest[] {
  const quests: SeedQuest[] = [];
  const usedSignatures = new Set<string>();
  const usedLocations = new Set<string>();
  const history: HistoryItem[] = [];

  let attempt = 0;
  while (quests.length < count && attempt < count * 40) {
    const profile = PROFILES[attempt % PROFILES.length]!;
    const seed = `showcase-${attempt}`;
    attempt++;

    const { quest } = generateQuest({
      preferences: { ...basePreferences, ...profile.overrides },
      history,
      seed,
      usedSignatures,
      now: new Date(2026, (quests.length % 6) + 4, 15),
    });

    if (usedLocations.has(quest.routeData.locationId)) continue;
    if (usedSignatures.has(quest.signature)) continue;

    usedLocations.add(quest.routeData.locationId);
    usedSignatures.add(quest.signature);
    history.unshift({
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
      generatedAt: new Date(),
    });

    quests.push({ ...quest, showcaseLabel: profile.label });
  }

  return quests;
}

/** Preferences given to the seeded demo account. */
export const DEMO_PREFERENCES = {
  homeLocation: "Žilina",
  homeLatitude: 49.2231,
  homeLongitude: 18.7394,
  maxDistance: 75,
  preferredDistance: 12,
  difficulty: "MODERATE" as const,
  preferredTerrain: ["forest", "mountains", "views", "water"],
  preferredActivity: ["exploration", "photography", "nature"],
  preferredEnvironment: ["waterfall", "viewpoint"],
  timeAvailable: "HALF" as const,
  transport: "CAR" as const,
  questStyle: "ADVENTUROUS" as const,
  sunsetPreference: "SURPRISE" as const,
  waterPreference: "YES" as const,
  elevationPreference: "SURPRISE" as const,
};
