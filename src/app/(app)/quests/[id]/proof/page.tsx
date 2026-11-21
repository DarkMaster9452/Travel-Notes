import type { Metadata } from "next";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { notFound } from "next/navigation";

import { importStravaActivityAction, submitProofAction } from "@/app/(app)/actions";
import { ProofForm } from "@/components/app/proof-form";
import { Countdown } from "@/components/domain/countdown";
import { Badge, SubmissionBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { DetailGrid, PageHeader } from "@/components/ui/page";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getReader } from "@/lib/i18n/server";
import { scoreEntry } from "@/lib/leaderboard";
import { slotTitle } from "@/lib/quest/labels";
import { getStravaConnection } from "@/lib/strava";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.app.proofForm.titleNew };
}
export const dynamic = "force-dynamic";

/**
 * File proof.
 *
 * Reachable from anywhere a quest is: the dashboard, the monthly page, the
 * quest list. The header states which quest and how long is left, because
 * both of those change what somebody is about to write.
 *
 * An existing submission is loaded into the form rather than starting a second
 * one — one submission per person per quest, edited in place, which is also
 * what re-filing after a decline means.
 */
export default async function FileProofPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;

  const [quest, existing, connection, reader] = await Promise.all([
    db.quest.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        number: true,
        location: true,
        region: true,
        difficulty: true,
        distance: true,
        elevationGain: true,
        duration: true,
      },
    }),
    db.submission.findUnique({
      where: { userId_questId: { userId: user.id, questId: id } },
      select: {
        note: true,
        photos: true,
        stravaUrl: true,
        distance: true,
        elevation: true,
        movingTime: true,
        retreated: true,
        startedAt: true,
        status: true,
        reviewNote: true,
      },
    }),
    getStravaConnection(user.id),
    getReader(user.id),
  ]);
  const { t, locale } = reader;
  const words = t.app.proofForm;

  if (!quest) notFound();

  const now = new Date();
  const booked = await db.questSchedule.findFirst({
    where: { questId: quest.id, closeAt: { gt: now }, openAt: { lte: now } },
    select: { period: true, slotKey: true, openAt: true, closeAt: true },
  });
  const period = booked?.period ?? null;

  const base = {
    difficulty: quest.difficulty,
    distance: quest.distance,
    elevationGain: quest.elevationGain,
    featuredPeriod: period,
  };

  const statusWords = { PENDING: t.questPage.waiting, APPROVED: t.app.quest.approved, REJECTED: t.questPage.sentBack };

  return (
    <>
      <div className="mb-4">
        <ButtonLink href={`/quests/${quest.id}`} variant="link">
          <ArrowLeft aria-hidden="true" />
          {words.back}
        </ButtonLink>
      </div>
      <PageHeader
        overline={[
          quest.number ? t.app.quest.number(String(quest.number).padStart(4, "0")) : null,
          booked
            ? (booked.period === "MONTHLY" ? t.app.quest.wasMonthly : t.app.quest.wasWeekly)(
                slotTitle({ period: booked.period, key: booked.slotKey, openAt: booked.openAt }, locale, t),
              )
            : words.offCadence,
        ]
          .filter(Boolean)
          .join(" · ")}
        title={existing ? words.titleEdit : words.titleNew}
        lede={words.lede(quest.title)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {booked ? (
              <Badge tone={booked.period === "MONTHLY" ? "monthly" : "weekly"} icon={Clock}>
                {words.closesIn} <Countdown to={booked.closeAt.toISOString()} closedLabel={words.closed} />
              </Badge>
            ) : null}
            {existing ? <SubmissionBadge status={existing.status}>{statusWords[existing.status]}</SubmissionBadge> : null}
          </div>
        }
      />

      <DetailGrid
        aside={
          <>
            <Card>
              <CardHeader title={t.proof.readerLooksFor} level={2} />
              <ul className="flex flex-col gap-3">
                {[t.proof.whatHappenedHint, t.proof.photographsHint, t.proof.figuresHint, t.proof.retreatHint].map(
                  (line) => (
                    <li key={line} className="flex items-start gap-2 text-body-sm text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      {line}
                    </li>
                  ),
                )}
              </ul>
            </Card>
            <Alert tone="info" title={words.declineTitle}>
              {words.declineBody}
            </Alert>
          </>
        }
      >
        {existing?.status === "REJECTED" && existing.reviewNote ? (
          <Alert tone="warning" title={t.app.quest.reviewNote}>
            {existing.reviewNote}
          </Alert>
        ) : null}

        <ProofForm
          questId={quest.id}
          ask={{ distance: quest.distance, elevationGain: quest.elevationGain, duration: quest.duration }}
          draft={{
            note: existing?.note ?? "",
            photos: existing?.photos ?? [],
            stravaUrl: existing?.stravaUrl ?? "",
            distance: existing?.distance != null ? String(existing.distance) : "",
            elevation: existing?.elevation != null ? String(existing.elevation) : "",
            movingTime: existing?.movingTime != null ? String(existing.movingTime) : "",
            retreated: existing?.retreated ?? false,
            startedAt: existing?.startedAt ? existing.startedAt.toISOString().slice(0, 10) : "",
          }}
          scoreFull={scoreEntry({ ...base, retreated: false })}
          scoreRetreat={scoreEntry({ ...base, retreated: true })}
          stravaConnected={connection !== null}
          submit={submitProofAction}
          importStrava={importStravaActivityAction}
        />
      </DetailGrid>
    </>
  );
}
