import { getImage, type ImageKey } from "@/lib/images";
import { haversineKm, ROAD_DETOUR_FACTOR } from "@/lib/geo";
import { LOCATIONS, type LocationEntry } from "@/lib/quest/locations";
import {
  buildBonus,
  buildDescription,
  buildObjective,
  buildSafetyNotes,
  buildSubtitle,
  buildTitle,
  buildWaypoints,
  MOODS,
  type CopyContext,
  type Timing,
} from "@/lib/quest/language";
import { createRng, newSeed, stableHash, type Rng } from "@/lib/quest/random";
import { expandInterests, TIME_BUDGET, TRANSPORT_PROFILE } from "@/lib/quest/taxonomy";

/**
 * The quest generator.
 *
 * Pure and deterministic given (preferences, history, seed): no database, no
 * network, no clock beyond the `now` you pass in. That makes the interesting
 * part — "is this quest actually different from the last five?" — testable.
 *
 * Pipeline:
 *   preferences → randomised parameter draw → candidate scoring (fit − history
 *   penalties + novelty bonuses) → weighted pick → route metrics → objective
 *   and copy → signature check → retry on collision.
 */

export type Difficulty = "EASY" | "MODERATE" | "HARD" | "EXPERT";

export type GenerationPreferences = {
  homeLocation: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  maxDistance: number;
  preferredDistance: number;
  difficulty: "EASY" | "MODERATE" | "HARD" | "SURPRISE";
  preferredTerrain: string[];
  preferredActivity: string[];
  preferredEnvironment: string[];
  timeAvailable: "SHORT" | "HALF" | "LONG" | "FULL" | "SURPRISE";
  transport: "CAR" | "PUBLIC_TRANSPORT" | "BIKE" | "WALKING";
  questStyle: "RELAXED" | "ADVENTUROUS" | "CHALLENGING" | "RANDOM";
  sunsetPreference: "YES" | "NO" | "SURPRISE";
  waterPreference: "YES" | "NO" | "SURPRISE";
  elevationPreference: "YES" | "NO" | "SURPRISE";
};

/** One previously generated quest, flattened to what anti-repetition needs. */
export type HistoryItem = {
  locationId: string | null;
  region: string;
  features: string[];
  terrain: string[];
  difficulty: Difficulty;
  distance: number;
  signature: string;
  title: string;
  titleTemplateId: string | null;
  objectiveTemplateId: string | null;
  bonusTemplateId: string | null;
  generatedAt: Date;
};

/** The randomised parameter draw, recorded verbatim on every generation. */
export type DrawnParameters = {
  seed: string;
  targetDistance: number;
  distanceBucket: string;
  desiredDifficulty: Difficulty;
  timing: Timing;
  mood: string;
  wantedFeatures: string[];
  wantedTerrain: string[];
  wildcard: string | null;
  timeBudget: [number, number];
  travelRadiusKm: number;
  style: GenerationPreferences["questStyle"];
  month: number;
};

export type GeneratedQuest = {
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  bonus: string;
  safetyNotes: string;
  location: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number;
  duration: number;
  travelTime: number | null;
  difficulty: Difficulty;
  elevationGain: number;
  terrain: string[];
  features: string[];
  mood: string;
  coverImage: string;
  signature: string;
  routeData: {
    seed: string;
    locationId: string;
    primaryFeature: string;
    secondaryFeature: string | null;
    timing: Timing;
    imageKey: ImageKey;
    waypoints: Array<{ lat: number; lng: number; label: string }>;
    templates: { title: string; objective: string; bonus: string };
    parameters: DrawnParameters;
  };
};

export type GenerationTrace = {
  seed: string;
  parameters: DrawnParameters;
  candidatesScored: number;
  attempts: number;
  /** Signatures rejected because the user had already seen them. */
  collisions: string[];
  noveltyScore: number;
  scoreBreakdown: Array<{ locationId: string; score: number; novelty: number; fit: number }>;
};

export type GenerationResult = { quest: GeneratedQuest; trace: GenerationTrace };

/** Buckets keep "8.2 km" and "8.6 km" from counting as different quests. */
function distanceBucket(km: number): string {
  if (km < 7) return "short";
  if (km < 11) return "medium";
  if (km < 16) return "long";
  if (km < 22) return "very-long";
  return "epic";
}

const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MODERATE", "HARD", "EXPERT"];

// ---------------------------------------------------------------------------
// Step 1 — randomised parameter draw
// ---------------------------------------------------------------------------

