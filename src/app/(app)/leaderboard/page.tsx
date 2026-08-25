import type { SchedulePeriod } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { LeaderboardBoard } from "@/components/app/leaderboard-board";
import { Reveal } from "@/components/app/motion";
import { StandingCard, type Standing } from "@/components/app/standing-card";
import { Eyebrow } from "@/components/field";
import { slotLabel, slotState } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getHeldAwards, getLeaderboard, pastSlots, sealRecentLeaderboards } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/quest/service";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "MONTHLY", label: "Monthly" },
  { key: "WEEKLY", label: "Weekly" },
] as const;

/**
 * The weekly and monthly boards.
 *
 * Monthly first, for the same reason it leads the dashboard and the schedule:
 * it is the headline quest and the weekly is the thing alongside it.
 *
 * Your own standing is the header rather than a panel somewhere below it —
 * "where am I" is the question people come here with, and a board that makes
 * you hunt for yourself is a scoreboard rather than a standing.
 *
 * Closed boards are sealed on the way in. There is no cron in this product and
 * inventing one for three rows would be a lot of machinery to make a sticker
 * appear on time; sealing is idempotent and costs a count query on a board
 * that already has one, so the first person to look at a closed week is what
 * hands out its medals.
 */
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; slot?: string }>;
}) {
  const user = await requireClient();
  const params = await searchParams;

  const period: SchedulePeriod = params.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  await sealRecentLeaderboards();

  const [board, awards, stats, profile] = await Promise.all([
    getLeaderboard(period, params.slot),
    getHeldAwards(user.id),
    getUserStats(user.id),
    db.profile.findUnique({
      where: { userId: user.id },
      select: { handle: true, published: true },
    }),
  ]);

  const slots = pastSlots(period, 8).map((slot) => ({
    key: slot.key,
    label: slotLabel(slot),
    state: slotState(slot),
  }));

  const standing: Standing = {
    name: user.name,
    handle: profile?.published ? profile.handle : null,
    hidden: Boolean(profile && !profile.published),
    row: board.rows.find((row) => row.userId === user.id) ?? null,
    period: board.period,
    label: board.label,
    live: board.state === "live",
    medals: awards.map((award) => ({
      id: award.id,
      medal: award.medal,
      sticker: award.sticker,
      label: award.label,
    })),
    lifetime: {
      logged: stats.completedCount,
      km: Math.round(stats.kmExplored),
      up: Math.round(stats.elevation),
    },
  };

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Everybody, ranked</Eyebrow>
          <h1>Leaderboard.</h1>
          <p>Points for approved quests. The top three of a closed board take a sticker.</p>
        </div>
        <div className="admin-filters !border-0 !p-0">
          <nav aria-label="Cadence">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/leaderboard?period=${tab.key}`}
                aria-current={tab.key === period ? "page" : undefined}
                scroll={false}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </Reveal>

      <StandingCard standing={standing} />

      <LeaderboardBoard
        board={board}
        viewerId={user.id}
        slots={slots}
        hrefFor={(boardPeriod, slotKey) => `/leaderboard?period=${boardPeriod}&slot=${slotKey}`}
      />

      <Reveal className="mt-5">
        <p className="note text-center">
          Only approved proof scores. Filed today, read tomorrow —{" "}
          <Link href="/submissions" className="underline">
            your submissions
          </Link>{" "}
          say where yours has got to.
        </p>
      </Reveal>
    </>
  );
}
