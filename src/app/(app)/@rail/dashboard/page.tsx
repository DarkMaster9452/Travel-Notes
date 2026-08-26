import Link from "next/link";

import { SqCountdown } from "@/components/sq/countdown";
import { RailBar, RailCard, RailFigure, RailLine } from "@/components/sq/rail";
import { SqSticker } from "@/components/sq/sticker";
import { getAchievements } from "@/lib/achievements";
import { slotFor } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { formatDate, formatNumber, plural } from "@/lib/i18n/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { getLeaderboard } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/quest/service";

export const dynamic = "force-dynamic";


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

  const [board, stats, entitlement, revocations, pending, t, locale] = await Promise.all([
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
    getT(user.id),
    getLocale(user.id),
  ]);

  const achievements = getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
    t,
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
        title={t.rail.nextDrop}
        tone="dark"
        index={0}
        foot={
          <>
            <span>{t.rail.thenMonthly}</span>
            <span>{formatDate(locale, nextMonthly.openAt, "dayMonth")}</span>
          </>
        }
      >
        <RailFigure
          value={<SqCountdown to={nextWeekly.openAt.toISOString()} closedLabel={t.rail.openNow} />}
          note={t.rail.untilWeekly(formatDate(locale, nextWeekly.openAt, "dayMonth"))}
        />
      </RailCard>

      <RailCard
        title={t.rail.standing}
        meta={board.label}
        index={1}
        foot={
          <>
            <span>{t.rail.fullBoard}</span>
            <Link href="/leaderboard" style={{ color: "inherit" }}>
              {t.rail.open}
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
                  {t.rail.behind(above.score - myRow.score, above.username)}{" "}
                  {t.rail.youAreOn(myRow.score, plural(locale, myRow.quests, t.common.quests))}
                </>
              ) : (
                t.rail.topOfBoard(myRow.score)
              )
            }
          />
        ) : (
          <div className="sq-rail-body">
            <p className="sq-rail-note">{t.rail.notOnBoard}</p>
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
              {formatNumber(locale, row.score)}
            </b>
          </div>
        ))}
      </RailCard>

      <RailCard
        title={t.rail.desk}
        meta={pending.length > 0 ? String(pending.length) : undefined}
        index={2}
      >
        {pending.length === 0 ? (
          <div className="sq-rail-body">
            <p className="sq-rail-note">{t.rail.deskEmpty}</p>
          </div>
        ) : (
          pending.map((submission) => (
            <RailLine
              key={submission.id}
              label={submission.quest.title}
              value={
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {formatDate(locale, submission.createdAt)}
                </span>
              }
            />
          ))
        )}
      </RailCard>

      {closest ? (
        <RailCard
          title={t.rail.closest}
          index={3}
          foot={
            <>
              <span>{t.rail.wholeSheet}</span>
              <Link href="/stickers" style={{ color: "inherit" }}>
                {t.rail.open}
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

      <RailCard title={t.rail.logbook} meta={t.rail.allTime} index={4}>
        <RailLine label={t.rail.questsLogged} value={formatNumber(locale, stats.completedCount)} />
        <RailLine label={t.rail.kilometres} value={formatNumber(locale, stats.kmExplored)} />
        <RailLine label={t.rail.metresClimbed} value={formatNumber(locale, stats.elevation)} />
        <RailLine
          label={t.rail.regions}
          value={`${stats.regions}${
            stats.countries > 1 ? ` · ${t.rail.countries(stats.countries)}` : ""
          }`}
        />
      </RailCard>
    </>
  );
}
