/**
 * What each sticker looks like (design/DESIGN-SYSTEM.md §7.11).
 *
 * These are printed things — die-cut, gummed, posted — so they are not all the
 * same disc in the same green. Each has a cut, an ink from the playful Trail
 * palette and a glyph. Colour carries meaning where there is meaning to carry:
 * the ladders deepen as they get harder, boards and long streaks are gold,
 * water is sky and lake, the dawn start is sunset.
 *
 * Deliberately data, not markup: the sheet, the dashboard, a public profile
 * and the landing page all draw from here, and a sticker that changed colour
 * on one of them would be a different sticker. `components/domain/sticker`
 * turns an entry into pixels.
 */

export type StickerCut = "disc" | "leaf" | "leafFlipped" | "arch" | "blob" | "shield";

export type StickerTone =
  | "sun"
  | "gold"
  | "mint"
  | "meadow"
  | "deep"
  | "lake"
  | "sky"
  | "berry"
  | "lilac"
  | "sunset"
  | "stone"
  | "night";

export type StickerGlyph =
  | "sun"
  | "ridge"
  | "trees"
  | "peak"
  | "ascent"
  | "laurel"
  | "map"
  | "peaks"
  | "winter"
  | "compass"
  | "marker"
  | "calendar"
  | "medal"
  | "water"
  | "ruin"
  | "notes"
  | "flag";

export type StickerArt = { cut: StickerCut; tone: StickerTone; glyph: StickerGlyph };

/**
 * Keyed by the `sticker` field on each achievement definition. Anything
 * without an entry falls back to `DEFAULT_STICKER`, so adding an achievement
 * never breaks the sheet.
 */
export const STICKER_ART: Record<string, StickerArt> = {
  /* ---- the first row: everybody holds these ---------------------------- */
  "first-light": { cut: "arch", tone: "sun", glyph: "sun" },
  "second-wind": { cut: "leaf", tone: "mint", glyph: "ridge" },
  "into-the-trees": { cut: "blob", tone: "meadow", glyph: "trees" },
  "first-ridge": { cut: "shield", tone: "lake", glyph: "peak" },
  "twenty-five": { cut: "disc", tone: "sky", glyph: "ascent" },
  "thousand-metres": { cut: "leafFlipped", tone: "berry", glyph: "ascent" },

  /* ---- Explorer's ------------------------------------------------------ */
  "ten-logged": { cut: "disc", tone: "gold", glyph: "laurel" },
  cartographer: { cut: "arch", tone: "lilac", glyph: "map" },
  "gorge-rat": { cut: "blob", tone: "stone", glyph: "ridge" },
  "long-hauler": { cut: "leaf", tone: "sunset", glyph: "ascent" },

  /* ---- the logged ladder ----------------------------------------------- */
  "twenty-five-logged": { cut: "shield", tone: "mint", glyph: "peaks" },
  "fifty-logged": { cut: "shield", tone: "meadow", glyph: "peaks" },
  "hundred-logged": { cut: "shield", tone: "deep", glyph: "peaks" },
  "two-hundred-logged": { cut: "shield", tone: "night", glyph: "peaks" },

  /* ---- the ascent ladder ----------------------------------------------- */
  "five-thousand-up": { cut: "leafFlipped", tone: "sky", glyph: "ascent" },
  everest: { cut: "leafFlipped", tone: "gold", glyph: "peak" },
  "ten-thousand-up": { cut: "leafFlipped", tone: "lake", glyph: "ascent" },
  "twenty-five-thousand-up": { cut: "leafFlipped", tone: "night", glyph: "winter" },

  /* ---- the distance ladder --------------------------------------------- */
  "two-fifty-km": { cut: "leaf", tone: "mint", glyph: "compass" },
  "five-hundred-km": { cut: "leaf", tone: "lake", glyph: "compass" },
  "thousand-km": { cut: "leaf", tone: "sunset", glyph: "compass" },

  /* ---- ground covered --------------------------------------------------- */
  "ten-regions": { cut: "arch", tone: "lilac", glyph: "map" },
  "twenty-regions": { cut: "arch", tone: "berry", glyph: "map" },
  "border-crosser": { cut: "blob", tone: "sky", glyph: "marker" },
  "five-countries": { cut: "blob", tone: "night", glyph: "marker" },

  /* ---- what was actually out there -------------------------------------- */
  "peak-bagger": { cut: "shield", tone: "meadow", glyph: "flag" },
  "deep-woods": { cut: "blob", tone: "deep", glyph: "trees" },
  "lake-district": { cut: "disc", tone: "sky", glyph: "water" },
  "waterfall-chaser": { cut: "disc", tone: "lake", glyph: "water" },
  "ruin-hunter": { cut: "arch", tone: "lilac", glyph: "ruin" },

  /* ---- the rare tier ---------------------------------------------------- */
  "field-notes": { cut: "arch", tone: "stone", glyph: "notes" },
  "winter-ridge": { cut: "leafFlipped", tone: "sky", glyph: "winter" },
  "twelve-months": { cut: "disc", tone: "lilac", glyph: "calendar" },
  unbroken: { cut: "shield", tone: "night", glyph: "medal" },
  "dawn-start": { cut: "blob", tone: "sunset", glyph: "sun" },
  "honest-retreat": { cut: "leaf", tone: "deep", glyph: "peaks" },
};

export const DEFAULT_STICKER: StickerArt = { cut: "disc", tone: "mint", glyph: "peak" };

export function stickerArt(key: string): StickerArt {
  return STICKER_ART[key] ?? DEFAULT_STICKER;
}

/** −3° … 3°, never 0, stable for a given key: a sheet is not ruled paper. */
export function stickerTilt(key: string): -3 | -2 | -1 | 1 | 2 | 3 {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ([-3, -2, -1, 1, 2, 3] as const)[hash % 6];
}
