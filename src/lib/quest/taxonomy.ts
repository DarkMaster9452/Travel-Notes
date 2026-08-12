/**
 * The vocabulary the whole product speaks: onboarding answers, location tags
 * and generated quests all resolve down to these tags, which is what lets the
 * engine compare a user's taste against a place and against their own history.
 */

/** What the landscape is made of. */
export const TERRAIN_TAGS = [
  "forest",
  "mountains",
  "ridge",
  "rocks",
  "gorge",
  "meadow",
  "plateau",
  "valley",
  "karst",
] as const;
export type TerrainTag = (typeof TERRAIN_TAGS)[number];

/** What you actually go and look at. */
export const FEATURE_TAGS = [
  "waterfall",
  "lake",
  "river",
  "viewpoint",
  "summit",
  "cave",
  "castle",
  "ruins",
  "hidden",
  "sunrise",
  "sunset",
  "wildlife",
  "old_growth",
  "chapel",
] as const;
export type FeatureTag = (typeof FEATURE_TAGS)[number];

/** Why you go. */
export const ACTIVITY_TAGS = [
  "photography",
  "exploration",
  "challenge",
  "nature",
  "solitude",
  "spontaneous",
  "off_the_beaten_path",
] as const;
export type ActivityTag = (typeof ACTIVITY_TAGS)[number];

/** The eight choices offered during onboarding. */
export const ONBOARDING_INTERESTS = [
  { id: "forest", emoji: "🌲", label: "Forest", terrain: ["forest", "valley"], features: ["old_growth"] },
  { id: "mountains", emoji: "⛰️", label: "Mountains", terrain: ["mountains", "ridge"], features: ["summit"] },
  { id: "water", emoji: "💧", label: "Water", terrain: ["valley"], features: ["waterfall", "lake", "river"] },
  { id: "rocks", emoji: "🪨", label: "Rocks", terrain: ["rocks", "gorge", "karst"], features: ["cave"] },
  { id: "history", emoji: "🏰", label: "History", terrain: [], features: ["castle", "ruins", "chapel"] },
  { id: "views", emoji: "🌅", label: "Views", terrain: ["ridge", "plateau"], features: ["viewpoint", "sunset", "sunrise"] },
  { id: "hidden", emoji: "🧭", label: "Hidden places", terrain: ["gorge"], features: ["hidden"] },
  { id: "long_hikes", emoji: "🥾", label: "Long hikes", terrain: ["plateau", "ridge"], features: [] },
] as const satisfies ReadonlyArray<{
  id: string;
  emoji: string;
  label: string;
  terrain: readonly string[];
  features: readonly string[];
}>;

export type InterestId = (typeof ONBOARDING_INTERESTS)[number]["id"];

/** Expand onboarding interests into the terrain/feature tags the engine scores. */
export function expandInterests(interests: string[]): {
  terrain: string[];
  features: string[];
} {
  const terrain = new Set<string>();
  const features = new Set<string>();
  for (const interest of interests) {
    const def = ONBOARDING_INTERESTS.find((i) => i.id === interest);
    if (!def) continue;
    def.terrain.forEach((t) => terrain.add(t));
    def.features.forEach((f) => features.add(f));
  }
  return { terrain: [...terrain], features: [...features] };
}

const LABELS: Record<string, string> = {
  forest: "Forest",
  mountains: "Mountains",
  ridge: "Ridge",
  rocks: "Rocks",
  gorge: "Gorge",
  meadow: "Meadow",
  plateau: "Plateau",
  valley: "Valley",
  karst: "Karst",
  waterfall: "Waterfall",
  lake: "Lake",
  river: "River",
  viewpoint: "Viewpoint",
  summit: "Summit",
  cave: "Cave",
  castle: "Castle",
  ruins: "Ruins",
  hidden: "Hidden place",
  sunrise: "Sunrise",
  sunset: "Sunset",
  wildlife: "Wildlife",
  old_growth: "Old growth",
  chapel: "Chapel",
  photography: "Photography",
  exploration: "Exploration",
  challenge: "Challenge",
  nature: "Nature",
  solitude: "Solitude",
  spontaneous: "Spontaneous",
  off_the_beaten_path: "Off the beaten path",
  long_hikes: "Long hikes",
  history: "History",
  views: "Views",
  water: "Water",
  hidden_places: "Hidden places",
};

export function tagLabel(tag: string): string {
  return LABELS[tag] ?? tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const DIFFICULTY_LABEL = {
  EASY: "Easy",
  MODERATE: "Medium",
  HARD: "Hard",
  EXPERT: "Expert",
} as const;

export const TIME_LABEL = {
  SHORT: "1–2 hours",
  HALF: "2–4 hours",
  LONG: "4–6 hours",
  FULL: "Full day",
  SURPRISE: "Surprise me",
} as const;

export const TRANSPORT_LABEL = {
  CAR: "Car",
  PUBLIC_TRANSPORT: "Public transport",
  BIKE: "Bike",
  WALKING: "Walking",
} as const;

export const STYLE_LABEL = {
  RELAXED: "Relaxed",
  ADVENTUROUS: "Adventurous",
  CHALLENGING: "Challenging",
  RANDOM: "Completely random",
} as const;

/** Moving-time budget for each onboarding time answer, in minutes. */
export const TIME_BUDGET: Record<string, [number, number]> = {
  SHORT: [50, 130],
  HALF: [110, 250],
  LONG: [230, 380],
  FULL: [330, 560],
  SURPRISE: [60, 500],
};

/** Average travel speed by transport, km/h, plus fixed overhead in minutes. */
export const TRANSPORT_PROFILE: Record<string, { speed: number; overhead: number }> = {
  CAR: { speed: 62, overhead: 6 },
  PUBLIC_TRANSPORT: { speed: 34, overhead: 18 },
  BIKE: { speed: 17, overhead: 4 },
  WALKING: { speed: 4.6, overhead: 2 },
};
