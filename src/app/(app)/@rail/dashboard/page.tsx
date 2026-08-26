import Link from "next/link";

import { SqCountdown } from "@/components/sq/countdown";
import { RailBar, RailCard, RailFigure, RailLine } from "@/components/sq/rail";
import { SqSticker } from "@/components/sq/sticker";
import { getAchievements } from "@/lib/achievements";
import { slotFor } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getLeaderboard } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/quest/service";

export const dynamic = "force-dynamic";

const NUMBER = new Intl.NumberFormat("en-GB");
const FILED = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const OPENS = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

/**
 * The column beside the dashboard.
 *
 * The dashboard answers "what is open"; this answers the four questions that
 * follow it and that were otherwise costing a page load each — when the next
 * one lands, where that has left you on the board, whether anything of yours
 * is still sitting on a reader's desk, and which sticker is closest.
 *
 * Nothing here is decoration. A column of ornament would fill the window and
 * still leave the screen empty, so every card is a figure somebody would
 * otherwise have gone looking for, and a card with nothing to say says the
 * quiet true thing rather than being padded out.
 */
export default async function DashboardRail() {
  const user = await requireClient();
  const now = new Date();

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);

  const nextWeekly = slotFor("WEEKLY", nextWeek);
  const nextMonthly = slotFor("MONTHLY", nextMonth);

  const [board, stats, entitlement, revocations, pending] = await Promise.all([
    getLeaderboard("MONTHLY", undefined, now),
    getUserStats(user.id),
    getEntitlement(user.id),
    db.achievementRevocation.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    }),
    db.submission.findMany({
      where: { userId: user.id, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 3,
      select: { id: true, createdAt: true, quest: { select: { title: true } } },
    }),
  ]);

  const achievements = getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
  );

  const myIndex = board.rows.findIndex((row) => row.userId === user.id);
  const myRow = myIndex === -1 ? null : board.rows[myIndex];
  const above = myIndex > 0 ? board.rows[myIndex - 1] : null;
  // Three rows is the whole of a board anybody reads: the one you are chasing,
  // yours, and the one chasing you.
  const fragment =
    myIndex === -1
      ? board.rows.slice(0, 3)
      : board.rows.slice(Math.max(0, myIndex - 1), Math.max(0, myIndex - 1) + 3);

  // The closest sticker is the nearest one the work could actually reach —
  // a plan-locked sticker is not close, however far along its stat is, and
  // pointing at one would be selling rather than telling.
  const closest = achievements
    .filter((entry) => !entry.earned && !entry.planLocked && !entry.revoked)
    .sort((a, b) => b.progress - a.progress)[0];

  return (
    <>
      <RailCard
        title="The next drop"
        tone="dark"
        index={0}
        foot={
          <>
            <span>Then the monthly</span>
            <span>{OPENS.format(nextMonthly.openAt)}</span>
          </>
        }
      >
        <RailFigure
          value={<SqCountdown to={nextWeekly.openAt.toISOString()} closedLabel="Open now" />}
          note={
            <>
              until the next weekly opens, {OPENS.format(nextWeekly.openAt)} at 06:00. Whatever is
              open now stays open until its own window closes.
            </>
          }
        />
      </RailCard>

      <RailCard
        title="Where you stand"
        meta={board.label}
        index={1}
        foot={
          <>
            <span>Full board</span>
            <Link href="/leaderboard" style={{ color: "inherit" }}>
              Open →
            </Link>
          </>
        }
      >
        {myRow ? (
          <RailFigure
            value={`#${myRow.rank}`}
            note={
              above ? (
                <>
                  {NUMBER.format(above.score - myRow.score)} points behind {above.username}. You are
                  on {NUMBER.format(myRow.score)} from {myRow.quests}{" "}
                  {myRow.quests === 1 ? "quest" : "quests"}.
                </>
              ) : (
                <>
                  Top of the board on {NUMBER.format(myRow.score)} points. There is a month left to
                  hold it.
                </>
              )
            }
          />
        ) : (
          <div className="sq-rail-body">
            <p className="sq-rail-note">
              Not on the board this month. Approved proof is what puts you on it — one logged quest
              is enough.
            </p>
          </div>
        )}

        {fragment.map((row) => (
          <div
            key={row.userId}
            className="sq-rail-standing"
            data-me={row.userId === user.id ? "1" : "0"}
          >
            <span className="sq-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {row.rank}
            </span>
            <span
              style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {row.username}
            </span>
            <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14 }}>
              {NUMBER.format(row.score)}
            </b>
          </div>
        ))}
      </RailCard>

      <RailCard
        title="On a reader's desk"
        meta={pending.length > 0 ? String(pending.length) : undefined}
        index={2}
      >
        {pending.length === 0 ? (
          <div className="sq-rail-body">
            <p className="sq-rail-note">
              Nothing waiting on a reader. Proof is usually read within a day of being filed.
            </p>
          </div>
        ) : (
          pending.map((submission) => (
            <RailLine
              key={submission.id}
              label={submission.quest.title}
              value={
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {FILED.format(submission.createdAt)}
                </span>
              }
            />
          ))
        )}
      </RailCard>

      {closest ? (
        <RailCard
          title="Closest sticker"
          index={3}
          foot={
            <>
              <span>The whole sheet</span>
              <Link href="/stickers" style={{ color: "inherit" }}>
                Open →
              </Link>
            </>
          }
        >
          <div className="sq-rail-body" style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
            <SqSticker sticker={closest.sticker} earned={false} size={46} title={closest.label} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <b style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15 }}>
                {closest.label}
              </b>
              <p className="sq-rail-note" style={{ marginTop: 4 }}>
                {closest.description}
              </p>
              <RailBar pct={closest.progress * 100} />
              <span
                className="sq-mono"
                style={{ display: "block", marginTop: 7, fontSize: 10, color: "var(--ink-3)" }}
              >
                {closest.progressLabel}
              </span>
            </div>
          </div>
        </RailCard>
      ) : null}

      <RailCard title="The logbook" meta="All time" index={4}>
        <RailLine label="Quests logged" value={NUMBER.format(stats.completedCount)} />
        <RailLine label="Kilometres" value={NUMBER.format(stats.kmExplored)} />
        <RailLine label="Metres climbed" value={NUMBER.format(stats.elevation)} />
        <RailLine
          label="Regions"
          value={`${stats.regions}${stats.countries > 1 ? ` · ${stats.countries} countries` : ""}`}
        />
      </RailCard>
    </>
  );
}
