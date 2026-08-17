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
