import type { Metadata } from "next";

import { ReviewDeck, type ReviewCard } from "@/components/admin/review-deck";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, Tag } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { initialsFrom } from "@/components/field";

export const metadata: Metadata = { title: "Review · Admin" };
export const dynamic = "force-dynamic";

/** Higher-tier subscribers are reviewed first. No subscription sorts last. */
const PLAN_RANK: Record<string, number> = { ULTRA: 0, EXPLORER: 1, FREE: 2 };

/**
 * The review queue.
 *
 * Ultra subscribers first, then Explorer, then free accounts — the paying
 * customers who are waiting on a verdict wait least. Inside each tier, oldest
 * first: somebody who filed proof on Monday should not sit behind Friday's
 * within the same tier.
 */
export default async function ReviewPage() {
  await requireAdmin();

  const pending = await db.submission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      user: {
        select: { name: true, subscription: { select: { plan: true, status: true } } },
      },
      quest: {
        select: {
          title: true,
          location: true,
          region: true,
          difficulty: true,
          number: true,
          distance: true,
          elevationGain: true,
          duration: true,
        },
      },
    },
  });

  const LIVE = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);
  const planOf = (s: (typeof pending)[number]): "ULTRA" | "EXPLORER" | "FREE" => {
    const sub = s.user.subscription;
    if (sub && LIVE.has(sub.status) && (sub.plan === "ULTRA" || sub.plan === "EXPLORER")) {
      return sub.plan;
    }
    return "FREE";
  };

  const ordered = [...pending].sort((a, b) => {
    const rankDiff = PLAN_RANK[planOf(a)] - PLAN_RANK[planOf(b)];
    if (rankDiff !== 0) return rankDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const cards: ReviewCard[] = ordered.map((s) => ({
    id: s.id,
    note: s.note,
    photos: s.photos,
    stravaUrl: s.stravaUrl,
    retreated: s.retreated,
    createdAt: s.createdAt.toISOString(),
    actual: { distance: s.distance, elevation: s.elevation, movingTime: s.movingTime },
    target: {
      distance: s.quest.distance,
      elevation: s.quest.elevationGain,
      movingTime: s.quest.duration,
    },
    quest: {
      title: s.quest.title,
      location: s.quest.location,
      region: s.quest.region,
      difficulty: s.quest.difficulty,
      number: s.quest.number,
    },
    person: { name: s.user.name, initials: initialsFrom(s.user.name) },
    plan: planOf(s),
  }));

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Did they actually go?</Eyebrow>
          <h1>Review.</h1>
          <p>
            One at a time. Throw it right to approve, left to decline — or use the arrow keys.
            Approving is what marks the quest done.
          </p>
        </div>
        <Tag tone={cards.length > 0 ? "warm" : "ghost"}>{cards.length} pending</Tag>
      </Reveal>

      <Reveal>
        <ReviewDeck cards={cards} />
      </Reveal>
    </>
  );
}
