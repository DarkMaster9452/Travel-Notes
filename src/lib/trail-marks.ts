/**
 * KST trail marks — the painted blazes a hiker follows on the ground.
 *
 * Stored on a quest as an ordered list, in walking order (`["RED", "BLUE"]`
 * means "follow the red, then switch to the blue"). The list is empty until
 * an editor fills it in: people navigate by this, so it is never guessed.
 *
 * Rendering rules: design/DESIGN-SYSTEM.md §1.5.
 */

export const TRAIL_MARKS = ["RED", "BLUE", "GREEN", "YELLOW", "EDUCATIONAL"] as const;

export type TrailMark = (typeof TRAIL_MARKS)[number];

/** How many marks a card shows before collapsing the rest into "+n". */
export const TRAIL_MARKS_SHOWN = 3;

export function isTrailMark(value: string): value is TrailMark {
  return (TRAIL_MARKS as readonly string[]).includes(value);
}

/** Only the known marks, in order, from whatever the database holds. */
export function trailMarksOf(values: readonly string[] | null | undefined): TrailMark[] {
  return (values ?? []).filter(isTrailMark);
}

/**
 * Parse the editor's free-text field: "red, blue" or "RED BLUE" or
 * "red → blue". Returns null when any token is not a mark, so the form can
 * say so instead of silently dropping it.
 */
export function parseTrailMarks(input: string): TrailMark[] | null {
  const tokens = input
    .toUpperCase()
    .split(/[\s,;→>/-]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const marks: TrailMark[] = [];
  for (const token of tokens) {
    if (!isTrailMark(token)) return null;
    marks.push(token);
  }
  return marks;
}

/** The CSS token each stripe mark is painted with. */
export const TRAIL_MARK_COLOR: Record<Exclude<TrailMark, "EDUCATIONAL">, string> = {
  RED: "var(--color-mark-red)",
  BLUE: "var(--color-mark-blue)",
  GREEN: "var(--color-mark-green)",
  YELLOW: "var(--color-mark-yellow)",
};
