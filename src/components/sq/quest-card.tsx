import Link from "next/link";

import { SqCountdown } from "@/components/sq/countdown";
import { SqMap, type MapPoint } from "@/components/sq/map";
import { Bar, FactList, Slab, SlabFigures, Tag } from "@/components/sq/ui";

export type QuestCardData = {
  id: string;
  kicker: string;
  /** The grade, shown as a chip. Hard and Expert take stamp ink. */
  grade: "EASY" | "MODERATE" | "HARD" | "EXPERT";
  title: string;
  where: string;
  distance: number;
  elevationGain: number;
  duration: number;
  latitude: number;
  longitude: number;
  parkingLat?: number | null;
  parkingLng?: number | null;
  parkingName?: string | null;
  /** ISO instants: when the window opened and when it shuts. */
  openAt: string;
  closeAt: string;
  /** What the member's proof is doing, if they have filed any. */
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  cta: { label: string; href: string };
  /** Shown only when the member has asked for the extra figures in Settings. */
  expert?: { k: string; v: string }[] | null;
};

const HOURS = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${rest > 0 ? `${String(rest).padStart(2, "0")}m` : ""}`.trim() : `${rest}m`;
};

const STATUS_LINE: Record<QuestCardData["status"], string> = {
  NONE: "Nothing filed yet",
  PENDING: "Filed · waiting on a reader",
  APPROVED: "Approved · it counts",
  REJECTED: "Sent back · you can file again",
};

/**
 * One open quest.
 *
 * The map is real and per-quest rather than an illustration: where the quest
 * sends you is the single most useful thing on the card, and a picture of a
 * mountain is not that. When a car park is on file the card draws the approach
 * from it to the start, which is the only line the member actually walks
 * before the route begins.
 */
export function SqQuestCard({ quest, index = 0 }: { quest: QuestCardData; index?: number }) {
  const points: MapPoint[] = [];
  if (quest.parkingLat != null && quest.parkingLng != null) {
    points.push({
      lat: quest.parkingLat,
      lng: quest.parkingLng,
      label: quest.parkingName ?? "Park here",
      kind: "start",
    });
  }
  points.push({ lat: quest.latitude, lng: quest.longitude, label: quest.title, kind: "summit" });

  const hard = quest.grade === "HARD" || quest.grade === "EXPERT";
  const gone = progress(quest.openAt, quest.closeAt);

  return (
    <article
      className="sq-card sq-lift"
      style={{
        padding: "24px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 15,
        ["--i" as string]: index,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span className="sq-kicker">{quest.kicker}</span>
        <Tag tone={hard ? "stamp" : "green"}>{quest.grade}</Tag>
      </div>

      <h2 style={{ fontSize: 25, lineHeight: 1.12 }}>{quest.title}</h2>
      <p style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{quest.where}</p>

      <SqMap points={points} height={176} interactive={false} style={{ borderRadius: 10 }} />

      <FactList
        facts={[
          { k: "Distance", v: `${quest.distance.toFixed(1)} km` },
          { k: "Ascent", v: `${Math.round(quest.elevationGain)} m` },
          { k: "Moving", v: HOURS(quest.duration) },
        ]}
      />

      {quest.expert && quest.expert.length > 0 ? (
        <Slab kicker="Expert figures" style={{ padding: "12px 14px", borderRadius: 10 }}>
          <SlabFigures figures={quest.expert} />
        </Slab>
      ) : null}

      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{STATUS_LINE[quest.status]}</span>
          <b
            className="sq-mono"
            style={{ fontSize: 13, color: gone > 80 ? "var(--signal)" : "var(--ink-2)" }}
          >
            <SqCountdown to={quest.closeAt} closedLabel="Window shut" /> left
          </b>
        </div>
        <Bar pct={gone} fill={gone > 80 ? "var(--signal)" : "var(--moss)"} />
      </div>

      <Link
        href={quest.cta.href}
        className="sq-btn sq-btn-primary sq-btn-block"
        style={{ marginTop: "auto" }}
      >
        {quest.cta.label}
      </Link>
    </article>
  );
}

function progress(openAt: string, closeAt: string): number {
  const from = new Date(openAt).getTime();
  const to = new Date(closeAt).getTime();
  if (to <= from) return 100;
  return Math.max(0, Math.min(100, ((Date.now() - from) / (to - from)) * 100));
}
