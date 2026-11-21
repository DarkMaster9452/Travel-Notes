import type { Metadata } from "next";
import { ArrowLeft, Footprints } from "lucide-react";
import { notFound } from "next/navigation";

import { BriefCard, ScoreCard } from "@/components/domain/quest-detail";
import { QuestMap, type MapPoint } from "@/components/domain/quest-map";
import {
  DifficultyMeter,
  QuestFigures,
  TrailMarks,
  TrailPhoto,
  tagLabel,
  toTrailQuest,
} from "@/components/domain/trail";
import { Badge, SubmissionBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { DetailGrid, PageHeader, PageStack } from "@/components/ui/page";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { countryName, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { formatMinutes } from "@/lib/i18n/units";
import { slotTitle } from "@/lib/quest/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const quest = await db.quest.findUnique({ where: { id }, select: { title: true } });
  return { title: quest?.title ?? "Quest" };
}

/**
 * One quest (design/DESIGN-SYSTEM.md §12, "detail 8 / 4").
 *
 * The page the quest cards lead to: the photograph, the marks and the three
 * figures, the brief and the map on the left; what it is worth and the one
 * action on the right. Everything here is readable whether or not this
 * account was ever issued the quest, because filing proof does not require
 * having been issued it.
 */
export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;

  const quest = await db.quest.findUnique({
    where: { id },
    include: {
      schedules: { select: { period: true, slotKey: true, openAt: true, closeAt: true } },
    },
  });

  if (!quest || (!quest.published && !quest.isShowcase)) notFound();

  const [submission, walked, reader] = await Promise.all([
    db.submission.findUnique({
      where: { userId_questId: { userId: user.id, questId: quest.id } },
      select: { status: true, reviewNote: true, createdAt: true },
    }),
    db.submission.count({ where: { questId: quest.id, status: "APPROVED" } }),
    getReader(user.id),
  ]);
  const { t, locale, units } = reader;

  const booking = quest.schedules[0] ?? null;
  const now = new Date();
  const live = booking ? booking.openAt <= now && booking.closeAt > now : false;
  const trailQuest = toTrailQuest(quest, t);

  const points: MapPoint[] = [];
  if (quest.parkingLat != null && quest.parkingLng != null) {
    points.push({
      lat: quest.parkingLat,
      lng: quest.parkingLng,
      label: quest.parkingName ?? t.questPage.parkHere,
      kind: "start",
    });
  }
  points.push({ lat: quest.latitude, lng: quest.longitude, label: quest.title, kind: "summit" });

  const bookingLabel = booking
    ? (booking.period === "MONTHLY" ? t.app.quest.wasMonthly : t.app.quest.wasWeekly)(
        slotTitle({ period: booking.period, key: booking.slotKey, openAt: booking.openAt }, locale, t),
      )
    : null;

  const statusWords = { PENDING: t.questPage.waiting, APPROVED: t.app.quest.approved, REJECTED: t.questPage.sentBack };

  return (
    <PageStack>
      <div className="flex flex-col gap-4">
        <div>
          <ButtonLink href="/quests" variant="link">
            <ArrowLeft aria-hidden="true" />
            {t.app.quest.backToList}
          </ButtonLink>
        </div>
        <PageHeader
          className="mb-0"
          overline={[
            quest.number ? t.app.quest.number(String(quest.number).padStart(4, "0")) : null,
            quest.category ?? t.questPage.fromCatalogue,
          ]
            .filter(Boolean)
            .join(" · ")}
          title={quest.title}
          lede={[quest.location, quest.region, countryName(locale, quest.country)].join(" · ")}
          actions={
            bookingLabel ? (
              <Badge tone={booking?.period === "MONTHLY" ? (live ? "monthly" : "monthlySoft") : "weekly"}>
                {bookingLabel}
              </Badge>
            ) : undefined
          }
        />
        <TrailPhoto src={quest.coverImage} alt="" eager className="aspect-video rounded-card md:aspect-21/9" />
      </div>

      <DetailGrid
        asideFirst
        aside={
          <>
            <Card>
              {submission ? (
                <div className="mb-4 flex flex-col items-start gap-3">
                  <SubmissionBadge status={submission.status} size="lg">
                    {statusWords[submission.status]}
                  </SubmissionBadge>
                  {submission.status === "REJECTED" && submission.reviewNote ? (
                    <Alert tone="warning" title={t.app.quest.reviewNote} className="w-full">
                      {submission.reviewNote}
                    </Alert>
                  ) : null}
                </div>
              ) : null}
              <ButtonLink
                href={`/quests/${quest.id}/proof`}
                variant={submission?.status === "APPROVED" ? "secondary" : "primary"}
                size="lg"
                block
              >
                {submission ? t.questPage.editProof : t.questPage.fileProof}
              </ButtonLink>
              <p className="mt-3 flex items-center gap-2 text-caption text-muted">
                <Footprints className="size-4 shrink-0" aria-hidden="true" />
                {walked > 0 ? t.app.quest.walkedBy(plural(locale, walked, t.common.people)) : t.app.quest.walkedByNobody}
              </p>
            </Card>

            <ScoreCard
              entry={{
                difficulty: quest.difficulty,
                distance: quest.distance,
                elevationGain: quest.elevationGain,
                retreated: false,
                featuredPeriod: live ? booking!.period : null,
              }}
              t={t}
              locale={locale}
              units={units}
            />
          </>
        }
      >
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <TrailMarks marks={quest.trailMarks} t={t} />
            <DifficultyMeter level={quest.difficulty} t={t} />
            {quest.travelTime ? (
              <span className="text-body-sm text-muted">
                {t.trail.travel}: {formatMinutes(quest.travelTime)}
              </span>
            ) : null}
          </div>
          <QuestFigures quest={trailQuest} t={t} locale={locale} units={units} />
        </Card>

        <BriefCard
          title={t.monthly.brief}
          lede={quest.description}
          lines={[
            { label: t.questPage.objective, text: quest.objective },
            ...(quest.bonus ? [{ label: t.app.quest.bonus, text: quest.bonus }] : []),
            ...(quest.safetyNotes
              ? [{ label: t.app.quest.safety, text: quest.safetyNotes, tone: "danger" as const }]
              : []),
            ...(quest.terrain.length > 0
              ? [{ label: t.monthly.ground, text: quest.terrain.map((tag) => tagLabel(tag, t)).join(", ") }]
              : []),
            ...(quest.features.length > 0
              ? [{ label: t.monthly.lookFor, text: quest.features.map((tag) => tagLabel(tag, t)).join(", ") }]
              : []),
          ]}
          foot={locale === "en" ? undefined : t.questPage.briefInEnglish}
        />

        <Card pad="none" className="overflow-hidden">
          <div className="p-5 pb-0">
            <CardHeader title={t.app.quest.openMap} className="mb-4" />
          </div>
          <QuestMap points={points} className="h-72" />
        </Card>
      </DetailGrid>
    </PageStack>
  );
}
