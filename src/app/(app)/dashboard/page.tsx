import type { Metadata } from "next";
import { Check, Clock, Lock, Undo2 } from "lucide-react";

import { BoardList, BoardRow } from "@/components/domain/board";
import { Sticker } from "@/components/domain/sticker";
import { MonthlyEmpty, MonthlyHero, QuestCard, QuestGrid, toTrailQuest } from "@/components/domain/trail";
import { Badge, SubmissionBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader, PageStack, Section, StatCard, StatRow } from "@/components/ui/page";
import { getAchievements } from "@/lib/achievements";
import { slotFor, slotState, type Slot } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import type { Messages } from "@/lib/i18n";
import { formatDate, formatNumber, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { getLeaderboard } from "@/lib/leaderboard";
import { slotMonth, slotTitle } from "@/lib/quest/labels";
import { getUserStats } from "@/lib/quest/service";
import { glanceFeaturedSlot } from "@/lib/quest/slot";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.nav.dashboard };
}
export const dynamic = "force-dynamic";

/**
 * The dashboard (design/DESIGN-SYSTEM.md §12): the monthly quest first, then
 * this week's quest beside what is coming, then where that has put you.
 *
 * Nothing here writes — glancing at a summary is not accepting a quest, so the
 * featured slots are read without being materialised (`glanceFeaturedSlot`).
 *
 * The headline is written from what is actually outstanding rather than from
 * the time of day. "Two quests open, one clock running" is a fact about this
 * account, and a greeting would not be.
 */
