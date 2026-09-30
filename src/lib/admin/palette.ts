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
 * one-hue ordinal ramps drawn from the Meadow greens (design/tokens.css), validated for
 * monotone lightness (ΔL ≥ 0.06 between steps), a single hue, and a light end
 * that still clears the card it sits on. Because the brand green is
 * deliberately low-chroma, every chart carries direct numbers and a legend as
 * well, so nothing is ever encoded by colour alone.
 */

/** Ordinal ramp, light → dark. Three ordered bands. */
export const RAMP_3 = ["#8fe0b0", "#22a360", "#0f6639"] as const;

/** Ordinal ramp, light → dark. Four ordered bands. */
export const RAMP_4 = ["#b6ecc9", "#5fd394", "#22a360", "#0f6639"] as const;

/** A whole, and the part of it that is finished. Nested, never crossing. */
export const BAND_WHOLE = "#b6ecc9";
export const BAND_PART = "#157a47";

/** One series with no identity to carry. */
export const SOLO = "#22a360";

/**
 * Reserved meanings, never reused as "series 4". Always rendered with the
 * status spelled out beside them — colour confirms, it never encodes alone.
 */
export const STATUS_COLOR = {
  good: "#157a47",
  trialing: "#4fb3f6",
  alert: "#c0262d",
  dormant: "#8a9a8e",
} as const;

/** Recessive furniture: grid first, axis a touch stronger. */
export const GRID = "var(--sq-border-soft)";
export const AXIS = "var(--sq-border)";

/** The card the charts are drawn on — the ring colour on overlapping marks. */
export const CHART_SURFACE = "var(--sq-surface)";
