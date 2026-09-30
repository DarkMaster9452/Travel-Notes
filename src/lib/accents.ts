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
  PINE: { label: "Pine", ink: "#0f6639", deep: "#1d4a33", wash: "#e3f4e8", edge: "#c6ead2" },
  MOSS: { label: "Moss", ink: "#4a6a2a", deep: "#3a5520", wash: "#eef3e4", edge: "#d6e2c2" },
  STONE: { label: "Stone", ink: "#4a5a4f", deep: "#33423a", wash: "#e9f0e4", edge: "#d5e0cf" },
  WATER: { label: "Water", ink: "#0b5e96", deep: "#0a4a76", wash: "#e1f2fd", edge: "#bfe2fa" },
  CLAY: { label: "Clay", ink: "#a63a12", deep: "#80300f", wash: "#ffe9df", edge: "#ffc2a8" },
  DUSK: { label: "Dusk", ink: "#5b3fb0", deep: "#47318a", wash: "#eee8fc", edge: "#d6cbf7" },
  SIGNAL: { label: "Signal", ink: "#b0245c", deep: "#8c1c49", wash: "#fde6ef", edge: "#f8c3d8" },
};

export const ACCENT_KEYS = Object.keys(ACCENT_INK) as ProfileAccent[];

export function accentInk(accent: ProfileAccent | null | undefined): AccentInk {
  return ACCENT_INK[accent ?? "PINE"] ?? ACCENT_INK.PINE;
}

/**
 * The four inks the figures are printed in.
 *
 * Fixed rather than derived from the profile's accent: four shades of one hue
 * is a ramp, and a ramp does not help anybody tell kilometres from
 * metres at a glance. These are a set of highlighter pens — always the same
 * four, always in the same order, so the second time somebody reads a profile
 * they already know which colour means what.
 */
export const FIGURE_INKS = [
  { ink: "#0f6639", wash: "#e3f4e8", edge: "#c6ead2" },
  { ink: "#0b5e96", wash: "#e1f2fd", edge: "#bfe2fa" },
  { ink: "#5b3fb0", wash: "#eee8fc", edge: "#d6cbf7" },
  { ink: "#0b6e65", wash: "#dcf5f2", edge: "#b5ebe4" },
] as const;

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
