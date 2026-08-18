/**
 * The mark a quest wears.
 *
 * Every quest gets a small engraved landscape of its own, drawn from its id.
 * It is not a picture of the place — a photograph does that job, and inventing
 * one would be a lie about somewhere real. It is a *mark*: the same quest is
 * the same shape everywhere it appears, and two quests are never the same
 * shape, so the sheet on the dashboard and the row in your history are
 * recognisably the same thing without reading a word.
 *
 * Deterministic on purpose, and pure. Nothing is stored, nothing is fetched,
 * and the server and the browser draw the identical thing from the same id,
 * so it costs a hash and renders inside the HTML.
 *
 * Shape comes from the id, colour comes from the ground. That split is
 * deliberate: quests in water country share a family resemblance while still
 * being individually identifiable, which is what makes the marks feel like a
 * set rather than like noise.
 */

export type ArtTone = "pine" | "moss" | "stone" | "water" | "clay" | "dusk";

export type QuestArt = {
  tone: ArtTone;
  /** Back-to-front ridge lines, each a list of y values across a unit width. */
  ridges: number[][];
  /** Sun or moon, in unit coordinates. */
  disc: { x: number; y: number; r: number };
  /** True for a night mark: the disc gets a bite taken out of it. */
  crescent: boolean;
  /** Small strokes in the sky. Birds by day, stars by night. */
  marks: { x: number; y: number }[];
};

/** Width of the unit grid the art is described on. Height is 100. */
export const ART_W = 200;
export const ART_H = 100;

/** FNV-1a. Small, stable across runtimes, and good enough to spread ids. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 — one line, no state to leak, repeatable. */
function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TONE_RULES: { tone: ArtTone; tags: string[] }[] = [
  { tone: "water", tags: ["water", "lakes", "lake", "waterfalls", "rivers", "river", "gorge"] },
  { tone: "stone", tags: ["rocks", "rock", "ridges", "ridge", "peaks", "alpine", "mountains", "scramble"] },
  { tone: "clay", tags: ["castles", "ruins", "history", "historic"] },
  { tone: "moss", tags: ["forest", "woods", "meadows", "trees"] },
];

/** Which ink the ground calls for. First rule that matches wins. */
function toneFor(tags: readonly string[], rng: () => number): ArtTone {
  const lowered = tags.map((tag) => tag.toLowerCase());
  for (const rule of TONE_RULES) {
    if (rule.tags.some((tag) => lowered.includes(tag))) return rule.tone;
  }
  // Nothing distinctive on the ground: let the id decide between the two
  // neutral greens, so a catalogue of untagged places is not one flat colour.
  return rng() < 0.5 ? "pine" : "dusk";
}

/**
 * Build the mark for one quest.
 *
 * `seed` should be the quest id — stable for the life of the quest, and unique
 * across accounts, so nobody else's quest wears your shape.
 */
export function questArt(seed: string, tags: readonly string[] = []): QuestArt {
  const rng = rngFrom(hash(seed));

  const tone = toneFor(tags, rng);

  // Three to five ridges. The back ones are high, shallow and calm; the front
  // ones sit low and are allowed to be jagged. That ordering is what reads as
  // distance rather than as a stack of similar lines.
  const layers = 3 + Math.floor(rng() * 3);
  const points = 9;
  const ridges: number[][] = [];

  for (let layer = 0; layer < layers; layer++) {
    const depth = layer / Math.max(1, layers - 1); // 0 back → 1 front
    const base = 34 + depth * 44;
    const amplitude = (26 - depth * 9) * (0.65 + rng() * 0.7);
    const row: number[] = [];
    let drift = rng() * Math.PI * 2;
    for (let i = 0; i < points; i++) {
      drift += 0.5 + rng() * 0.9;
      const wave = Math.sin(drift) * 0.6 + Math.sin(drift * 2.3) * 0.4;
      row.push(clamp(base - wave * amplitude, 6, ART_H - 2));
    }
    ridges.push(row);
  }

  const crescent = rng() < 0.35;
  const disc = {
    x: 24 + rng() * (ART_W - 60),
    y: 16 + rng() * 16,
    r: 7 + rng() * 5,
  };

  const markCount = Math.floor(rng() * 4);
  const marks: { x: number; y: number }[] = [];
  for (let i = 0; i < markCount; i++) {
    marks.push({ x: 12 + rng() * (ART_W - 24), y: 8 + rng() * 26 });
  }

  return { tone, ridges, disc, crescent, marks };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * The crest alone, as an open line.
 *
 * Drawn over the filled ridge so each layer has an edge. Without it the fills
 * blur into one another at card size and the whole thing reads as a smudge
 * rather than as a landscape — the edges are what make it recognisable, which
 * is the only job this drawing has.
 */
export function crestPath(row: number[]): string {
  const step = ART_W / (row.length - 1);
  const xy = row.map((y, i) => [i * step, y] as const);

  let d = `M0 ${xy[0]![1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [x1, y1] = xy[i]!;
    const [x2, y2] = xy[i + 1]!;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    d += ` Q${x1.toFixed(1)} ${y1.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = xy.at(-1)!;
  d += ` L${ART_W} ${last[1].toFixed(1)}`;
  return d;
}

/**
 * A ridge as a closed path, smoothed with mid-point quadratics.
 *
 * Cheaper than a real spline and visually indistinguishable at this size, and
 * it never overshoots — a Catmull-Rom through jagged points can loop above the
 * ridge line, which on a mountain reads as a mistake rather than as a curve.
 */
export function ridgePath(row: number[]): string {
  const step = ART_W / (row.length - 1);
  const xy = row.map((y, i) => [i * step, y] as const);

  let d = `M0 ${ART_H} L0 ${xy[0]![1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [x1, y1] = xy[i]!;
    const [x2, y2] = xy[i + 1]!;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    d += ` Q${x1.toFixed(1)} ${y1.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = xy.at(-1)!;
  d += ` L${ART_W} ${last[1].toFixed(1)} L${ART_W} ${ART_H} Z`;
  return d;
}
