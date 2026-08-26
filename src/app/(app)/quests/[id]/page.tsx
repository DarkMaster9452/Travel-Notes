import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SqMap, type MapPoint } from "@/components/sq/map";
import { Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { formatNumber } from "@/lib/i18n/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { scoreBreakdown } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quest = await db.quest.findUnique({ where: { id }, select: { title: true } });
  return { title: quest?.title ?? "Quest" };
}

/**
 * One quest.
 *
 * The page the database rows and the dashboard cards both lead to: the brief,
 * the ground, what it is worth and — if it has ever been booked — which window
 * it belonged to. Everything here is readable whether or not this account was
 * ever issued it, because filing proof does not require having been issued it.
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

  const [submission, walked, t, locale] = await Promise.all([
    db.submission.findUnique({
      where: { userId_questId: { userId: user.id, questId: quest.id } },
      select: { status: true, reviewNote: true, createdAt: true },
    }),
    db.submission.count({ where: { questId: quest.id, status: "APPROVED" } }),
    getT(user.id),
    getLocale(user.id),
  ]);

  const booking = quest.schedules[0] ?? null;
  const live = booking ? booking.openAt <= new Date() && booking.closeAt > new Date() : false;

  const { lines, total } = scoreBreakdown({
    difficulty: quest.difficulty,
    distance: quest.distance,
    elevationGain: quest.elevationGain,
    retreated: false,
    featuredPeriod: live ? booking!.period : null,
  });

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

  const hard = quest.difficulty === "HARD" || quest.difficulty === "EXPERT";

  return (
    <>
      <header className="sq-head">
        <div className="sq-head-row">
          <div style={{ minWidth: 0 }}>
            <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
              {quest.number ? `Quest № ${String(quest.number).padStart(4, "0")} · ` : ""}
              {quest.category ?? t.questPage.fromCatalogue}
            </span>
            <h1 className="sq-h1" style={{ fontSize: 40, maxWidth: "22ch", marginBottom: 10 }}>
              {quest.title}
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink-2)" }}>
              {quest.location} · {quest.region} · {quest.country}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Tag tone={hard ? "stamp" : "green"}>{quest.difficulty}</Tag>
            {booking ? (
              <Tag small>
                {booking.period === "MONTHLY" ? "Monthly" : "Weekly"} · {booking.slotKey}
              </Tag>
            ) : null}
            {submission ? (
              <Tag tone={submission.status === "APPROVED" ? "green" : submission.status === "REJECTED" ? "stamp" : "plain"} small>
                {submission.status === "APPROVED"
                  ? "Approved"
                  : submission.status === "REJECTED"
                    ? t.questPage.sentBack
                    : t.questPage.waiting}
              </Tag>
            ) : null}
          </div>
        </div>
      </header>

      <section className="sq-grid sq-grid-fit" style={{ alignItems: "start" }}>
        <article className="sq-card" style={{ overflow: "hidden" }}>
          <SqMap points={points} height={280} style={{ borderRadius: 0, border: 0 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
              gap: 1,
              background: "var(--line-2)",
            }}
          >
            {[
              { k: "Distance", v: `${quest.distance.toFixed(1)} km` },
              { k: "Ascent", v: `${formatNumber(locale, quest.elevationGain)} m` },
              { k: "Moving", v: hours(quest.duration) },
              { k: t.questPage.walkedBy, v: String(walked) },
            ].map((fact) => (
              <div key={fact.k} style={{ background: "var(--paper-2)", padding: "13px 15px" }}>
                <p className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
                  {fact.k}
                </p>
                <b
                  style={{
                    display: "block",
                    marginTop: 4,
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    fontSize: 19,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fact.v}
                </b>
              </div>
            ))}
          </div>
        </article>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <article className="sq-card sq-pad-sm">
            <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 12 }}>
              The brief
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", textWrap: "pretty" }}>
              {quest.description}
            </p>
            <ul style={{ marginTop: 14 }}>
              {[
                { k: t.questPage.objective, text: quest.objective },
                ...(quest.bonus ? [{ k: "Bonus", text: quest.bonus }] : []),
                ...(quest.safetyNotes ? [{ k: "Safety", text: quest.safetyNotes }] : []),
                ...(quest.terrain.length > 0 ? [{ k: "Ground", text: quest.terrain.join(", ") }] : []),
                ...(quest.features.length > 0 ? [{ k: "Look for", text: quest.features.join(", ") }] : []),
              ].map((line) => (
                <li
                  key={line.k}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "baseline",
                    padding: "10px 0",
                    borderTop: "1px solid var(--line-2)",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                  }}
                >
                  <b
                    className="sq-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: line.k === "Safety" ? "var(--signal)" : "var(--moss)",
                      flex: "0 0 62px",
                    }}
                  >
                    {line.k}
                  </b>
                  <span>{line.text}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="sq-card-flat">
            <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
              <h2 className="sq-h2">How it scores</h2>
            </div>
            <ul>
              {lines.map((line) => (
                <li
                  key={line.what}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "11px 22px",
                    borderTop: "1px solid var(--line-2)",
                    fontSize: 13.5,
                  }}
                >
                  <span>{line.what}</span>
                  <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12.5 }}>
                    +{line.points}
                  </b>
                </li>
              ))}
              <li
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "11px 22px",
                  borderTop: "1px solid var(--line-2)",
                  fontSize: 13.5,
                  color: "var(--signal)",
                }}
              >
                <span>If it is approved</span>
                <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12.5 }}>
                  {total} points
                </b>
              </li>
            </ul>
          </article>

          <Link href={`/quests/${quest.id}/proof`} className="sq-btn sq-btn-primary sq-btn-block">
            {submission ? t.questPage.editProof : t.questPage.fileProof}
          </Link>
        </div>
      </section>
    </>
  );
}

function hours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${rest > 0 ? `${String(rest).padStart(2, "0")}m` : ""}`.trim() : `${rest}m`;
}
