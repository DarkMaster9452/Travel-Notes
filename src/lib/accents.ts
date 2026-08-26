import type { ProfileAccent } from "@prisma/client";

/**
 * The ink a profile is printed in.
 *
 * The column already existed and was set on every account — it was simply
 * never rendered, which is why every public page looked the same as every
 * other one. Seven inks, deliberately: somebody should be recognisable by
 * their colour, and that stops working at twenty of them.
 *
 * Each entry is a small set rather than a single hex, because a colour has to
 * work in four places at once — as a band behind white text, as a wash behind
 * dark text, as a hairline, and as a chip. Picking those four by hand keeps
 * the contrast honest; deriving them from one hue does not.
 */
export type AccentInk = {
  label: string;
  /** For text and marks on paper. Always dark enough to read at 12px. */
  ink: string;
  /** The header band. Dark; carries `--forest-ink` white text. */
  deep: string;
  /** A tint of the same hue, for chips and washes behind dark text. */
  wash: string;
  /** The wash's edge, one step down. */
  edge: string;
};

export const ACCENT_INK: Record<ProfileAccent, AccentInk> = {
  PINE: { label: "Pine", ink: "#1e3b2c", deep: "#1b3325", wash: "#dfe8dd", edge: "#c2d4c0" },
  MOSS: { label: "Moss", ink: "#3a6047", deep: "#2c5540", wash: "#e2e9dd", edge: "#cbd8c4" },
  STONE: { label: "Stone", ink: "#4c5460", deep: "#3a414c", wash: "#e2e5e8", edge: "#ccd2d8" },
  WATER: { label: "Water", ink: "#26596f", deep: "#1d4557", wash: "#d9e8ee", edge: "#b8d5e0" },
  CLAY: { label: "Clay", ink: "#96502c", deep: "#743c20", wash: "#f5e3d7", edge: "#e6c9b3" },
  DUSK: { label: "Dusk", ink: "#544576", deep: "#40355c", wash: "#e5e0ef", edge: "#cfc6e2" },
  SIGNAL: { label: "Signal", ink: "#a53c16", deep: "#8a3212", wash: "#fbe7de", edge: "#f2cdb9" },
};

export const ACCENT_KEYS = Object.keys(ACCENT_INK) as ProfileAccent[];

export function accentInk(accent: ProfileAccent | null | undefined): AccentInk {
  return ACCENT_INK[accent ?? "PINE"] ?? ACCENT_INK.PINE;
}

/**
 * The four inks the figures are printed in.
 *
 * Fixed rather than derived from the profile's accent: four shades of one hue
 * is a gradient, and a gradient does not help anybody tell kilometres from
 * metres at a glance. These are a set of highlighter pens — always the same
 * four, always in the same order, so the second time somebody reads a profile
 * they already know which colour means what.
 */
export const FIGURE_INKS = [
  { ink: "#2c5540", wash: "#e2e9dd", edge: "#cbd8c4" },
  { ink: "#26596f", wash: "#d9e8ee", edge: "#b8d5e0" },
  { ink: "#a53c16", wash: "#fbe7de", edge: "#f2cdb9" },
  { ink: "#8a6414", wash: "#f6ecd4", edge: "#e8d7a8" },
] as const;

/**
 * How busy a month was, as a step from 0–4.
 *
 * Capped rather than scaled to the person's own maximum: a strip that
 * normalised to each profile would print somebody's one-walk month as solid
 * black, and two profiles side by side would be lying about each other.
 */
export function heat(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

/**
 * What the ground was, in colour.
 *
 * Bucketed by what a tag *is* rather than matched exactly, because the quest
 * vocabulary has grown organically — "mountain", "mountains", "peak", "peaks"
 * and "summit" are one idea wearing five spellings, and a lookup table keyed
 * on all five drifts the moment the sixth is written. Anything unrecognised
 * prints in plain ink rather than being dropped: a new tag should still show
 * up on somebody's page the day it is invented.
 */
const TERRAIN_GROUPS: { ink: string; wash: string; edge: string; match: RegExp }[] = [
  { // rock and height
    ink: "#4c5460",
    wash: "#e4e7ea",
    edge: "#ccd2d8",
    match: /mountain|peak|summit|ridge|alpine|rock|scramble|karst|plateau|cliff|scree/,
  },
  { // water
    ink: "#26596f",
    wash: "#d9e8ee",
    edge: "#b8d5e0",
    match: /lake|river|waterfall|gorge|cave|spring|tarn|coast|sea/,
  },
  { // green things
    ink: "#2c5540",
    wash: "#e2e9dd",
    edge: "#cbd8c4",
    match: /forest|tree|wood|meadow|valley|moss|grass|park/,
  },
  { // things people built
    ink: "#96502c",
    wash: "#f5e3d7",
    edge: "#e6c9b3",
    match: /ruin|castle|chapel|tower|hut|bridge|mine|monument/,
  },
  { // light
    ink: "#8a6414",
    wash: "#f6ecd4",
    edge: "#e8d7a8",
    match: /sunrise|sunset|viewpoint|panorama|star|dawn|dusk/,
  },
];

const PLAIN_TERRAIN = { ink: "#47544b", wash: "#e3e8d7", edge: "#d5dcc5" };

export function terrainInk(tag: string): { ink: string; wash: string; edge: string } {
  const value = tag.toLowerCase();
  return TERRAIN_GROUPS.find((group) => group.match.test(value)) ?? PLAIN_TERRAIN;
}
