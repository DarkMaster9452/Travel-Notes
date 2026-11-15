import type { Metadata } from "next";
import { Check, Clock, Lock, Mountain } from "lucide-react";

import { Countdown } from "@/components/domain/countdown";
import { ApproachCard, BriefCard, ConditionsCard, ScoreCard, trimNote } from "@/components/domain/quest-detail";
import { QuestMap, type MapPoint } from "@/components/domain/quest-map";
import { MonthlyHero, tagLabel, toTrailQuest } from "@/components/domain/trail";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, EmptyState, Progress } from "@/components/ui/feedback";
import { DetailGrid, PageHeader, PageStack, Section } from "@/components/ui/page";
import { slotFor } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import type { Locale, Messages } from "@/lib/i18n";
import { formatDate, formatNumber, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { formatDistance, formatHeight, formatMinutes, type Units } from "@/lib/i18n/units";
import { scoreEntry } from "@/lib/leaderboard";
import { slotTitle } from "@/lib/quest/labels";
import { loadFeaturedSlot } from "@/lib/quest/slot";
import { windowProgress } from "@/lib/quest/window";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.nav.monthly };
}
export const dynamic = "force-dynamic";

/**
 * The monthly quest, in full (design/DESIGN-SYSTEM.md §12): the hero, then a
 * detail 8 / 4 with the map, the brief and the approach on the left and the
 * window, the scoring and what others said on the right.
 *
 * Opening this page *is* taking the quest — unlike the dashboard, which only
 * glances — so `loadFeaturedSlot` materialises it.
 */
