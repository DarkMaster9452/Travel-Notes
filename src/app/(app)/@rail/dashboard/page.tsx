import { RailBar, RailCard, RailFigure, RailLine } from "@/components/app/rail";
import { BoardList, BoardRow } from "@/components/domain/board";
import { Countdown } from "@/components/domain/countdown";
import { Sticker } from "@/components/domain/sticker";
import { ButtonLink } from "@/components/ui/button";
import { getAchievements } from "@/lib/achievements";
import { slotFor } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { formatDate, formatNumber, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { formatDistance, formatHeight } from "@/lib/i18n/units";
import { getLeaderboard } from "@/lib/leaderboard";
import { slotTitle } from "@/lib/quest/labels";
import { getUserStats } from "@/lib/quest/service";

export const dynamic = "force-dynamic";

/**
 * The column beside the dashboard.
 *
 * The dashboard answers "what is open"; this answers the questions that follow
 * it and that were otherwise costing a page load each — when the next one
 * lands, where that has left you on the board, whether anything of yours is
 * still waiting, and which sticker is closest.
 *
 * Nothing here is decoration: every card is a figure somebody would otherwise
 * have gone looking for, and a card with nothing to say says the quiet true
 * thing rather than being padded out.
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

  const [board, stats, entitlement, revocations, pending, reader] = await Promise.all([
    getLeaderboard("MONTHLY", undefined, now),
    getUserStats(user.id),
    getEntitlement(user.id),
    db.achievementRevocation.findMany({ where: { userId: user.id }, select: { achievementId: true } }),
    db.submission.findMany({
      where: { userId: user.id, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 3,
      select: { id: true, createdAt: true, quest: { select: { title: true } } },
    }),
    getReader(user.id),
  ]);
  const { t, locale, units } = reader;

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

  // The closest sticker is the nearest one the work could actually reach — a
  // plan-locked sticker is not close, however far along its stat is, and
  // pointing at one would be selling rather than telling.
  const closest = achievements
    .filter((entry) => !entry.earned && !entry.planLocked && !entry.revoked)
    .sort((a, b) => b.progress - a.progress)[0];

  const open = (href: string) => (
    <ButtonLink href={href} variant="link" className="text-caption">
      {t.rail.open}
    </ButtonLink>
  );

  return (
    <>
      <RailCard
        title={t.rail.nextDrop}
        foot={
          <span className="flex justify-between gap-3 text-muted">
            <span>{t.rail.thenMonthly}</span>
            <span>{formatDate(locale, nextMonthly.openAt, "dayMonth")}</span>
          </span>
        }
      >
        <RailFigure
          value={<Countdown to={nextWeekly.openAt.toISOString()} closedLabel={t.rail.openNow} />}
          note={t.rail.untilWeekly(formatDate(locale, nextWeekly.openAt, "dayMonth"))}
        />
      </RailCard>

      <RailCard
        title={t.rail.standing}
        meta={slotTitle(slotFor("MONTHLY", now), locale, t)}
        foot={
          <span className="flex justify-between gap-3 text-muted">
            <span>{t.rail.fullBoard}</span>
            {open("/leaderboard")}
          </span>
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
          <p className="text-body-sm text-muted">{t.rail.notOnBoard}</p>
        )}

        {fragment.length > 0 ? (
          <BoardList className="-mx-3 mt-3">
            {fragment.map((row) => (
              <BoardRow
                key={row.userId}
                rank={row.rank}
                name={row.username}
                score={formatNumber(locale, row.score)}
                me={row.userId === user.id}
              />
            ))}
          </BoardList>
        ) : null}
      </RailCard>

      <RailCard title={t.rail.desk} meta={pending.length > 0 ? String(pending.length) : undefined}>
        {pending.length === 0 ? (
          <p className="text-body-sm text-muted">{t.rail.deskEmpty}</p>
        ) : (
          pending.map((submission) => (
            <RailLine
              key={submission.id}
              label={submission.quest.title}
              value={<span className="font-normal text-subtle">{formatDate(locale, submission.createdAt)}</span>}
            />
          ))
        )}
      </RailCard>

      {closest ? (
        <RailCard
          title={t.rail.closest}
          foot={
            <span className="flex justify-between gap-3 text-muted">
              <span>{t.rail.wholeSheet}</span>
              {open("/stickers")}
            </span>
          }
        >
          <div className="flex items-start gap-3">
            <Sticker sticker={closest.sticker} state="open" size="sm" />
            <div className="min-w-0 flex-1">
              <b className="block text-body-sm font-semibold text-text">{closest.label}</b>
              <p className="mt-1 text-caption text-muted">{closest.description}</p>
              <RailBar pct={closest.progress * 100} label={t.app.dashboard.progress(closest.label)} />
              <span className="mt-2 block text-caption tabular-nums text-subtle">{closest.progressLabel}</span>
            </div>
          </div>
        </RailCard>
      ) : null}

      <RailCard title={t.rail.logbook} meta={t.rail.allTime}>
        <RailLine label={t.rail.questsLogged} value={formatNumber(locale, stats.completedCount)} />
        <RailLine label={t.rail.kilometres} value={formatDistance(locale, stats.kmExplored, units)} />
        <RailLine label={t.rail.metresClimbed} value={formatHeight(locale, stats.elevation, units)} />
        <RailLine
          label={t.rail.regions}
          value={`${stats.regions}${stats.countries > 1 ? ` · ${t.rail.countries(stats.countries)}` : ""}`}
        />
      </RailCard>
    </>
  );
}
