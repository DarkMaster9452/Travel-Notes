import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { importStravaActivityAction, submitProofAction } from "@/app/(app)/actions";
import { SqCountdown } from "@/components/sq/countdown";
import { SqProofForm } from "@/components/sq/proof-form";
import { Tag } from "@/components/sq/ui";
import { slotFor, slotLabel } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { scoreEntry } from "@/lib/leaderboard";
import { getStravaConnection } from "@/lib/strava";

export const metadata: Metadata = { title: "File proof" };
export const dynamic = "force-dynamic";

/**
 * File proof.
 *
 * Reachable from anywhere a quest is: the dashboard card, the monthly, the
 * quest database. The header states which quest and how long is left, because
 * both of those change what somebody is about to write.
 *
 * An existing submission is loaded into the form rather than starting a second
 * one — one submission per person per quest, edited in place, which is also
 * what re-filing after a decline means.
 */
export default async function FileProofPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;

  const [quest, existing, connection] = await Promise.all([
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
  ]);

  if (!quest) notFound();

  const booked = await db.questSchedule.findFirst({
    where: { questId: quest.id, closeAt: { gt: new Date() }, openAt: { lte: new Date() } },
    select: { period: true, slotKey: true, closeAt: true },
  });

  const period = booked?.period ?? null;
  const slot = period ? slotFor(period, new Date()) : null;

  const base = {
    difficulty: quest.difficulty,
    distance: quest.distance,
    elevationGain: quest.elevationGain,
    featuredPeriod: period,
  };

  return (
    <>
      <header className="sq-head">
        <div className="sq-head-row">
          <div style={{ minWidth: 0 }}>
            <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
              {quest.number ? `Quest № ${String(quest.number).padStart(4, "0")} · ` : ""}
              {period ? `${period === "MONTHLY" ? "monthly" : "weekly"} · ${slot ? slotLabel(slot) : ""}` : "off-cadence"}
              {booked ? " · closes in " : ""}
            </span>
            <h1 className="sq-h1" style={{ fontSize: 38, maxWidth: "none", marginBottom: 10 }}>
              {existing ? "Edit your proof" : "File your proof"}
            </h1>
            <p className="sq-lede" style={{ maxWidth: "60ch" }}>
              {quest.title}. A person reads every one of these — write it as you would tell somebody
              at the trailhead.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            {booked ? (
              <Tag tone="stamp" small>
                Closes in <SqCountdown to={booked.closeAt.toISOString()} />
              </Tag>
            ) : null}
            {existing ? (
              <Tag tone={existing.status === "REJECTED" ? "stamp" : "plain"} small>
                {existing.status === "PENDING"
                  ? "Waiting on a reader"
                  : existing.status === "APPROVED"
                    ? "Approved"
                    : "Sent back"}
              </Tag>
            ) : null}
          </div>
        </div>
      </header>

      {existing?.status === "REJECTED" && existing.reviewNote ? (
        <blockquote
          style={{
            margin: "0 0 18px",
            padding: "14px 16px 14px 12px",
            borderLeft: "2px solid var(--signal)",
            background: "var(--signal-wash)",
            borderRadius: "0 10px 10px 0",
            fontSize: 13,
            fontStyle: "italic",
            lineHeight: 1.6,
            color: "var(--color-accent-2-700)",
          }}
        >
          {existing.reviewNote}
        </blockquote>
      ) : null}

      <SqProofForm
        questId={quest.id}
        ask={{
          distance: quest.distance,
          elevationGain: quest.elevationGain,
          duration: quest.duration,
        }}
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
    </>
  );
}