export default async function MonthlyPage() {
  const user = await requireClient();
  const now = new Date();
  const slot = slotFor("MONTHLY", now);

  const [state, reader] = await Promise.all([loadFeaturedSlot(user.id, "month", now), getReader(user.id)]);
  const { t, locale, units } = reader;
  const featured = state.featured;
  const monthLabel = slotTitle(slot, locale, t);

  if (!featured) {
    return (
      <>
        <PageHeader overline={t.monthly.theBigOne(monthLabel)} title={t.monthly.noMonthly} />
        <Card>
          <EmptyState
            icon={Mountain}
            title={t.monthly.nothingBooked}
            action={
              <ButtonLink href="/settings/general" variant="secondary">
                {t.monthly.openSettings}
              </ButtonLink>
            }
          >
            {t.monthly.nothingBookedBody}
          </EmptyState>
        </Card>
      </>
    );
  }

  const quest = featured.summary;

  const [filed, approved, conditions, display, entitlement] = await Promise.all([
    db.submission.count({ where: { period: "MONTHLY", slotKey: featured.key } }),
    db.submission.count({ where: { period: "MONTHLY", slotKey: featured.key, status: "APPROVED" } }),
    db.submission.findMany({
      where: { questId: quest.id, status: "APPROVED" },
      orderBy: { reviewedAt: "desc" },
      take: 4,
      select: { note: true, startedAt: true, createdAt: true },
    }),
    db.displaySettings.findUnique({ where: { userId: user.id }, select: { expertStats: true } }),
    getEntitlement(user.id),
  ]);

  // A setting, not a design variant: the switch on Settings → General decides
  // whether the figures appear, and the plan decides whether the switch moves.
  const expertStats = (display?.expertStats ?? false) && entitlement.isSubscribed;

  const scored = {
    difficulty: quest.difficulty,
    distance: quest.distance,
    elevationGain: quest.elevationGain,
    retreated: false,
    featuredPeriod: "MONTHLY" as const,
  };

  const gone = windowProgress(slot.openAt, state.closesAt, now.getTime());
  const daysGone = Math.floor((now.getTime() - slot.openAt.getTime()) / 86_400_000);
  const daysTotal = Math.round((state.closesAt.getTime() - slot.openAt.getTime()) / 86_400_000);

  const points: MapPoint[] = [];
  if (quest.parkingLat != null && quest.parkingLng != null) {
    points.push({
      lat: quest.parkingLat,
      lng: quest.parkingLng,
      label: quest.parkingName ?? t.monthly.parkHere,
      kind: "start",
    });
  }
  points.push({ lat: quest.latitude, lng: quest.longitude, label: quest.title, kind: "summit" });

  const filedAlready = state.proof.status !== "NONE";

  return (
    <PageStack>
      <MonthlyHero
        quest={toTrailQuest(quest, t)}
        t={t}
        locale={locale}
        units={units}
        headingLevel={1}
        monthLabel={monthLabel}
        closesAt={state.closed ? null : state.closesAt}
        lede={quest.subtitle}
        primary={
          state.closed || filedAlready ? null : { label: t.trail.fileProof, href: `/quests/${quest.id}/proof` }
        }
        status={
          state.closed ? (
            <Badge tone="onFeature" size="lg" icon={Lock}>
              {t.questCard.windowShut}
            </Badge>
          ) : state.proof.status === "APPROVED" ? (
            <Badge tone="onFeature" size="lg" icon={Check}>
              {t.app.dashboard.proofApproved}
            </Badge>
          ) : filedAlready ? (
            <Badge tone="onFeature" size="lg" icon={Clock}>
              {state.proof.status === "REJECTED" ? t.app.dashboard.proofReturned : t.app.dashboard.proofWaiting}
            </Badge>
          ) : undefined
        }
      />

      <DetailGrid
        aside={
          <>
            <Card>
              <CardHeader title={t.monthly.window} />
              <p className="flex flex-wrap items-baseline gap-x-2">
                <b className="font-display text-h1 font-bold tabular-nums">
                  {state.closed ? (
                    t.monthly.shut
                  ) : (
                    <Countdown to={state.closesAt.toISOString()} closedLabel={t.monthly.shut} />
                  )}
                </b>
                <span className="text-body-sm text-muted">
                  {state.closed ? t.monthly.forThisMonth : t.monthly.leftToFile}
                </span>
              </p>
              <Progress value={gone} label={t.monthly.daysGone(daysGone, daysTotal)} tone="monthly" className="mt-3" />
              <p className="mt-3 text-caption text-muted">
                {t.monthly.daysGone(daysGone, daysTotal)} · {t.monthly.haveFiled(plural(locale, filed, t.common.people))}{" "}
                · {t.monthly.approvedSoFar(approved)}
              </p>
              {/* The hero above carries the one accent action; this is the same
                  door from further down the page. */}
              <ButtonLink href={`/quests/${quest.id}/proof`} variant="secondary" block className="mt-4">
                {filedAlready ? t.monthly.editProof : t.monthly.fileProof}
              </ButtonLink>
            </Card>

            {state.proof.status === "REJECTED" && state.proof.reviewNote ? (
              <Alert tone="warning" title={t.app.quest.reviewNote}>
                {state.proof.reviewNote}
              </Alert>
            ) : null}

            <ScoreCard entry={scored} t={t} locale={locale} units={units} />

            <Alert tone="info" title={t.monthly.whatCounts}>
              {t.monthly.whatCountsBody}
            </Alert>

            <ConditionsCard
              title={t.monthly.conditions}
              empty={t.monthly.conditionsEmpty}
              entries={conditions.map((entry) => ({
                when: formatDate(locale, entry.startedAt ?? entry.createdAt, "dayMonth"),
                note: trimNote(entry.note),
              }))}
            />
          </>
        }
      >
        <Card pad="none" className="overflow-hidden">
          <QuestMap points={points} className="h-72" />
        </Card>

        <BriefCard title={t.monthly.brief} lede={quest.objective} lines={briefLines(quest, t, locale, units)} />

        <ApproachCard title={t.monthly.approach} legs={approachLegs(quest, t, locale, units)} />
      </DetailGrid>

      {expertStats ? (
        <Section title={t.monthly.expertFigures} note={t.monthly.expertNote}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                k: t.monthly.expert.metresPerKm,
                v: t.app.quest.expert.perKm(
                  formatHeight(locale, quest.elevationGain / Math.max(1, quest.distance), units),
                ),
                note: t.monthly.expert.metresPerKmNote,
              },
              {
                k: t.monthly.expert.askedPace,
                v: `${formatNumber(locale, Math.round((quest.distance / Math.max(1, quest.duration / 60)) * 10) / 10)} km/h`,
                note: t.monthly.expert.askedPaceNote,
              },
              {
                k: t.monthly.expert.travel,
                v: quest.travelTime ? formatMinutes(quest.travelTime) : t.common.none,
                note: t.monthly.expert.travelNote,
              },
              {
                k: t.monthly.expert.filedSoFar,
                v: formatNumber(locale, filed),
                note: t.monthly.expert.filedSoFarNote(approved),
              },
              {
                k: t.monthly.expert.approvalRate,
                v: filed === 0 ? t.common.none : `${Math.round((approved / filed) * 100)} %`,
                note: t.monthly.expert.approvalRateNote,
              },
              {
                k: t.monthly.expert.worth,
                v: t.app.quest.score.points(scoreEntry(scored)),
                note: t.monthly.expert.worthNote,
              },
            ].map((figure) => (
              <Card as="li" key={figure.k}>
                <p className="text-overline font-semibold uppercase text-subtle">{figure.k}</p>
                <b className="mt-2 block font-display text-h2 font-bold tabular-nums">{figure.v}</b>
                <p className="mt-2 text-caption text-muted">{figure.note}</p>
              </Card>
            ))}
          </ul>
        </Section>
      ) : null}
    </PageStack>
  );
}