function drawParameters(
  prefs: GenerationPreferences,
  rng: Rng,
  seed: string,
  now: Date,
): DrawnParameters {
  const style = prefs.questStyle === "RANDOM" ? rng.pick(["RELAXED", "ADVENTUROUS", "CHALLENGING"] as const) : prefs.questStyle;

  // Difficulty: honour the stated preference, but let the dice move it one
  // step in either direction so consecutive quests don't feel identical.
  let desiredDifficulty: Difficulty;
  if (prefs.difficulty === "SURPRISE" || prefs.questStyle === "RANDOM") {
    desiredDifficulty = rng.weighted(DIFFICULTY_ORDER, (d) =>
      d === "EASY" ? 3 : d === "MODERATE" ? 4 : d === "HARD" ? 2.5 : 1,
    );
  } else {
    const base = DIFFICULTY_ORDER.indexOf(prefs.difficulty);
    const drift = rng.chance(0.28) ? (rng.chance(0.5) ? -1 : 1) : 0;
    desiredDifficulty = DIFFICULTY_ORDER[Math.min(3, Math.max(0, base + drift))]!;
  }

  if (style === "CHALLENGING" && rng.chance(0.5)) {
    desiredDifficulty = DIFFICULTY_ORDER[Math.min(3, DIFFICULTY_ORDER.indexOf(desiredDifficulty) + 1)]!;
  }
  if (style === "RELAXED" && rng.chance(0.6)) {
    desiredDifficulty = DIFFICULTY_ORDER[Math.max(0, DIFFICULTY_ORDER.indexOf(desiredDifficulty) - 1)]!;
  }

  const styleFactor = style === "RELAXED" ? 0.75 : style === "CHALLENGING" ? 1.35 : 1;
  const targetDistance = Math.max(
    3,
    prefs.preferredDistance * styleFactor * rng.float(0.82, 1.25),
  );

  // Timing: an explicit preference wins; otherwise the dice decide, which is
  // what makes "reach the viewpoint before sunset" show up unannounced.
  let timing: Timing;
  if (prefs.sunsetPreference === "YES") timing = "sunset";
  else if (prefs.sunsetPreference === "NO") timing = rng.pick(["daylight", "open"] as Timing[]);
  else timing = rng.weighted(["sunset", "sunrise", "daylight", "open"] as Timing[], (t) =>
    t === "sunset" ? 3 : t === "sunrise" ? 1.4 : t === "daylight" ? 2.5 : 2,
  );

  const interests = expandInterests(prefs.preferredTerrain);
  const wantedTerrain = [...new Set([...interests.terrain, ...prefs.preferredTerrain])];
  const wantedFeatures = [...new Set([...interests.features, ...prefs.preferredEnvironment])];

  if (prefs.waterPreference === "YES") wantedFeatures.push("waterfall", "lake", "river");
  if (prefs.elevationPreference === "YES") wantedFeatures.push("summit", "viewpoint");

  // The wildcard is the "unexpected" in "unexpected trips": one in three
  // quests gets a feature the user never asked for.
  const WILDCARDS = ["cave", "ruins", "castle", "hidden", "old_growth", "wildlife", "waterfall", "lake"];
  const wildcardPool = WILDCARDS.filter((w) => !wantedFeatures.includes(w));
  const wildcard = wildcardPool.length > 0 && rng.chance(0.34) ? rng.pick(wildcardPool) : null;
  if (wildcard) wantedFeatures.push(wildcard);

  const timeBudget = TIME_BUDGET[prefs.timeAvailable] ?? TIME_BUDGET.SURPRISE!;
  const profile = TRANSPORT_PROFILE[prefs.transport] ?? TRANSPORT_PROFILE.CAR!;
  const travelRadiusKm =
    prefs.transport === "CAR" ? prefs.maxDistance : Math.min(prefs.maxDistance, profile.speed * 1.6);

  return {
    seed,
    targetDistance: Number(targetDistance.toFixed(1)),
    distanceBucket: distanceBucket(targetDistance),
    desiredDifficulty,
    timing,
    mood: rng.pick(MOODS),
    wantedFeatures: [...new Set(wantedFeatures)],
    wantedTerrain,
    wildcard,
    timeBudget: [timeBudget[0], timeBudget[1]],
    travelRadiusKm,
    style,
    month: now.getMonth() + 1,
  };
}

