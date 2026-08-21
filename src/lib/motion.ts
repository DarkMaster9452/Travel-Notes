/**
 * Motion constants that server components need.
 *
 * `stagger` lives here rather than beside the `Reveal` component because that
 * module is `"use client"`, and everything exported from a client module
 * becomes a client reference — calling one during a server render throws. The
 * animation components stay on the client; the arithmetic that decides their
 * delays is plain and belongs to both sides.
 */

export const STAGGER_MS = 70;

/**
 * Delay for the nth sibling in a staggered group, in milliseconds.
 *
 * Capped, because past the sixth item a stagger stops reading as rhythm and
 * starts reading as the page being slow.
 */
export function stagger(index: number, max = 6): number {
  return Math.min(index, max) * STAGGER_MS;
}

/**
 * The house easing, as an anime.js ease string.
 *
 * The same curve the stylesheet calls `--ease-field`, so a scripted entrance
 * and a CSS hover on the same element agree about how this product moves.
 */
export const EASE_FIELD = "cubicBezier(.2,.8,.3,1)";

/** A little overshoot. Stamps, stickers, anything that should land physically. */
export const EASE_BACK = "outBack(1.7)";

/** Entrance durations, in milliseconds. Short enough to never gate a reader. */
export const DURATION = {
  micro: 180,
  quick: 320,
  base: 560,
  slow: 760,
} as const;