function briefLines(
  quest: {
    distance: number;
    elevationGain: number;
    duration: number;
    terrain: string[];
    features: string[];
    mood: string | null;
  },
  t: Messages,
  locale: Locale,
  units: Units,
): { label: string; text: string }[] {
  const lines: { label: string; text: string }[] = [
    {
      label: t.monthly.asked,
      text: [
        formatDistance(locale, quest.distance, units),
        `${formatHeight(locale, quest.elevationGain, units)} ${t.trail.ascent}`,
        formatMinutes(quest.duration),
      ].join(" · "),
    },
  ];
  if (quest.terrain.length > 0) {
    lines.push({ label: t.monthly.ground, text: quest.terrain.map((tag) => tagLabel(tag, t)).join(", ") });
  }
  if (quest.features.length > 0) {
    lines.push({ label: t.monthly.lookFor, text: quest.features.map((tag) => tagLabel(tag, t)).join(", ") });
  }
  if (quest.mood) lines.push({ label: t.monthly.mood, text: quest.mood });
  return lines;
}

/**
 * The approach, in stages.
 *
 * Built from the parking, approach and transit fields the quest actually
 * carries. A leg-by-leg route breakdown would be a nicer list, but nothing in
 * the schema records one, and a page that invented five plausible waypoints
 * would be lying about ground somebody is going to stand on.
 */
function approachLegs(
  quest: {
    parkingName: string | null;
    parkingNote: string | null;
    approachTime: number | null;
    transitNote: string | null;
    location: string;
    title: string;
    distance: number;
    elevationGain: number;
    duration: number;
  },
  t: Messages,
  locale: Locale,
  units: Units,
): { at: string; place: string; what: string; up?: string }[] {
  const legs: { at: string; place: string; what: string; up?: string }[] = [];

  if (quest.parkingName) {
    legs.push({ at: "0 min", place: quest.parkingName, what: quest.parkingNote ?? t.monthly.parkHereNote });
  }
  if (quest.transitNote) {
    legs.push({ at: t.common.none, place: t.monthly.withoutCar, what: quest.transitNote });
  }
  legs.push({
    at: quest.approachTime ? `+ ${formatMinutes(quest.approachTime)}` : t.monthly.start,
    place: quest.location,
    what: t.monthly.startNote,
  });
  legs.push({
    at: formatMinutes(quest.duration),
    place: quest.title,
    what: t.monthly.fromStart(formatNumber(locale, Math.round(quest.distance * 10) / 10)),
    up: `${formatHeight(locale, quest.elevationGain, units)} ↑`,
  });

  return legs;
}