// ---------------------------------------------------------------------------
// Step 2 — scoring: preference fit, then everything the user has already seen
// ---------------------------------------------------------------------------

type Scored = {
  location: LocationEntry;
  fit: number;
  novelty: number;
  score: number;
  travelKm: number | null;
  travelMinutes: number | null;
};

function scoreLocations(
  prefs: GenerationPreferences,
  params: DrawnParameters,
  history: HistoryItem[],
  rng: Rng,
): Scored[] {
  const home =
    prefs.homeLatitude != null && prefs.homeLongitude != null
      ? { latitude: prefs.homeLatitude, longitude: prefs.homeLongitude }
      : null;

  const profile = TRANSPORT_PROFILE[prefs.transport] ?? TRANSPORT_PROFILE.CAR!;
  const recent = history.slice(0, 6);
  const seenLocationIds = new Map<string, number>();
  const seenRegions = new Map<string, number>();
  const seenFeatures = new Map<string, number>();

  history.forEach((item, index) => {
    // Recency weight: the last quest counts far more than the tenth.
    const weight = 1 / (1 + index * 0.55);
    if (item.locationId) {
      seenLocationIds.set(item.locationId, (seenLocationIds.get(item.locationId) ?? 0) + weight);
    }
    seenRegions.set(item.region, (seenRegions.get(item.region) ?? 0) + weight);
    for (const feature of item.features) {
      seenFeatures.set(feature, (seenFeatures.get(feature) ?? 0) + weight);
    }
  });

  const recentDifficulties = recent.slice(0, 2).map((h) => h.difficulty);
  const recentBuckets = recent.slice(0, 2).map((h) => distanceBucket(h.distance));

  return LOCATIONS.map((location): Scored => {
    let fit = 0;

    const terrainMatches = location.terrain.filter((t) => params.wantedTerrain.includes(t)).length;
    fit += Math.min(24, terrainMatches * 12);

    const featureMatches = location.features.filter((f) => params.wantedFeatures.includes(f)).length;
    fit += Math.min(42, featureMatches * 15);

    if (location.difficulties.includes(params.desiredDifficulty)) fit += 14;
    else fit -= 10;

    const [minKm, maxKm] = location.distanceBand;
    if (params.targetDistance >= minKm && params.targetDistance <= maxKm) fit += 14;
    else {
      const miss = params.targetDistance < minKm ? minKm - params.targetDistance : params.targetDistance - maxKm;
      fit -= Math.min(30, miss * 2.5);
    }

    if (prefs.transport === "PUBLIC_TRANSPORT") {
      fit += location.transit === "good" ? 18 : location.transit === "ok" ? 2 : -45;
    }

    fit += location.bestMonths.includes(params.month) ? 10 : -14;

    if (prefs.preferredActivity.includes("off_the_beaten_path") && location.transit === "poor") fit += 10;
    if (prefs.preferredActivity.includes("solitude") && location.transit !== "good") fit += 8;
    if (prefs.preferredActivity.includes("photography") && location.features.includes("viewpoint")) fit += 6;

    let travelKm: number | null = null;
    let travelMinutes: number | null = null;
    if (home) {
      travelKm = haversineKm(home, location) * ROAD_DETOUR_FACTOR;
      travelMinutes = Math.round((travelKm / profile.speed) * 60 + profile.overhead);
      if (travelKm > params.travelRadiusKm * 1.6) fit -= 200; // effectively excluded
      else if (travelKm > params.travelRadiusKm) fit -= 55;
      else fit += 12 * (1 - travelKm / Math.max(1, params.travelRadiusKm));
    }

    // --- anti-repetition ---
    let novelty = 0;
    const locationSeen = seenLocationIds.get(location.id) ?? 0;
    novelty -= locationSeen * 90;
    if (history.length > 0 && history[0]?.locationId === location.id) novelty -= 120;

    novelty -= (seenRegions.get(location.region) ?? 0) * 26;
    if (!seenRegions.has(location.region)) novelty += 26;

    for (const feature of location.features) {
      novelty -= (seenFeatures.get(feature) ?? 0) * 9;
      if (!seenFeatures.has(feature)) novelty += 7;
    }

    if (recentDifficulties.includes(params.desiredDifficulty) && recentDifficulties.length > 0) novelty -= 6;
    if (recentBuckets.includes(params.distanceBucket)) novelty -= 8;

    const jitter = rng.float(0, 18);
    return { location, fit, novelty, score: fit + novelty + jitter, travelKm, travelMinutes };
  }).sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Step 3 — route metrics
// ---------------------------------------------------------------------------

function deriveRoute(
  location: LocationEntry,
  params: DrawnParameters,
  rng: Rng,
): { distance: number; elevationGain: number; duration: number; difficulty: Difficulty } {
  const [minKm, maxKm] = location.distanceBand;
  const distance = Number(Math.min(maxKm, Math.max(minKm, params.targetDistance)).toFixed(1));

  // Where the chosen distance sits in the band drives how much climbing the
  // route gets — a long day in a valley still climbs less than a short day on
  // a ridge, because the band itself encodes the terrain.
  const position = (distance - minKm) / Math.max(0.1, maxKm - minKm);
  const [minUp, maxUp] = location.elevationBand;
  const elevationGain = Math.round(
    (minUp + (maxUp - minUp) * (position * 0.7 + rng.float(0.05, 0.45))) / 10,
  ) * 10;

  // Naismith's rule, plus a terrain penalty for gorges and rock.
  const technical = location.terrain.some((t) => t === "gorge" || t === "rocks") ? 1.12 : 1;
  const duration = Math.round(((distance * 12 + (elevationGain / 100) * 10) * technical) / 5) * 5;

  const available = location.difficulties;
  const wantedIndex = DIFFICULTY_ORDER.indexOf(params.desiredDifficulty);
  const difficulty =
    available.find((d) => d === params.desiredDifficulty) ??
    [...available].sort(
      (a, b) =>
        Math.abs(DIFFICULTY_ORDER.indexOf(a) - wantedIndex) -
        Math.abs(DIFFICULTY_ORDER.indexOf(b) - wantedIndex),
    )[0]!;

  return { distance, elevationGain: Math.max(60, elevationGain), duration, difficulty };
}

function pickPrimaryFeature(location: LocationEntry, params: DrawnParameters, rng: Rng): string {
  const wanted = location.features.filter((f) => params.wantedFeatures.includes(f));
  const pool = wanted.length > 0 ? wanted : location.features;
  if (pool.length === 0) return "viewpoint";
  // Prefer the wildcard when the location actually has it — that's the whole
  // point of drawing one.
  if (params.wildcard && location.features.includes(params.wildcard)) return params.wildcard;
  return rng.pick(pool);
}

// ---------------------------------------------------------------------------
// Step 4 — assemble
// ---------------------------------------------------------------------------

export type GenerateOptions = {
  preferences: GenerationPreferences;
  history?: HistoryItem[];
  seed?: string;
  now?: Date;
  /** Signatures already used by this user. Generation will not repeat one. */
  usedSignatures?: Set<string>;
  /**
   * Pin the quest to one catalogue location. Used when the reader has *chosen*
   * a place from the database rather than asking to be sent somewhere — scoring
   * still runs (it shapes the route), but only this candidate is considered.
   */
  locationId?: string;
};

export function generateQuest(options: GenerateOptions): GenerationResult {
  const { preferences } = options;
  const history = options.history ?? [];
  const now = options.now ?? new Date();
  const seed = options.seed ?? newSeed();
  const rng = createRng(seed);

  const usedSignatures = options.usedSignatures ?? new Set(history.map((h) => h.signature));
  const usedTitleIds = new Set(history.map((h) => h.titleTemplateId).filter(Boolean) as string[]);
  const usedObjectiveIds = new Set(history.map((h) => h.objectiveTemplateId).filter(Boolean) as string[]);
  const usedBonusIds = new Set(history.map((h) => h.bonusTemplateId).filter(Boolean) as string[]);
  const usedTitles = new Set(history.map((h) => h.title));

  const params = drawParameters(preferences, rng, seed, now);
  const allScored = scoreLocations(preferences, params, history, rng);

  // A pinned location narrows the field to one candidate. Scoring still ran, so
  // the route is shaped by the same preferences; only the choice is taken away.
  const scored = options.locationId
    ? allScored.filter((entry) => entry.location.id === options.locationId)
    : allScored;

  if (options.locationId && scored.length === 0) {
    throw new QuestGenerationError(`No catalogue location with id "${options.locationId}".`);
  }

  const collisions: string[] = [];
  let attempts = 0;

  // Walk the ranked candidates. A candidate whose signature the user has
  // already seen is skipped rather than reshaped, so a "repeat" costs one
  // cheap iteration instead of a whole regeneration.
  //
  // No candidate is ever accepted with a signature this account has already
  // been given. The loop used to give up on that rule after twenty tries and
  // hand back a repeat rather than fail; it no longer does, because "you
  // never get the same quest twice" is a promise and a promise with an
  // escape hatch is a preference. Running out is a real outcome, reported as
  // one, and the caller answers it by trying somewhere else.
  const shortlist = scored.slice(0, Math.min(12, scored.length));

  // Each iteration redraws the route and the primary feature from the same
  // stream, so a pinned location keeps producing different shapes; it just
  // needs more turns of the wheel than a field of twelve does.
  const rounds = options.locationId ? 64 : 32;

  for (let i = 0; i < rounds; i++) {
    attempts++;
    const candidate =
      i < 3
        ? rng.weighted(shortlist, (s) => Math.max(1, s.score - (shortlist.at(-1)?.score ?? 0) + 5))
        : shortlist[i % shortlist.length]!;

    const route = deriveRoute(candidate.location, params, rng);
    const primaryFeature = pickPrimaryFeature(candidate.location, params, rng);
    const secondaryFeature =
      candidate.location.features.filter((f) => f !== primaryFeature)[0] ?? null;

    const signature = stableHash(
      [
        candidate.location.id,
        route.difficulty,
        distanceBucket(route.distance),
        primaryFeature,
        params.timing,
      ].join("|"),
    );

    if (usedSignatures.has(signature)) {
      collisions.push(signature);
      continue;
    }

    const copy: CopyContext = {
      rng,
      location: candidate.location,
      primaryFeature,
      secondaryFeature,
      distance: route.distance,
      duration: route.duration,
      elevationGain: route.elevationGain,
      difficulty: route.difficulty,
      timing: params.timing,
      mood: params.mood,
      usedTitleIds,
      usedObjectiveIds,
      usedBonusIds,
      usedTitles,
    };

    const { title, templateId: titleTemplateId } = buildTitle(copy);
    const { objective, templateId: objectiveTemplateId } = buildObjective(copy);
    const { bonus, templateId: bonusTemplateId } = buildBonus(copy);
    const imageKey = rng.pick(candidate.location.imageKeys);

    const quest: GeneratedQuest = {
      title,
      subtitle: buildSubtitle(copy),
      description: buildDescription(copy),
      objective,
      bonus,
      safetyNotes: buildSafetyNotes(copy),
      location: candidate.location.name,
      region: candidate.location.region,
      country: candidate.location.country,
      latitude: candidate.location.latitude,
      longitude: candidate.location.longitude,
      distance: route.distance,
      duration: route.duration,
      travelTime: candidate.travelMinutes,
      difficulty: route.difficulty,
      elevationGain: route.elevationGain,
      terrain: candidate.location.terrain,
      features: [...new Set([primaryFeature, ...candidate.location.features])],
      mood: params.mood,
      coverImage: getImage(imageKey).src,
      signature,
      routeData: {
        seed,
        locationId: candidate.location.id,
        primaryFeature,
        secondaryFeature,
        timing: params.timing,
        imageKey,
        waypoints: buildWaypoints(copy),
        templates: {
          title: titleTemplateId,
          objective: objectiveTemplateId,
          bonus: bonusTemplateId,
        },
        parameters: params,
      },
    };

    return {
      quest,
      trace: {
        seed,
        parameters: params,
        candidatesScored: scored.length,
        attempts,
        collisions,
        noveltyScore: Math.round(candidate.novelty),
        scoreBreakdown: scored.slice(0, 5).map((s) => ({
          locationId: s.location.id,
          score: Math.round(s.score),
          novelty: Math.round(s.novelty),
          fit: Math.round(s.fit),
        })),
      },
    };
  }

  // Every shape this location can take is already in this account's history.
  // Reachable, and increasingly likely the longer somebody stays: the caller
  // is expected to move on to the next place rather than treat it as a fault.
  throw new QuestGenerationError(
    "Every quest this place can offer is already in your history.",
    "exhausted",
  );
}

export class QuestGenerationError extends Error {
  /**
   * `exhausted` means the location has nothing new left for this account —
   * an ordinary end state, not a bug. Anything else is a genuine failure.
   */
  readonly code: "exhausted" | "invalid";

  constructor(message: string, code: "exhausted" | "invalid" = "invalid") {
    super(message);
    this.name = "QuestGenerationError";
    this.code = code;
  }
}
