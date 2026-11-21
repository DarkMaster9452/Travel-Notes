import type { Metadata } from "next";
import { Trophy } from "lucide-react";

import { ParamSelect } from "@/components/app/filters";
import { BoardList, BoardRow } from "@/components/domain/board";
import { MEDAL_ORDER, MedalDisc } from "@/components/domain/medal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, EmptyState, Progress } from "@/components/ui/feedback";
import { TabsNav } from "@/components/ui/nav";
import { PageHeader, PageStack } from "@/components/ui/page";
import { type } from "@/components/ui/typography";
import { requireClient } from "@/lib/auth/guards";
import { formatNumber, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { FEATURED_BONUS, GRADE_POINTS, getLeaderboard, pastSlots, resolveSlot } from "@/lib/leaderboard";
import { slotDates, slotTitle } from "@/lib/quest/labels";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.leaderboard.title };
}
export const dynamic = "force-dynamic";

/**
 * The board (design/DESIGN-SYSTEM.md §12): tabs with the month first, the
 * reader's own standing, the podium and then everyone.
 *
 * Points for approved proof, on the same clock as everything else. The podium
 * is drawn from the same rows as the list rather than from a separate query:
 * one board, read twice, cannot disagree with itself. A sealed board keeps its
 * podium for good — see `LeaderboardAward`.
 */
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; slot?: string }>;
}) {
  const user = await requireClient();
  const params = await searchParams;
  const period = params.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  const [board, reader] = await Promise.all([getLeaderboard(period, params.slot), getReader(user.id)]);
  const { t, locale } = reader;
  const words = t.app.board;
  const slots = pastSlots(period, 8);
  const slot = resolveSlot(period, board.slotKey);

  const mine = board.rows.find((row) => row.userId === user.id) ?? null;
  const leader = board.rows[0]?.score ?? 0;
  const podium = board.rows.slice(0, 3);
  const places = [t.leaderboard.first, t.leaderboard.second, t.leaderboard.third];

  const grades = (["EASY", "MODERATE", "HARD", "EXPERT"] as const)
    .map((grade) => `${t.trail.difficulty[grade]} ${GRADE_POINTS[grade]}`)
    .join(" · ");

  return (
    <PageStack>
      <div>
        <PageHeader title={t.leaderboard.title} lede={t.leaderboard.lede} />
        <TabsNav
          label={t.leaderboard.cadence}
          active={period}
          options={[
            { key: "MONTHLY", label: t.leaderboard.monthlyTab, href: "/leaderboard" },
            { key: "WEEKLY", label: t.leaderboard.weeklyTab, href: "/leaderboard?period=WEEKLY" },
          ]}
        />
      </div>

      {/* --- where the reader stands ---------------------------------------- */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={type.h3}>{words.standing}</h2>
          <Badge tone={board.state === "live" ? "success" : "neutral"}>
            {board.state === "live" ? words.open : board.sealed ? t.leaderboard.sealed : t.leaderboard.closed}
          </Badge>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          {mine ? (
            <b className="font-display text-display-xl font-extrabold tabular-nums">#{mine.rank}</b>
          ) : null}
          <span className={mine ? "pb-2" : undefined}>
            <b className="block font-display text-h2 font-bold tabular-nums">
              {t.leaderboard.yourPoints(mine?.score ?? 0)}
            </b>
            <span className="text-body-sm text-muted">
              {mine
                ? `${plural(locale, mine.quests, t.common.quests)}${mine.tookFeatured ? ` · ${t.leaderboard.tookFeatured}` : ""}`
                : words.notRanked}
            </span>
          </span>
        </div>
        <Progress
          value={leader === 0 ? 0 : ((mine?.score ?? 0) / leader) * 100}
          label={words.againstLeader}
          className="max-w-form"
        />
        <p className="text-body-sm text-muted">
          {mine && mine.rank > 1 ? (
            <>
              <b className="font-semibold text-text">{t.leaderboard.toOvertake(mine.toOvertake)}</b>{" "}
              {t.leaderboard.takesPlaceAbove} {t.leaderboard.offTheLead(mine.behindLeader)}
            </>
          ) : mine ? (
            t.leaderboard.leading
          ) : (
            t.leaderboard.emptyBody
          )}
        </p>
      </Card>

      {/* --- the board itself -------------------------------------------------- */}
      <Card>
        <CardHeader
          title={slotTitle(slot, locale, t)}
          note={slotDates(slot, locale)}
          action={
            <ParamSelect
              name="slot"
              label={t.leaderboard.window}
              value={board.slotKey}
              options={slots.map((entry) => ({ value: entry.key, label: slotTitle(entry, locale, t) }))}
              className="w-48"
            />
          }
        />

        {board.rows.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={t.leaderboard.empty}
            action={
              <ButtonLink href="/monthly" variant="monthly">
                {t.leaderboard.openMonthly}
              </ButtonLink>
            }
          >
            {t.leaderboard.approvedOnly}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-6">
            {podium.length === 3 ? (
              <ol aria-label={words.podium} className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                {[1, 0, 2].map((place) => {
                  const row = podium[place];
                  return (
                    <li
                      key={row.userId}
                      className={cn(
                        "flex min-w-0 flex-col items-center gap-2 rounded-card bg-surface-sunken p-3 text-center sm:p-4",
                        place === 0 ? "pt-8 sm:pt-10" : place === 1 ? "pt-5 sm:pt-6" : "",
                      )}
                    >
                      <MedalDisc medal={MEDAL_ORDER[place]} size="lg" />
                      <span className="text-overline font-semibold uppercase text-subtle">{places[place]}</span>
                      <b className="max-w-full truncate text-body-sm font-semibold sm:text-body">{row.username}</b>
                      <span className="font-display text-h2 font-bold tabular-nums">
                        {formatNumber(locale, row.score)}
                      </span>
                      <span className="text-caption text-muted">{plural(locale, row.quests, t.common.quests)}</span>
                    </li>
                  );
                })}
              </ol>
            ) : null}

            <BoardList aria-label={words.everyone}>
              {board.rows.map((row) => (
                <BoardRow
                  key={row.userId}
                  rank={row.rank}
                  name={row.username}
                  href={row.handle ? `/people/${row.handle}` : undefined}
                  leading={<Avatar name={row.username} size="sm" />}
                  score={formatNumber(locale, row.score)}
                  meta={`${plural(locale, row.quests, t.common.quests)}${row.tookFeatured ? ` · ${t.leaderboard.tookFeatured}` : ""}`}
                  me={row.userId === user.id}
                  meLabel={t.app.dashboard.you}
                />
              ))}
            </BoardList>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 md:items-start lg:gap-6">
        <Card>
          <CardHeader title={words.howTitle} />
          <ol className="flex flex-col gap-3">
            {[
              words.grades(grades),
              words.perUnit,
              words.bonuses(FEATURED_BONUS.WEEKLY, FEATURED_BONUS.MONTHLY),
              words.retreat,
            ].map((note, index) => (
              <li key={note} className="flex items-start gap-3 text-body-sm text-muted">
                <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-primary-soft text-caption font-semibold tabular-nums text-primary-soft-fg">
                  {index + 1}
                </span>
                {note}
              </li>
            ))}
          </ol>
        </Card>

        <Alert tone="info" title={words.sealedTitle}>
          {words.sealedBody}
        </Alert>
      </div>
    </PageStack>
  );
}
