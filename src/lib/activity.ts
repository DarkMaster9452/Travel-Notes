import "server-only";

import { db } from "@/lib/db";

/**
 * How much somebody is around.
 *
 * The public profile draws a year of this as a grid, so the question it has to
 * answer is "was this person here that day", not "what exactly did they do".
 * That shapes everything below:
 *
 *   · one row per account per day, holding a count — not a row per event, so a
 *     year is 365 rows and nothing here can be read back as a timeline of
 *     somebody's movements;
 *   · UTC throughout, matching the rest of the reporting, so two profiles side
 *     by side are comparable rather than each drawn in its own timezone;
 *   · fire-and-forget on the way in. A failed write must never roll back the
 *     thing the person actually did — losing a square off a grid is nothing,
 *     and losing somebody's filed proof because a counter was busy is not.
 */

/** Midnight UTC on the day `at` falls in. The grid's unit. */
export function utcDay(at: Date = new Date()): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

/**
 * Record that this account did something today.
 *
 * Never throws and never awaits anything the caller depends on. Call it and
 * carry on — `void touch(user.id)` is the intended shape at every call site.
 */
export async function touch(userId: string, at: Date = new Date()): Promise<void> {
  const day = utcDay(at);

  try {
    await db.activityDay.upsert({
      where: { userId_day: { userId, day } },
      create: { userId, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // Deliberately silent. This is a decoration on a profile page; it is not
    // worth a log line on every hot path, let alone an interrupted request.
  }
}

/** One square. */
export type ActivityCell = {
  /** "2026-08-26". */
  key: string;
  /** Midnight UTC. Null for the padding cells before the first week starts. */
  day: Date | null;
  count: number;
};

export type ActivityGrid = {
  /** Oldest first, each of length 7, Monday at the top. */
  weeks: ActivityCell[][];
  /** Column index → month name, only where the month changes. */
  months: { at: number; label: string }[];
  /** Everything in the window, for the heading. */
  total: number;
  /** Days with anything at all on them. */
  days: number;
  /** The busiest single day in the window. */
  best: number;
};

const WEEKS = 53;

/**
 * A year of squares, in the shape GitHub taught everybody to read.
 *
 * Columns are weeks running left to right, rows are weekdays running Monday to
 * Sunday. The window ends on the Sunday of the current week so the last column
 * is always complete-looking, and starts 53 columns earlier, which is a little
 * over a year — the extra column is what stops the leftmost one being a stub.
 *
 * Padding cells at the start carry a null `day`: they exist so the grid is
 * rectangular, and they are rendered as nothing rather than as an empty day,
 * because "no activity" and "before you joined" are not the same claim.
 */
export async function getActivityGrid(
  userId: string,
  now: Date = new Date(),
): Promise<ActivityGrid> {
  const today = utcDay(now);

  // Sunday closes the week, so shift Sunday (0) to 7 and count forward to it.
  const weekday = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + (7 - weekday));

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1));

  const rows = await db.activityDay.findMany({
    where: { userId, day: { gte: start, lte: end } },
    select: { day: true, count: true },
    orderBy: { day: "asc" },
  });

  const counts = new Map(rows.map((row) => [row.day.toISOString().slice(0, 10), row.count]));

  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

  const weeks: ActivityCell[][] = [];
  const months: { at: number; label: string }[] = [];
  let total = 0;
  let days = 0;
  let best = 0;
  let seenMonth = -1;

  const cursor = new Date(start);
  for (let week = 0; week < WEEKS; week += 1) {
    const column: ActivityCell[] = [];

    for (let row = 0; row < 7; row += 1) {
      const key = cursor.toISOString().slice(0, 10);
      const future = cursor.getTime() > today.getTime();
      const count = future ? 0 : (counts.get(key) ?? 0);

      column.push({ key, day: future ? null : new Date(cursor), count });

      if (count > 0) {
        total += count;
        days += 1;
        if (count > best) best = count;
      }

      // A month label belongs above the column its first day lands in, and
      // only once — a strip that repeated "Aug" four times would be noise.
      if (row === 0 && cursor.getUTCMonth() !== seenMonth) {
        seenMonth = cursor.getUTCMonth();
        months.push({ at: week, label: month.format(cursor) });
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    weeks.push(column);
  }

  return { weeks, months, total, days, best };
}

/**
 * How busy a day was, as a step from 0–4.
 *
 * Tuned for days, not months. The month strip this replaced used a scale where
 * one quest was already a visible step; on a daily grid almost every non-empty
 * square would land on that first step and the ramp would collapse to two
 * shades. Capped rather than normalised per profile, on the same reasoning as
 * before: two grids side by side should be comparable.
 */
export function dayHeat(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}
