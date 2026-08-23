import "server-only";

import { db } from "@/lib/db";
import {
  getFeaturedQuest,
  materialiseFeatured,
  periodEnds,
  type FeaturedPeriod,
  type FeaturedQuest,
} from "@/lib/quest/featured";
import type { FeaturedProof } from "@/components/app/featured-quest-page";
import type { LogDefaults } from "@/components/app/submit-proof";

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
