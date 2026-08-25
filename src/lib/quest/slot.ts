import "server-only";

import { db } from "@/lib/db";
import {
  getFeaturedQuest,
  materialiseFeatured,
  periodEnds,
  type FeaturedPeriod,
  type FeaturedQuest,
} from "@/lib/quest/featured";

/**
 * Where a member's proof for this slot stands.
 *
 * Declared here rather than beside a component, because it is a fact about the
 * data and not about any one screen: the dashboard card, the monthly page and
 * the proof form all read the same four states.
 */
export type FeaturedProof = {
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  filedAt: Date | null;
};

/** What somebody would otherwise retype into every proof form. */
export type LogDefaults = {
  stravaProfile: string | null;
  usualStart: string | null;
  partySize: number | null;
  gear: string | null;
  pace: number | null;
  lastDistance: number | null;
  lastElevation: number | null;
  lastMovingTime: number | null;
};

/**
 * Everything the weekly or monthly page needs, in one call.
 *
 * The two pages differ by a heading and a period, so the reading lives here
 * rather than being written out twice and drifting.
 *
 * Opening the page is what makes the slot real. Until somebody looks, a
 * generated weekly is a seed and nothing else; the moment they do, it becomes
 * a quest row they hold, because proof has to point at something. That happens
 * here rather than in a background job so a period nobody opens costs nothing
 * — and it is idempotent, so opening the page twice does not issue it twice.
 */
export type FeaturedSlot = {
  featured: FeaturedQuest | null;
  questId: string | null;
  closesAt: Date;
  /** Decided here, against the same `now` everything else on the page used.
   *  Asking the clock during render is impure, and would let the header and
   *  the panel below it disagree about whether the window is still open. */
  closed: boolean;
  proof: FeaturedProof;
  defaults: LogDefaults | null;
};

export async function loadFeaturedSlot(
  userId: string,
  period: FeaturedPeriod,
  now = new Date(),
): Promise<FeaturedSlot> {
  const featured = await getFeaturedQuest(userId, period, now);
  const closesAt = periodEnds(period, now);
  const closed = closesAt.getTime() <= now.getTime();

  if (!featured) {
    return {
      featured: null,
      questId: null,
      closesAt,
      closed,
      proof: { status: "NONE", reviewNote: null, filedAt: null },
      defaults: null,
    };
  }

  // A closed slot is not made real: there would be nothing to do with it, and
  // writing a quest into somebody's history the first time they look at a week
  // that already ended would be inventing a past.
  const questId = closed ? null : await materialiseFeatured(userId, featured);

  const [submission, defaults] = await Promise.all([
    questId
      ? db.submission.findUnique({
          where: { userId_questId: { userId, questId } },
          select: { status: true, reviewNote: true, createdAt: true },
        })
      : null,
    db.userLogDefaults.findUnique({
      where: { userId },
      select: {
        stravaProfile: true,
        usualStart: true,
        partySize: true,
        gear: true,
        pace: true,
        lastDistance: true,
        lastElevation: true,
        lastMovingTime: true,
      },
    }),
  ]);

  return {
    featured,
    questId,
    closesAt,
    closed,
    proof: {
      status: submission?.status ?? "NONE",
      reviewNote: submission?.reviewNote ?? null,
      filedAt: submission?.createdAt ?? null,
    },
    defaults,
  };
}

/**
 * The same slot, read without making it real.
 *
 * `loadFeaturedSlot` materialises on sight, which is right on the weekly and
 * monthly pages — opening one *is* taking it. It is wrong on the dashboard:
 * glancing at a summary card is not accepting a quest, and a dashboard that
 * wrote two quest rows into somebody's history every time they looked at it
 * would be issuing quests nobody asked for.
 *
 * So this reads only. Proof status is looked up by the marker the quest would
 * have been written under, which costs one indexed read and stays null for an
 * account that has never logged this slot.
 */
export type FeaturedGlance = {
  featured: FeaturedQuest | null;
  closesAt: Date;
  closed: boolean;
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
};

export async function glanceFeaturedSlot(
  userId: string,
  period: FeaturedPeriod,
  now = new Date(),
): Promise<FeaturedGlance> {
  const featured = await getFeaturedQuest(userId, period, now);
  const closesAt = periodEnds(period, now);
  const closed = closesAt.getTime() <= now.getTime();

  if (!featured) return { featured: null, closesAt, closed, status: "NONE" };

  // A booked slot is already a quest row shared by everybody; a generated one
  // exists only once this account has logged it, and is found by its marker.
  const submission = featured.scheduled
    ? await db.submission.findUnique({
        where: { userId_questId: { userId, questId: featured.summary.id } },
        select: { status: true },
      })
    : await db.submission.findFirst({
        where: {
          userId,
          quest: {
            routeData: {
              path: ["featuredKey"],
              equals: `${featured.period}:${featured.key}:${userId}`,
            },
          },
        },
        select: { status: true },
      });

  return { featured, closesAt, closed, status: submission?.status ?? "NONE" };
}
