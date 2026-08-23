import "server-only";

import type { Plan, SchedulePeriod } from "@prisma/client";

import {
  slotDatesLabel,
  slotFromKey,
  slotLabel,
  type SlotState,
} from "@/lib/admin/schedule";
import { db } from "@/lib/db";

/**
 * Whether a quest has ever been the weekly or the monthly.
 *
 * The schedule already records this — one row per booked slot — but nothing
 * read it back the other way round. Every surface that lists quests wanted
 * the same two answers about each one ("has this been a weekly?", "when?"),
 * and each was on the way to computing them itself. This is that computation,
 * once.
 *
 * A booking that has not opened yet is *not* a run. A quest pencilled into
 * next March has not been the monthly, and a tag saying it has would be
 * describing the calendar rather than the quest. Those are carried separately
 * as `booked`, so an admin can still see what is coming.
 */

export type CadenceRun = {
  period: SchedulePeriod;
  /** `2026-W34` or `2026-09`. */
  slotKey: string;
  /** "Week 34" / "September 2026". */
  label: string;
  /** "17–23 Aug 2026". */
  dates: string;
  openAt: Date;
  closeAt: Date;
  state: SlotState;
  audience: Plan;
};

export type QuestCadence = {
  /** Slots that have opened, newest first. */
  runs: CadenceRun[];
  /** Slots booked but not yet open, soonest first. */
  booked: CadenceRun[];
  weeklyRuns: number;
  monthlyRuns: number;
  hasBeenWeekly: boolean;
  hasBeenMonthly: boolean;
  /** True while one of its slots is open right now. */
  isLive: boolean;
  /**
   * One sentence for the quest's description — "Ran as the monthly quest in
   * September 2026 (1–30 Sep 2026)." Null when it has never run.
   */
  line: string | null;
};

export const EMPTY_CADENCE: QuestCadence = {
  runs: [],
  booked: [],
  weeklyRuns: 0,
  monthlyRuns: 0,
  hasBeenWeekly: false,
  hasBeenMonthly: false,
  isLive: false,
  line: null,
};

/** "the weekly quest" / "the monthly quest", for prose. */
export function cadenceNoun(period: SchedulePeriod): string {
  return period === "WEEKLY" ? "the weekly quest" : "the monthly quest";
}

/** "Weekly" / "Monthly", for a tag. */
export function cadenceLabel(period: SchedulePeriod): string {
  return period === "WEEKLY" ? "Weekly" : "Monthly";
}

function toRun(row: {
  period: SchedulePeriod;
  slotKey: string;
  openAt: Date;
  closeAt: Date;
  audience: Plan;
}, now: Date): CadenceRun {
  const slot = slotFromKey(row.period, row.slotKey);
  const state: SlotState =
    now >= row.closeAt ? "past" : now >= row.openAt ? "live" : "future";

  return {
    period: row.period,
    slotKey: row.slotKey,
    label: slot ? slotLabel(slot) : row.slotKey,
    dates: slot ? slotDatesLabel(slot) : "",
    openAt: row.openAt,
    closeAt: row.closeAt,
    state,
    audience: row.audience,
  };
}

/**
 * The sentence appended to a quest's description.
 *
 * States the most recent run in full and then counts the rest, because "ran
 * as the weekly in Week 12, Week 19, Week 24, Week 31…" is a list nobody
 * reads. Live slots are written in the present tense — a quest that is the
 * weekly *right now* has not "been" one, it is one.
 */
function describe(runs: CadenceRun[]): string | null {
  if (runs.length === 0) return null;

  const [latest] = runs;
  const when = latest.dates ? `${latest.label} (${latest.dates})` : latest.label;
  const opening =
    latest.state === "live"
      ? `Running as ${cadenceNoun(latest.period)} for ${when}.`
      : `Ran as ${cadenceNoun(latest.period)} in ${when}.`;

  const earlier = runs.length - 1;
  if (earlier === 0) return opening;
  return `${opening} Featured ${earlier === 1 ? "once" : `${earlier} times`} before that.`;
}

function build(rows: CadenceRun[]): QuestCadence {
  const runs = rows
    .filter((run) => run.state !== "future")
    .sort((a, b) => b.openAt.getTime() - a.openAt.getTime());
  const booked = rows
    .filter((run) => run.state === "future")
    .sort((a, b) => a.openAt.getTime() - b.openAt.getTime());

  const weeklyRuns = runs.filter((run) => run.period === "WEEKLY").length;
  const monthlyRuns = runs.filter((run) => run.period === "MONTHLY").length;

  return {
    runs,
    booked,
    weeklyRuns,
    monthlyRuns,
    hasBeenWeekly: weeklyRuns > 0,
    hasBeenMonthly: monthlyRuns > 0,
    isLive: runs.some((run) => run.state === "live"),
    line: describe(runs),
  };
}

/**
 * Cadence for a set of quests, in one query.
 *
 * Takes the ids rather than fetching them so the caller keeps control of its
 * own `where` — this is a join it does not have to write, not a second way to
 * list quests. Ids with no schedule row are absent from the map; read them
 * through `EMPTY_CADENCE`.
 */
export async function getQuestCadences(
  questIds: readonly string[],
  now = new Date(),
): Promise<Map<string, QuestCadence>> {
  if (questIds.length === 0) return new Map();

  const rows = await db.questSchedule.findMany({
    where: { questId: { in: [...questIds] } },
    select: {
      questId: true,
      period: true,
      slotKey: true,
      openAt: true,
      closeAt: true,
      audience: true,
    },
  });

  const grouped = new Map<string, CadenceRun[]>();
  for (const row of rows) {
    const list = grouped.get(row.questId) ?? [];
    list.push(toRun(row, now));
    grouped.set(row.questId, list);
  }

  return new Map([...grouped].map(([questId, list]) => [questId, build(list)]));
}

export async function getQuestCadence(questId: string, now = new Date()): Promise<QuestCadence> {
  const map = await getQuestCadences([questId], now);
  return map.get(questId) ?? EMPTY_CADENCE;
}

/**
 * Quest ids that have ever run as a weekly or a monthly.
 *
 * The list pages filter on this, and doing it as a set of ids rather than a
 * relational `some` keeps the filter identical to what the tags then show:
 * one definition of "has been a weekly", not a `where` clause that disagrees
 * with the badge next to it.
 */
export async function questIdsWithCadence(
  period: SchedulePeriod | "ANY",
  now = new Date(),
): Promise<string[]> {
  const rows = await db.questSchedule.findMany({
    where: {
      openAt: { lte: now },
      ...(period === "ANY" ? {} : { period }),
    },
    select: { questId: true },
    distinct: ["questId"],
  });
  return rows.map((row) => row.questId);
}
