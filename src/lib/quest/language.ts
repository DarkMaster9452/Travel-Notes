import type { Rng } from "@/lib/quest/random";
import type { LocationEntry } from "@/lib/quest/locations";

/**
 * Quest copy is composed, not looked up.
 *
 * Titles, objectives and bonus challenges are built from small grammars keyed
 * to what the place actually offers, so "a waterfall quest" and "a ruin quest"
 * read differently — and so the engine can refuse to reuse a template the user
 * has already been given.
 */

export type Timing = "sunrise" | "sunset" | "daylight" | "open";

export type CopyContext = {
  rng: Rng;
  location: LocationEntry;
  primaryFeature: string;
  secondaryFeature: string | null;
  distance: number;
  duration: number;
  elevationGain: number;
  difficulty: "EASY" | "MODERATE" | "HARD" | "EXPERT";
  timing: Timing;
  mood: string;
  /** Template ids the user has already been given — avoided where possible. */
  usedTitleIds: Set<string>;
  usedObjectiveIds: Set<string>;
  usedBonusIds: Set<string>;
  usedTitles: Set<string>;
};

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

/**
 * Verbs, with the timings they make sense for. "Wake Up For" on an
 * open-ended quest reads as a mistake, so the grammar rules it out.
 */
const ACTIONS: Array<{ word: string; timings: Timing[] }> = [
  { word: "Chase", timings: ["sunrise", "sunset", "daylight", "open"] },
  { word: "Find", timings: ["sunrise", "sunset", "daylight", "open"] },
  { word: "Reach", timings: ["sunrise", "sunset", "daylight", "open"] },
  { word: "Follow", timings: ["sunrise", "sunset", "daylight", "open"] },
  { word: "Track", timings: ["daylight", "open"] },
  { word: "Hunt", timings: ["daylight", "open"] },
  { word: "Cross", timings: ["daylight", "open"] },
  { word: "Trace", timings: ["daylight", "open"] },
  { word: "Climb To", timings: ["sunrise", "sunset", "daylight", "open"] },
  { word: "Outrun", timings: ["sunset", "daylight"] },
  { word: "Beat", timings: ["sunrise", "sunset"] },
  { word: "Wake Up For", timings: ["sunrise"] },
];

/** Subject phrases, keyed by the feature the quest is built around. */
const SUBJECTS: Record<string, string[]> = {
  waterfall: ["the Hidden Water", "the Falling Water", "the Loud Water", "Water in the Rock"],
  lake: ["the Still Water", "the Black Mirror", "the Water at the Top", "the Cold Lake"],
  river: ["the Water Upstream", "the River Underground", "the Water Through Stone"],
  viewpoint: ["the Long View", "the Edge of the Map", "the Wide Horizon", "the Last Light"],
  summit: ["the High Point", "the Roof of the Valley", "the Peak Before Noon", "the Empty Summit"],
  cave: ["the Hole in the Hill", "the Dark Opening", "the Cold Mouth"],
  castle: ["the Broken Crown", "the Castle on the Rock", "the Watchtower"],
  ruins: ["the Forgotten Walls", "the Stones Nobody Visits", "What the Forest Kept"],
  hidden: ["the Place With No Sign", "the Quiet Turn", "the Unmarked Path"],
  sunrise: ["the First Light", "the Morning Before Everyone"],
  sunset: ["the Last Light", "the Golden Hour"],
  wildlife: ["the Empty Forest", "the Track in the Mud"],
  old_growth: ["the Oldest Trees", "the Forest That Stayed"],
  chapel: ["the Chapel in the Trees"],
};

const FALLBACK_SUBJECTS = ["the Unknown Turn", "Something New", "the Other Side"];

