import type { SchedulePeriod } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { StatGrid } from "@/components/admin/stat-grid";
import { LeaderboardBoard } from "@/components/app/leaderboard-board";
import { Reveal } from "@/components/app/motion";
import { Eyebrow } from "@/components/field";
import { slotLabel, slotState } from "@/lib/admin/schedule";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getLeaderboard, pastSlots, sealRecentLeaderboards } from "@/lib/leaderboard";
import { stagger } from "@/lib/motion";

export const metadata: Metadata = { title: "Leaderboards · Admin" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "MONTHLY", label: "Monthly" },
  { key: "WEEKLY", label: "Weekly" },
] as const;

/**
 * The boards, from the other side of the desk.
 *
 * The same component the customers see, deliberately — a panel that rendered
 * its own version of the ranking would eventually disagree with theirs, and
 * the one question worth asking here is "what are they looking at". What the
 * panel adds is the count of proof still unread, because a board with a queue
 * behind it is provisional and the reviewer is the reason.
 */
export default async function AdminLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; slot?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const period: SchedulePeriod = params.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  await sealRecentLeaderboards();

  const board = await getLeaderboard(period, params.slot);
  const slots = pastSlots(period, 8).map((slot) => ({
    key: slot.key,
    label: slotLabel(slot),
    state: slotState(slot),
  }));

  const [waiting, medals] = await Promise.all([
    db.submission.count({
      where: {
        status: "PENDING",
        OR: [
          { startedAt: { gte: board.openAt, lt: board.closeAt } },
          { startedAt: null, createdAt: { gte: board.openAt, lt: board.closeAt } },
        ],
      },
    }),
    db.leaderboardAward.count(),
  ]);

  const top = board.rows[0];

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Who is winning</Eyebrow>
          <h1>Leaderboards.</h1>
          <p>
            Exactly what the members see. A closed board is sealed the first time anybody opens
            it, and the podium stops moving from then on.
          </p>
        </div>
        <div className="admin-filters !border-0 !p-0">
          <nav aria-label="Cadence">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/admin/leaderboard?period=${tab.key}`}
                aria-current={tab.key === period ? "page" : undefined}
                scroll={false}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </Reveal>

      <Reveal delay={stagger(0)} className="mb-5">
        <StatGrid
          items={[
            { label: "On the board", value: board.rows.length, foot: board.label },
            {
              label: "Leader",
              value: 0,
              display: top ? String(top.score) : "—",
              foot: top ? top.username : "Nothing scored yet",
            },
            {
              label: "Unread in this window",
              value: waiting,
              foot: waiting > 0 ? "The board is provisional" : "Nothing waiting",
            },
            { label: "Medals handed out", value: medals, foot: "All time" },
          ]}
        />
      </Reveal>

      <LeaderboardBoard
        board={board}
        slots={slots}
        hrefFor={(boardPeriod, slotKey) =>
          `/admin/leaderboard?period=${boardPeriod}&slot=${slotKey}`
        }
      />
    </>
  );
}
