/**
 * Chart ink.
 *
 * These live here rather than beside the chart components for the same reason
 * `stagger` lives in `lib/motion`: that module is `"use client"`, and every
 * export of a client module becomes a *client reference* when a server
 * component imports it. A server page that read the ramp from there would get
 * a reference rather than a colour and render bars with no fill at all — which
 * is exactly what happened before this file existed.
 *
 * The values are checked, not chosen. Almost nothing the panel charts is
 * nominal — plans, grades and statuses are all ordered — so the series take
 * one-hue ordinal ramps drawn from the product's greens, validated for
 * monotone lightness (ΔL ≥ 0.06 between steps), a single hue, and a light end
 * that still clears the card it sits on. Because the brand green is
 * deliberately low-chroma, every chart carries direct numbers and a legend as
 * well, so nothing is ever encoded by colour alone.
 */

/** Ordinal ramp, light → dark. Three ordered bands. */
export const RAMP_3 = ["#7e9a80", "#4d7358", "#21402f"] as const;

/** Ordinal ramp, light → dark. Four ordered bands. */
export const RAMP_4 = ["#7e9a80", "#5c7f62", "#3a6047", "#1e3b2c"] as const;

/** A whole, and the part of it that is finished. Nested, never crossing. */
export const BAND_WHOLE = "#7e9a80";
export const BAND_PART = "#1e3b2c";

/** One series with no identity to carry. */
export const SOLO = "#3a6047";

/**
 * Reserved meanings, never reused as "series 4". Always rendered with the
 * status spelled out beside them — colour confirms, it never encodes alone.
 */
export const STATUS_COLOR = {
  good: "#3a6047",
  trialing: "#7e9a80",
  alert: "#c4481b",
  dormant: "#848a78",
} as const;

/** Recessive furniture: grid first, axis a touch stronger. */
export const GRID = "rgba(20, 26, 22, 0.08)";
export const AXIS = "rgba(20, 26, 22, 0.15)";

/** The card the charts are drawn on — the ring colour on overlapping marks. */
export const CHART_SURFACE = "#f9faf3";