/** "climb to the wide horizon" → "Climb to the wide horizon" */
function sentenceCase(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const SUBTITLE_TEMPLATES: Array<(c: CopyContext) => string> = [
  (c) => `${terrainPhrase(c)} in ${c.location.region}.`,
  (c) => `${Math.round(c.distance)} km of ${terrainPhrase(c).toLowerCase()}, one objective.`,
  (c) => `${c.location.region}. ${moodPhrase(c)}.`,
  (c) => `A ${difficultyWord(c.difficulty)} route through ${terrainPhrase(c).toLowerCase()}.`,
];

export type TitleResult = { title: string; templateId: string };

export function buildTitle(c: CopyContext): TitleResult {
  const subjects = SUBJECTS[c.primaryFeature] ?? FALLBACK_SUBJECTS;
  const combos: Array<{ id: string; title: string }> = [];

  const actions = ACTIONS.filter((a) => a.timings.includes(c.timing));

  for (const action of actions) {
    for (const subject of subjects) {
      combos.push({
        id: `${action.word}|${subject}`,
        // Sentence case, not caps. The design system sets a quest title in the
        // display serif, the way the landing page does — shouting it in the
        // data was a habit of the previous, all-uppercase heading style.
        title: sentenceCase(`${action.word} ${subject}`),
      });
    }
  }

  const fresh = combos.filter((x) => !c.usedTitleIds.has(x.id) && !c.usedTitles.has(x.title));
  const pool = fresh.length > 0 ? fresh : combos;
  const chosen = c.rng.pick(pool);
  return { title: chosen.title, templateId: chosen.id };
}

export function buildSubtitle(c: CopyContext): string {
  return c.rng.pick(SUBTITLE_TEMPLATES)(c);
}

// ---------------------------------------------------------------------------
// Objectives
// ---------------------------------------------------------------------------

type Template = {
  id: string;
  /** Feature this objective needs the location to have. */
  feature: string | "any";
  build: (c: CopyContext) => string;
};

const DEADLINES: Record<Timing, string> = {
  sunrise: "before the sun clears the ridge",
  sunset: "before sunset",
  daylight: "before the light goes",
  open: "in one push, without turning back",
};

const OBJECTIVES: Template[] = [
  {
    id: "waterfall-reach",
    feature: "waterfall",
    build: (c) =>
      `Follow the marked trail to the waterfall, get close enough to feel the spray, and finish the loop ${DEADLINES[c.timing]}.`,
  },
  {
    id: "waterfall-above",
    feature: "waterfall",
    build: () =>
      `Reach the waterfall, then keep going until you are standing above it and looking back down the valley.`,
  },
  {
    id: "lake-reach",
    feature: "lake",
    build: (c) =>
      `Walk in to the lake, get all the way round to the far shore, and be back on the descent ${DEADLINES[c.timing]}.`,
  },
  {
    id: "lake-touch",
    feature: "lake",
    build: () => `Reach the lake and put your hand in the water. Then sit there for ten minutes doing nothing.`,
  },
  {
    id: "summit-reach",
    feature: "summit",
    build: (c) =>
      `Climb the ${c.elevationGain} m to the summit and stay long enough to name three things you can see ${DEADLINES[c.timing]}.`,
  },
  {
    id: "summit-traverse",
    feature: "summit",
    build: () => `Take the ridge to the summit and come down a different way than you went up.`,
  },
  {
    id: "viewpoint-sunset",
    feature: "viewpoint",
    build: (c) =>
      `Reach the viewpoint ${DEADLINES[c.timing]}, and don't photograph it for the first five minutes.`,
  },
  {
    id: "viewpoint-find",
    feature: "viewpoint",
    build: () =>
      `Find the viewpoint the trail signs don't mention, and work out which valley you are actually looking at.`,
  },
  {
    id: "cave-find",
    feature: "cave",
    build: () => `Find the cave entrance from the trail, go as far in as daylight reaches, and no further.`,
  },
  {
    id: "castle-reach",
    feature: "castle",
    build: (c) =>
      `Walk up to the castle, find the highest point you're allowed to stand on, and be down again ${DEADLINES[c.timing]}.`,
  },
  {
    id: "ruins-find",
    feature: "ruins",
    build: () =>
      `Find the ruins, walk the full outline of the walls, and work out where the entrance used to be.`,
  },
  {
    id: "river-upstream",
    feature: "river",
    build: () => `Follow the water upstream until the trail leaves it, then turn and take the higher path back.`,
  },
  {
    id: "hidden-unmarked",
    feature: "hidden",
    build: () =>
      `Get to the part of the route that isn't on the signs — the turn most people walk straight past — and stop there.`,
  },
  {
    id: "wildlife-quiet",
    feature: "wildlife",
    build: () => `Walk the first hour without talking and without headphones. Count what you hear.`,
  },
  {
    id: "old-growth",
    feature: "old_growth",
    build: () => `Find the biggest tree on the route and stand at the bottom of it. Look up before you move on.`,
  },
  {
    id: "generic-loop",
    feature: "any",
    build: (c) =>
      `Complete the ${c.distance.toFixed(1)} km route in ${c.location.name}, and finish ${DEADLINES[c.timing]}.`,
  },
  {
    id: "generic-turnaround",
    feature: "any",
    build: (c) =>
      `Walk out for half your time, turn around wherever you are, and be back at the car in ${Math.round(c.duration / 60)} hours.`,
  },
];

export type ObjectiveResult = { objective: string; templateId: string };

/**
 * Picks in tiers so the objective matches what the *title* promises: a quest
 * called "Find the Hole in the Hill" should send you to the cave, not to the
 * viewpoint the same area happens to have.
 */
function pickTemplate(
  c: CopyContext,
  templates: Template[],
  used: Set<string>,
): Template {
  const primary = templates.filter((t) => t.feature === c.primaryFeature);
  const secondary = templates.filter(
    (t) => t.feature !== "any" && t.feature !== c.primaryFeature && c.location.features.includes(t.feature),
  );
  const generic = templates.filter((t) => t.feature === "any");

  for (const tier of [primary, secondary, generic]) {
    const fresh = tier.filter((t) => !used.has(t.id));
    if (fresh.length > 0) return c.rng.pick(fresh);
  }
  // Everything has been used before — reuse from the most relevant tier.
  const fallback = primary.length > 0 ? primary : generic.length > 0 ? generic : templates;
  return c.rng.pick(fallback);
}

export function buildObjective(c: CopyContext): ObjectiveResult {
  const chosen = pickTemplate(c, OBJECTIVES, c.usedObjectiveIds);
  return { objective: chosen.build(c), templateId: chosen.id };
}

// ---------------------------------------------------------------------------
// Bonus challenges
// ---------------------------------------------------------------------------

const BONUSES: Template[] = [
  {
    id: "landmark-find",
    feature: "any",
    build: (c) => `Find ${c.rng.pick(c.location.landmarks)} somewhere along the route.`,
  },
  {
    id: "photo-one",
    feature: "any",
    build: () => `Take exactly one photograph the whole day. Choose carefully.`,
  },
  {
    id: "water-source",
    feature: "any",
    build: () => `Find a spring or stream on the route and fill something from it.`,
  },
  {
    id: "no-map",
    feature: "any",
    build: () => `Navigate the last kilometre by trail markers only — phone in your pocket.`,
  },
  {
    id: "stone-cross",
    feature: "ruins",
    build: () => `Find the old stone marker somewhere off the main path and work out what's carved on it.`,
  },
  {
    id: "swim",
    feature: "lake",
    build: () => `Get in the water. Even for ten seconds. Especially if it's cold.`,
  },
  {
    id: "waterfall-behind",
    feature: "waterfall",
    build: () => `Find the angle where the waterfall is between you and the sun.`,
  },
  {
    id: "summit-name",
    feature: "summit",
    build: () => `Name every peak on the horizon before you check the map.`,
  },
  {
    id: "sit-still",
    feature: "viewpoint",
    build: () => `Sit at the top for fifteen minutes without checking the time.`,
  },
  {
    id: "castle-story",
    feature: "castle",
    build: () => `Find out one true thing about who lived here before you leave.`,
  },
];

export type BonusResult = { bonus: string; templateId: string };

export function buildBonus(c: CopyContext): BonusResult {
  const available = BONUSES.filter((t) => t.feature === "any" || c.location.features.includes(t.feature));
  const chosen = pickTemplate(c, available, c.usedBonusIds);
  return { bonus: chosen.build(c), templateId: chosen.id };
}

// ---------------------------------------------------------------------------
// Description, mood, safety
// ---------------------------------------------------------------------------

export const MOODS = [
  "Adventure",
  "Exploration",
  "Solitude",
  "Challenge",
  "Slow morning",
  "Golden hour",
  "Off the map",
] as const;

function moodPhrase(c: CopyContext): string {
  switch (c.mood) {
    case "Solitude":
      return "You will probably have it to yourself";
    case "Challenge":
      return "It will hurt a little";
    case "Golden hour":
      return "Time it for the end of the day";
    case "Slow morning":
      return "No rush, no schedule";
    case "Off the map":
      return "Fewer signs than you'd like";
    case "Exploration":
      return "Bring curiosity";
    default:
      return "Go and see";
  }
}

function terrainPhrase(c: CopyContext): string {
  const [first, second] = c.location.terrain;
  const words: Record<string, string> = {
    forest: "Forest",
    mountains: "Mountain",
    ridge: "Ridge",
    rocks: "Rock",
    gorge: "Gorge",
    meadow: "Meadow",
    plateau: "Plateau",
    valley: "Valley",
    karst: "Karst",
  };
  if (first && second) return `${words[first] ?? first} and ${(words[second] ?? second).toLowerCase()}`;
  return words[first ?? "forest"] ?? "Trail";
}

export function difficultyWord(difficulty: CopyContext["difficulty"]): string {
  return { EASY: "easy", MODERATE: "medium", HARD: "hard", EXPERT: "serious" }[difficulty];
}

export function buildDescription(c: CopyContext): string {
  const openers = [
    `${c.location.name} is ${c.location.character}.`,
    `This one sends you to ${c.location.name} — ${c.location.character}.`,
    `${c.location.region}, specifically ${c.location.name}: ${c.location.character}.`,
  ];

  const middles = [
    `The route is about ${c.distance.toFixed(1)} km with ${c.elevationGain} m of climbing, which most people walk in around ${Math.round(c.duration / 60)} hours at an unhurried pace.`,
    `Expect ${c.distance.toFixed(1)} km and ${c.elevationGain} m up. Budget roughly ${Math.round(c.duration / 60)} hours of moving time, more if you stop properly.`,
    `Call it ${c.distance.toFixed(1)} km, ${c.elevationGain} m of ascent, and ${Math.round(c.duration / 60)} hours on your feet.`,
  ];

  const closers: Record<Timing, string[]> = {
    sunrise: [
      "Start in the dark. The whole point is being up there when the light arrives.",
      "This is an early one — the first hour is the reason you set the alarm.",
    ],
    sunset: [
      "Time it backwards from sunset and carry a headtorch anyway.",
      "The last hour is what you came for. Don't rush it, but don't be late either.",
    ],
    daylight: [
      "Go when you can see what you're doing, and leave enough margin at the end.",
      "Daylight is the only real constraint here.",
    ],
    open: [
      "No schedule attached. Go when you feel like leaving the house.",
      "There's no correct time to do this. That's the appeal.",
    ],
  };

  return [c.rng.pick(openers), c.rng.pick(middles), c.rng.pick(closers[c.timing])].join(" ");
}

export function buildSafetyNotes(c: CopyContext): string {
  const base: string[] = [];

  if (c.difficulty === "HARD" || c.difficulty === "EXPERT") {
    base.push("This is a demanding route — proper boots, water for the full day, and a real weather check before you commit.");
  } else {
    base.push("Nothing technical here, but take water, a layer and something to eat.");
  }

  if (c.timing === "sunset" || c.timing === "sunrise") {
    base.push("You will be moving in low light, so a headtorch isn't optional.");
  }

  if (c.location.caution) base.push(c.location.caution);

  base.push("Tell someone where you're going and when you expect to be back.");
  return base.join(" ");
}

/** A short, deterministic route sketch used by the map preview. */
export function buildWaypoints(c: CopyContext): Array<{ lat: number; lng: number; label: string }> {
  const spread = Math.min(0.05, 0.004 + c.distance * 0.0016);
  const points = [
    { label: "Trailhead", dx: 0, dy: 0 },
    { label: "First climb", dx: spread * 0.5, dy: spread * 0.35 },
    { label: c.primaryFeature === "summit" ? "Summit" : "Objective", dx: spread, dy: spread * 0.9 },
    { label: "Descent", dx: spread * 0.4, dy: spread * 1.25 },
    { label: "Back to start", dx: 0, dy: 0 },
  ];

  return points.map((p) => ({
    label: p.label,
    lat: Number((c.location.latitude + p.dy * c.rng.float(0.7, 1.3)).toFixed(5)),
    lng: Number((c.location.longitude + p.dx * c.rng.float(0.7, 1.3)).toFixed(5)),
  }));
}
