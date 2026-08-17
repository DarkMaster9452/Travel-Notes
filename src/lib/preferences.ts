/**
 * What a brand-new account starts with.
 *
 * There is no onboarding quiz. Making someone answer seven questions before
 * they have seen a single quest is the same decision fatigue the product
 * exists to remove — so an account starts with a broad, deliberately
 * non-committal set of preferences and the first quest arrives immediately.
 *
 * Every value here is editable in settings, and the breadth is the point: a
 * new account should get varied quests rather than be funnelled into one kind
 * of day out by an answer given before it meant anything.
 *
 * Pure data, no imports — read by the signup action and by the seed.
 */
export const DEFAULT_PREFERENCES = {
  /** Slovakia's geographic middle. Overwritten as soon as a home town is set. */
  homeLocation: "Slovensko",
  homeLatitude: 48.8,
  homeLongitude: 19.5,
  maxDistance: 75,
  preferredDistance: 12,
  difficulty: "MODERATE" as const,
  preferredTerrain: ["forest", "mountains", "views", "water"],
  preferredActivity: ["exploration", "nature", "photography"],
  preferredEnvironment: ["viewpoint", "waterfall"],
  timeAvailable: "HALF" as const,
  transport: "CAR" as const,
  questStyle: "ADVENTUROUS" as const,
  sunsetPreference: "SURPRISE" as const,
  waterPreference: "SURPRISE" as const,
  elevationPreference: "SURPRISE" as const,
};