export default async function DashboardPage() {
  const user = await requireClient();
  const now = new Date();

  const [monthly, weekly, board, stats, entitlement, revocations, reader] = await Promise.all([
    glanceFeaturedSlot(user.id, "month", now),
    glanceFeaturedSlot(user.id, "week", now),
    getLeaderboard("MONTHLY", undefined, now),
    getUserStats(user.id),
    getEntitlement(user.id),
    db.achievementRevocation.findMany({ where: { userId: user.id }, select: { achievementId: true } }),
    getReader(user.id),
  ]);
  const { t, locale, units } = reader;

  const achievements = getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
    t,
  );
  const earned = achievements.filter((entry) => entry.earned);
  const reachable = achievements.filter((entry) => !entry.planLocked);

  const monthSlot = slotFor("MONTHLY", now);
  const monthlyOpen = monthly.featured && !monthly.closed ? monthly.featured : null;
  const weeklyOpen = weekly.featured && !weekly.closed ? weekly.featured : null;

  const open = [monthlyOpen ? monthly : null, weeklyOpen ? weekly : null].filter((glance) => glance !== null);
  const running = open.filter((glance) => glance.status === "NONE" || glance.status === "REJECTED").length;

  const myRow = board.rows.find((row) => row.userId === user.id) ?? null;
  const nearby = neighbours(board.rows, user.id);
  const ahead = slotsAhead(now);

  return (
    <PageStack>
      <div>
        <PageHeader
          overline={`${capitalise(formatDate(locale, now, "full"))} · ${slotTitle(slotFor("WEEKLY", now), locale, t)}`}
          title={headline(open.length, running, t)}
        />

        {/* The monthly quest leads the page (§0, §6.4). */}
        {monthlyOpen ? (
          <MonthlyHero
            quest={toTrailQuest(monthlyOpen.summary, t)}
            t={t}
            locale={locale}
            units={units}
            monthLabel={slotTitle(monthSlot, locale, t)}
            closesAt={monthly.closesAt}
            lede={monthlyOpen.summary.subtitle}
            primary={{
              label: monthly.status === "REJECTED" ? t.questCard.fileAgain : t.trail.fileProof,
              href: `/quests/${monthlyOpen.summary.id}/proof`,
            }}
            secondary={{ label: t.trail.routeDetail, href: "/monthly" }}
            status={
              monthly.status === "PENDING" ? (
                <Badge tone="onFeature" size="lg" icon={Clock}>
                  {t.app.dashboard.proofWaiting}
                </Badge>
              ) : monthly.status === "APPROVED" ? (
                <Badge tone="onFeature" size="lg" icon={Check}>
                  {t.app.dashboard.proofApproved}
                </Badge>
              ) : undefined
            }
          />
        ) : (
          <MonthlyEmpty t={t} action={{ label: t.dashboard.openDatabase, href: "/quests" }} />
        )}
      </div>

      {/* Then the weekly, beside what is still sealed. */}
      <div className="grid gap-4 md:grid-cols-2 md:items-start lg:gap-6">
        <Section title={t.app.dashboard.weekly}>
          {weeklyOpen ? (
            <QuestGrid>
              <QuestCard
                quest={toTrailQuest(weeklyOpen.summary, t)}
                t={t}
                locale={locale}
                units={units}
                period="WEEKLY"
                href={`/quests/${weeklyOpen.summary.id}`}
                foot={<ProofStatus status={weekly.status} t={t} />}
              />
            </QuestGrid>
          ) : (
            <Card>
              <p className="text-body-sm text-muted">{t.app.dashboard.noWeekly}</p>
            </Card>
          )}
        </Section>

        <Section title={t.dashboard.coming} note={t.dashboard.comingNote}>
          <Card pad="none">
            <ul className="divide-y divide-border">
              {ahead.map((slot) => (
                <li key={`${slot.period}-${slot.key}`} className="flex items-center gap-3 p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-surface-sunken text-subtle">
                    <Lock className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 text-body-sm text-muted">
                    {t.app.dashboard.opens(slotTitle(slot, locale, t), formatDate(locale, slot.openAt, "opens"))}
                  </span>
                  <Badge tone={slot.period === "MONTHLY" ? "monthlySoft" : "weekly"}>
                    {slot.period === "MONTHLY" ? t.dashboard.theMonthly : t.dashboard.theWeekly}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>

      {/* Where that has put you. */}
      <StatRow>
        <StatCard
          count={myRow?.score ?? 0}
          countId="dash-points"
          label={t.dashboard.pointsLabel(slotMonth(monthSlot, locale))}
        />
        <StatCard
          value={myRow ? undefined : "—"}
          count={myRow ? myRow.rank : undefined}
          countId="dash-rank"
          prefix="#"
          label={t.dashboard.rankLabel(board.rows.length)}
        />
        <StatCard count={stats.completedCount} countId="dash-quests" label={t.rail.questsLogged} />
        <StatCard
          value={t.common.ofTotal(earned.length, reachable.length)}
          label={t.app.dashboard.stickers}
        />
      </StatRow>

      <div className="grid gap-4 md:grid-cols-2 md:items-start lg:gap-6">
        <Card>
          <CardHeader
            title={t.dashboard.board}
            action={
              <ButtonLink href="/leaderboard" variant="link">
                {t.dashboard.fullBoard}
              </ButtonLink>
            }
          />
          {nearby.length === 0 ? (
            <p className="text-body-sm text-muted">{t.dashboard.boardEmpty}</p>
          ) : (
            <BoardList>
              {nearby.map((row) => (
                <BoardRow
                  key={row.userId}
                  rank={row.rank}
                  name={row.username}
                  score={formatNumber(locale, row.score)}
                  meta={plural(locale, row.quests, t.common.quests)}
                  me={row.userId === user.id}
                  meLabel={t.app.dashboard.you}
                />
              ))}
            </BoardList>
          )}
        </Card>

        <Card>
          <CardHeader
            title={t.dashboard.sheet}
            note={t.dashboard.sheetCount(earned.length, achievements.length)}
          />
          <p className="text-body-sm text-muted">{t.dashboard.sheetNote}</p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {achievements.slice(0, 8).map((entry) => (
              <li key={entry.id}>
                <Sticker
                  sticker={entry.sticker}
                  size="sm"
                  state={entry.earned ? "earned" : entry.planLocked ? "locked" : "open"}
                  title={entry.earned ? entry.label : `${entry.label} · ${entry.progressLabel}`}
                />
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <ButtonLink href="/stickers" variant="secondary" size="sm">
              {t.dashboard.wholeSheet}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </PageStack>
  );
}

/** Where a proof stands, as a badge: icon, word and colour (§7.6). */
function ProofStatus({
  status,
  t,
}: {
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  t: Messages;
}) {
  if (status === "PENDING") return <SubmissionBadge status="PENDING">{t.questCard.waiting}</SubmissionBadge>;
  if (status === "APPROVED") return <SubmissionBadge status="APPROVED">{t.questCard.readByHuman}</SubmissionBadge>;
  if (status === "REJECTED") {
    return (
      <Badge tone="danger" icon={Undo2}>
        {t.questCard.sentBack}
      </Badge>
    );
  }
  return <span>{t.trail.notStarted}</span>;
}

/** The one sentence the page opens with, decided by what is actually running. */
function headline(open: number, running: number, t: Messages): string {
  if (open === 0) return t.dashboard.headline.nothing;
  if (open === 2 && running === 2) return t.dashboard.headline.twoRunning;
  if (open === 2 && running === 1) return t.dashboard.headline.twoOneRunning;
  if (open === 2) return t.dashboard.headline.twoFiled;
  if (running === 1) return t.dashboard.headline.oneRunning;
  return t.dashboard.headline.oneFiled;
}

/** The two above and the two below, which is the only part of a board you read. */
function neighbours<T extends { userId: string }>(rows: T[], userId: string): T[] {
  const index = rows.findIndex((row) => row.userId === userId);
  if (index === -1) return rows.slice(0, 5);
  return rows.slice(Math.max(0, index - 2), Math.max(0, index - 2) + 5);
}

/**
 * The next three slots, weeks and the coming month interleaved by opening
 * time. They carry a label and an opening time and nothing else: a future
 * slot deliberately does not say what is in it.
 */
function slotsAhead(now: Date, count = 3): Slot[] {
  const ahead: Slot[] = [];
  for (let offset = 1; offset <= count; offset += 1) {
    const cursor = new Date(now);
    cursor.setDate(cursor.getDate() + offset * 7);
    ahead.push(slotFor("WEEKLY", cursor));
  }
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  ahead.push(slotFor("MONTHLY", nextMonth));

  return ahead
    .filter((slot) => slotState(slot, now) === "future")
    .sort((a, b) => a.openAt.getTime() - b.openAt.getTime())
    .slice(0, count);
}

function capitalise(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

