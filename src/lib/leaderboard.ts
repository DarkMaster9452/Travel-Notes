import "server-only";

import type { Difficulty, Medal, SchedulePeriod } from "@prisma/client";

import {
  slotDatesLabel,
  slotFor,
  slotFromKey,
  slotLabel,
  slotState,
  type Slot,
} from "@/lib/admin/schedule";
import { db } from "@/lib/db";

/**
 * The weekly and monthly leaderboards.
 *
 * One board per slot, on exactly the cadence the rest of the product runs on:
 * a weekly board opens Monday at 06:00 and closes when the next one opens, a
 * monthly board runs the calendar month. Nothing new is invented about time
 * here — the slots come from `lib/admin/schedule`, so a board and the quest
 * booked into the same slot always agree about which week they are in.
 *
 * What counts is *approved* proof. A submission still in review is worth
 * nothing, because the whole product's position is that nothing counts until
 * somebody has read it, and a board that ranked unread claims would be the
 * one place that disagreed.
 *
 * A board is derived while its slot is open and sealed once it closes. The
 * derivation is deliberately re-runnable and the seal deliberately is not:
 * see `LeaderboardAward` in the schema for why a podium cannot be arithmetic.
 */

/* -------------------------------------------------------------------------- */
/* Scoring                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * What a grade is worth before the route is counted.
 *
 * The gaps widen deliberately. An expert quest is not five easy ones' worth of
 * effort and it should not be five easy ones' worth of points, but it has to
 * be worth clearly more than one — otherwise the board is won by whoever
 * filed the most short walks, which is the opposite of what the product asks
 * people to do.
 */
const GRADE_POINTS: Record<Difficulty, number> = {
  EASY: 10,
  MODERATE: 20,
  HARD: 35,
  EXPERT: 55,
};

/** A kilometre is a point; a hundred metres of ascent is a point. */
const POINTS_PER_KM = 1;
const METRES_PER_POINT = 100;

/**
 * Doing the featured quest is worth more than doing an equivalent quest of
 * your own choosing, and the monthly is worth more than the weekly. Without
 * this the shared quest is just another row on the board, and the two pages
 * the product is built around stop mattering to it.
 */
export const FEATURED_BONUS: Record<SchedulePeriod, number> = {
  WEEKLY: 25,
  MONTHLY: 60,
};

/**
 * An honest retreat scores half.
 *
 * It is approved rather than failed — turning back is the judgement the
 * safety copy asks for, and a board that scored it zero would be quietly
 * pricing that judgement at "don't". Half says the day counted without
 * pretending the quest was finished.
 */
const RETREAT_MULTIPLIER = 0.5;

export type ScoredEntry = {
  difficulty: Difficulty;
  distance: number;
  elevationGain: number;
  retreated: boolean;
  /** The cadence this was filed against, if it was filed against one. */
  featuredPeriod: SchedulePeriod | null;
};

/** What one approved submission is worth. Pure, so the copy can explain it. */
export function scoreEntry(entry: ScoredEntry): number {
  const base =
    GRADE_POINTS[entry.difficulty] +
    Math.round(entry.distance * POINTS_PER_KM) +
    Math.round(entry.elevationGain / METRES_PER_POINT) +
    (entry.featuredPeriod ? FEATURED_BONUS[entry.featuredPeriod] : 0);

  return Math.max(1, Math.round(entry.retreated ? base * RETREAT_MULTIPLIER : base));
}

/** The scoring rules, in the words the leaderboard page prints. */
export const SCORING_NOTES: readonly string[] = [
  "Easy 10 · Moderate 20 · Hard 35 · Expert 55, for the grade.",
  "One point a kilometre, one for every hundred metres of ascent.",
  `The weekly quest carries +${FEATURED_BONUS.WEEKLY}, the monthly +${FEATURED_BONUS.MONTHLY}.`,
  "An honest retreat scores half. Proof still in review scores nothing.",
];

/* -------------------------------------------------------------------------- */
/* Boards                                                                      */
/* -------------------------------------------------------------------------- */

export const MEDALS: readonly Medal[] = ["GOLD", "SILVER", "BRONZE"];

/** How far down the board a medal reaches. */
export const PODIUM = MEDALS.length;

export type LeaderboardRow = {
  userId: string;
  /** The display name, and nothing else about the account. */
  username: string;
  rank: number;
  score: number;
  quests: number;
  /** True when the featured quest of this slot is among them. */
  tookFeatured: boolean;
  medal: Medal | null;
};

export type Leaderboard = {
  period: SchedulePeriod;
  slotKey: string;
  /** "Week 34" / "September 2026". */
  label: string;
  /** "17–23 Aug 2026". */
  dates: string;
  openAt: Date;
  closeAt: Date;
  state: "past" | "live" | "future";
  rows: LeaderboardRow[];
  /** True once the podium has been written down and can no longer move. */
  sealed: boolean;
};

/** The slot a key names, or the current one when the key is unusable. */
export function resolveSlot(period: SchedulePeriod, slotKey?: string, now = new Date()): Slot {
  const named = slotKey ? slotFromKey(period, slotKey) : null;
  return named ?? slotFor(period, now);
}

