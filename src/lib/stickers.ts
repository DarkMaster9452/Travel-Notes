import type { GlyphName } from "@/components/sq/icons";

/**
 * What each sticker actually looks like.
 *
 * These are printed things — die-cut, gummed, posted — so they are not all the
 * same disc in the same green. A sheet where every sticker is identical apart
 * from its glyph reads as a list of achievements; a sheet where the shapes and
 * the inks differ reads as a sheet of stickers, which is what the product
 * posts.
 *
 * Colour carries meaning where there is meaning to carry: the distance and
 * ascent ladders climb through the green ramp as they get harder, boards and
 * medals are gold, the retreat and the dawn start are stamp ink. Everything
 * else is chosen so that no two neighbours on the sheet collide.
 *
 * Deliberately data, not CSS: the sheet, the dashboard panel and the public
 * profile all draw from here, and a sticker that changed colour on one of them
 * would be a different sticker.
 */

export type StickerShape = "disc" | "leaf" | "leafFlipped" | "arch" | "blob" | "shield";

export type StickerStyle = {
  /** The die-cut. */
  shape: StickerShape;
  /** The ink it is printed in. */
  bg: string;
  /** The glyph on top of it. */
  fg: string;
  glyph: GlyphName;
};

/** The border-radius each die-cut maps to. */
export const SHAPE_RADIUS: Record<StickerShape, string> = {
  disc: "999px",
  leaf: "60% 60% 60% 8px",
  leafFlipped: "8px 60% 60% 60%",
  arch: "999px 999px 14px 14px",
  blob: "45% 55% 60% 40% / 55% 45% 50% 50%",
  shield: "16px 16px 50% 50%",
};

const PAPER = "#f9faf3";
const DEEP = "#14251b";

/**
 * Keyed by the `sticker` field on each achievement definition.
 *
 * Anything without an entry falls back to `DEFAULT_STICKER`, so adding an
 * achievement never breaks the sheet — it just arrives in house green until
 * somebody draws it one.
 */
export const STICKER_STYLES: Record<string, StickerStyle> = {
  /* ---- the first row: everybody holds these ---------------------------- */
  "first-light": { shape: "arch", bg: "#f2c14e", fg: DEEP, glyph: "sun" },
  "second-wind": { shape: "leaf", bg: "#a8bfa5", fg: DEEP, glyph: "ridge" },
  "into-the-trees": { shape: "blob", bg: "#3a6047", fg: PAPER, glyph: "book" },
  "first-ridge": { shape: "shield", bg: "#7e9a80", fg: DEEP, glyph: "peak" },
  "twenty-five": { shape: "disc", bg: "#cbd8c4", fg: DEEP, glyph: "ascent" },
  "thousand-metres": { shape: "leafFlipped", bg: "#1e3b2c", fg: PAPER, glyph: "ascent" },

  /* ---- Explorer's ------------------------------------------------------ */
  "ten-logged": { shape: "disc", bg: "#d9a13c", fg: DEEP, glyph: "laurel" },
  cartographer: { shape: "arch", bg: "#e8622f", fg: PAPER, glyph: "map" },
  "gorge-rat": { shape: "blob", bg: "#2c5540", fg: PAPER, glyph: "ridge" },
  "long-hauler": { shape: "leaf", bg: "#c4481b", fg: PAPER, glyph: "ascent" },

  /* ---- the logged ladder ----------------------------------------------- */
  "twenty-five-logged": { shape: "shield", bg: "#a8bfa5", fg: DEEP, glyph: "peaks" },
  "fifty-logged": { shape: "shield", bg: "#7e9a80", fg: DEEP, glyph: "peaks" },
  "hundred-logged": { shape: "shield", bg: "#3a6047", fg: PAPER, glyph: "peaks" },
  "two-hundred-logged": { shape: "shield", bg: "#14251b", fg: "#d9a13c", glyph: "peaks" },

  /* ---- the ascent ladder ----------------------------------------------- */
  "five-thousand-up": { shape: "leafFlipped", bg: "#cbd8c4", fg: DEEP, glyph: "ascent" },
  everest: { shape: "leafFlipped", bg: "#d9a13c", fg: DEEP, glyph: "peak" },
  "ten-thousand-up": { shape: "leafFlipped", bg: "#2c5540", fg: PAPER, glyph: "ascent" },
  "twenty-five-thousand-up": { shape: "leafFlipped", bg: "#1e3b2c", fg: "#f2c14e", glyph: "winter" },

  /* ---- the distance ladder --------------------------------------------- */
  "two-fifty-km": { shape: "leaf", bg: "#cbd8c4", fg: DEEP, glyph: "compass" },
  "five-hundred-km": { shape: "leaf", bg: "#7e9a80", fg: DEEP, glyph: "compass" },
  "thousand-km": { shape: "leaf", bg: "#c4481b", fg: PAPER, glyph: "compass" },

  /* ---- ground covered --------------------------------------------------- */
  "ten-regions": { shape: "arch", bg: "#e8622f", fg: PAPER, glyph: "map" },
  "twenty-regions": { shape: "arch", bg: "#a53c16", fg: PAPER, glyph: "map" },
  "border-crosser": { shape: "blob", bg: "#6c7365", fg: PAPER, glyph: "marker" },
  "five-countries": { shape: "blob", bg: "#2a332c", fg: "#f2c14e", glyph: "marker" },

  /* ---- what was actually out there -------------------------------------- */
  "peak-bagger": { shape: "shield", bg: "#1e3b2c", fg: PAPER, glyph: "peaks" },
  "deep-woods": { shape: "blob", bg: "#21402f", fg: "#a8bfa5", glyph: "book" },
  "lake-district": { shape: "disc", bg: "#8fa9b8", fg: DEEP, glyph: "marker" },
  "waterfall-chaser": { shape: "disc", bg: "#6f97a8", fg: PAPER, glyph: "ridge" },
  "ruin-hunter": { shape: "arch", bg: "#8a6b4a", fg: PAPER, glyph: "book" },

  /* ---- the ones with a verdict behind them ------------------------------ */
  "honest-retreat": { shape: "disc", bg: "#7e9a80", fg: PAPER, glyph: "retreat" },
  "dawn-start": { shape: "disc", bg: "#e8622f", fg: PAPER, glyph: "sun" },
  "winter-ridge": { shape: "leafFlipped", bg: "#b9c2a8", fg: DEEP, glyph: "winter" },
  "field-notes": { shape: "arch", bg: "#cbd8c4", fg: DEEP, glyph: "book" },
};

export const DEFAULT_STICKER: StickerStyle = {
  shape: "disc",
  bg: "#cbd8c4",
  fg: DEEP,
  glyph: "peak",
};

export function stickerStyle(key: string): StickerStyle {
  return STICKER_STYLES[key] ?? DEFAULT_STICKER;
}

/**
 * A locked sticker keeps its die-cut and loses its ink.
 *
 * The shape is the part that says *which* sticker is missing, so it stays;
 * the colour is the reward, so it goes. A locked tile that was simply hidden
 * would remove the only reason to go and get it.
 */
export function lockedStyle(key: string): StickerStyle {
  return { ...stickerStyle(key), bg: "var(--paper-3)", fg: "var(--ink-3)" };
}