/**
 * The boards worth offering in a picker: this slot and the ones behind it.
 *
 * Nothing ahead — a board for next month has no rows and no meaning, and
 * offering it would only invite the question of why it is empty.
 */
export function pastSlots(period: SchedulePeriod, count = 8, now = new Date()): Slot[] {
  const slots: Slot[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const cursor = new Date(now);
    if (period === "WEEKLY") cursor.setDate(cursor.getDate() - offset * 7);
    else cursor.setMonth(cursor.getMonth() - offset, 1);
    slots.push(slotFor(period, cursor));
  }
  return slots;
}

const RANKED_MEDAL = (rank: number): Medal | null => MEDALS[rank - 1] ?? null;

/**
 * Build one board.
 *
 * Everything approved and *done* inside the window counts, not only the
 * featured quest: a board with one row per person who happened to take the
 * same walk is a completion list, not a leaderboard. The featured quest is
 * what carries the bonus.
 *
 * "Done inside the window" reads `startedAt` where the submission has one and
 * falls back to when it was filed. The day someone went is the day that
 * should count; the day a reviewer got to it is not their doing.
 */
export async function getLeaderboard(
  period: SchedulePeriod,
  slotKey?: string,
  now = new Date(),
): Promise<Leaderboard> {
  const slot = resolveSlot(period, slotKey, now);
  const state = slotState(slot, now);

  const [submissions, awards] = await Promise.all([
    db.submission.findMany({
      where: {
        status: "APPROVED",
        user: { role: "USER" },
        OR: [
          { startedAt: { gte: slot.openAt, lt: slot.closeAt } },
          { startedAt: null, createdAt: { gte: slot.openAt, lt: slot.closeAt } },
        ],
      },
      select: {
        userId: true,
        retreated: true,
        period: true,
        slotKey: true,
        startedAt: true,
        createdAt: true,
        user: { select: { name: true } },
        quest: { select: { difficulty: true, distance: true, elevationGain: true } },
      },
    }),
    db.leaderboardAward.findMany({
      where: { period, slotKey: slot.key },
      select: {
        userId: true,
        rank: true,
        medal: true,
        score: true,
        quests: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const tally = new Map<
    string,
    { username: string; score: number; quests: number; tookFeatured: boolean; last: number }
  >();

  for (const submission of submissions) {
    // The quest's own figures are the ones scored, not the watch's: two people
    // who walked the same route score the same for it, and nobody is rewarded
    // for typing a bigger number into the form.
    //
    // The bonus follows the cadence the proof was filed against, whichever
    // board is being read. A monthly done in week 34 carries the monthly
    // bonus onto week 34's board too — it was the harder day either way.
    const points = scoreEntry({
      difficulty: submission.quest.difficulty,
      distance: submission.quest.distance,
      elevationGain: submission.quest.elevationGain,
      retreated: submission.retreated,
      featuredPeriod: submission.period,
    });

    const entry = tally.get(submission.userId) ?? {
      username: submission.user.name,
      score: 0,
      quests: 0,
      tookFeatured: false,
      last: 0,
    };
    entry.score += points;
    entry.quests += 1;
    entry.tookFeatured ||= submission.slotKey === slot.key && submission.period === period;
    entry.last = Math.max(
      entry.last,
      (submission.startedAt ?? submission.createdAt).getTime(),
    );
    tally.set(submission.userId, entry);
  }

  const byRank = [...tally.entries()].sort((a, b) => {
    if (b[1].score !== a[1].score) return b[1].score - a[1].score;
    if (b[1].quests !== a[1].quests) return b[1].quests - a[1].quests;
    // Level on both: whoever got there first holds the higher place.
    return a[1].last - b[1].last;
  });

  const sealedByUser = new Map(awards.map((award) => [award.userId, award]));
  const sealed = awards.length > 0;

  // A sealed board keeps the podium it was sealed with, whatever the
  // arithmetic says now — that is the whole point of sealing it. Everyone
  // else falls in behind the podium in score order, so a late approval can
  // move you up the board without displacing somebody's medal.
  let below = PODIUM;
  const rows: LeaderboardRow[] = byRank.map(([userId, entry], index) => {
    const award = sealedByUser.get(userId);
    return {
      userId,
      username: entry.username,
      rank: award ? award.rank : sealed ? (below += 1) : index + 1,
      score: entry.score,
      quests: entry.quests,
      tookFeatured: entry.tookFeatured,
      medal: award?.medal ?? (sealed ? null : RANKED_MEDAL(index + 1)),
    };
  });

  // A medallist whose evidence has since been withdrawn still holds the
  // medal, so the board still shows them — with the score it was sealed at,
  // which is the only score that finish ever had.
  for (const award of awards) {
    if (tally.has(award.userId)) continue;
    rows.push({
      userId: award.userId,
      username: award.user.name,
      rank: award.rank,
      score: award.score,
      quests: award.quests,
      tookFeatured: false,
      medal: award.medal,
    });
  }

  rows.sort((a, b) => a.rank - b.rank || b.score - a.score);

  return {
    period,
    slotKey: slot.key,
    label: slotLabel(slot),
    dates: slotDatesLabel(slot),
    openAt: slot.openAt,
    closeAt: slot.closeAt,
    state,
    rows,
    sealed,
  };
}

/* -------------------------------------------------------------------------- */
/* Sealing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Write down the top three of a closed slot.
 *
 * Refuses an open one: a podium sealed on Wednesday would be handing out a
 * gold sticker to whoever happened to be ahead mid-week. Idempotent by way of
 * the unique index — sealing a board twice writes nothing, which is what lets
 * the leaderboard page call it on sight rather than needing somebody to
 * remember to press a button.
 */
export async function sealLeaderboard(
  period: SchedulePeriod,
  slotKey: string,
  now = new Date(),
): Promise<{ sealed: number }> {
  const slot = slotFromKey(period, slotKey);
  if (!slot || slotState(slot, now) !== "past") return { sealed: 0 };

  const existing = await db.leaderboardAward.count({ where: { period, slotKey } });
  if (existing > 0) return { sealed: 0 };

  const board = await getLeaderboard(period, slotKey, now);
  const podium = board.rows.slice(0, PODIUM);
  if (podium.length === 0) return { sealed: 0 };

  const { count } = await db.leaderboardAward.createMany({
    data: podium.map((row, index) => ({
      userId: row.userId,
      period,
      slotKey,
      rank: index + 1,
      medal: MEDALS[index]!,
      score: row.score,
      quests: row.quests,
    })),
    skipDuplicates: true,
  });

  return { sealed: count };
}

/**
 * Seal everything behind the current slot that is not sealed yet.
 *
 * Bounded to the recent past on purpose: this runs on a page view, and
 * walking every week since launch to re-confirm boards that were sealed
 * months ago would make one reader pay for the whole archive. Which of those
 * are already done is one query rather than one per slot, so the usual case —
 * nothing to do — costs a single read.
 */
export async function sealRecentLeaderboards(count = 4, now = new Date()): Promise<number> {
  const slots = [
    ...pastSlots("WEEKLY", count + 1, now),
    ...pastSlots("MONTHLY", count + 1, now),
  ].filter((slot) => slotState(slot, now) === "past");
  if (slots.length === 0) return 0;

  const done = await db.leaderboardAward.findMany({
    where: { slotKey: { in: slots.map((slot) => slot.key) } },
    select: { period: true, slotKey: true },
    distinct: ["period", "slotKey"],
  });
  const sealedKeys = new Set(done.map((row) => `${row.period}:${row.slotKey}`));

  let sealed = 0;
  for (const slot of slots) {
    if (sealedKeys.has(`${slot.period}:${slot.key}`)) continue;
    const result = await sealLeaderboard(slot.period, slot.key, now);
    sealed += result.sealed;
  }
  return sealed;
}

/* -------------------------------------------------------------------------- */
/* Awards                                                                      */
/* -------------------------------------------------------------------------- */

export type HeldAward = {
  id: string;
  period: SchedulePeriod;
  slotKey: string;
  label: string;
  rank: number;
  medal: Medal;
  score: number;
  quests: number;
  awardedAt: Date;
  /** Key into `STICKER_ARTWORK` — a different design per cadence and metal. */
  sticker: string;
};

/**
 * The sticker a finish earns.
 *
 * Six designs, not three: a weekly gold and a monthly gold are different
 * stickers, because they are different achievements and the sheet would be
 * lying if the same disc could mean either.
 */
export function medalSticker(period: SchedulePeriod, medal: Medal): string {
  return `${period === "WEEKLY" ? "weekly" : "monthly"}-${medal.toLowerCase()}`;
}

export function medalLabel(medal: Medal): string {
  return medal === "GOLD" ? "Gold" : medal === "SILVER" ? "Silver" : "Bronze";
}

/** Every podium finish an account holds, newest first. */
export async function getHeldAwards(userId: string): Promise<HeldAward[]> {
  const awards = await db.leaderboardAward.findMany({
    where: { userId },
    orderBy: { awardedAt: "desc" },
  });

  return awards.map((award) => {
    const slot = slotFromKey(award.period, award.slotKey);
    return {
      id: award.id,
      period: award.period,
      slotKey: award.slotKey,
      label: slot ? slotLabel(slot) : award.slotKey,
      rank: award.rank,
      medal: award.medal,
      score: award.score,
      quests: award.quests,
      awardedAt: award.awardedAt,
      sticker: medalSticker(award.period, award.medal),
    };
  });
}

/** Podium counts for one account, for the header line on the stickers page. */
export async function countAwards(userId: string): Promise<Record<Medal, number>> {
  const grouped = await db.leaderboardAward.groupBy({
    by: ["medal"],
    where: { userId },
    _count: { _all: true },
  });

  const counts: Record<Medal, number> = { GOLD: 0, SILVER: 0, BRONZE: 0 };
  for (const row of grouped) counts[row.medal] = row._count._all;
  return counts;
}
