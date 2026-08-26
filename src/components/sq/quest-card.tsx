import Link from "next/link";

import { SqCountdown } from "@/components/sq/countdown";
import { SqMap, type MapPoint } from "@/components/sq/map";
import { Slab, SlabFigures } from "@/components/sq/ui";

export type QuestCardData = {
  id: string;
  /** "The monthly · September" — cadence and slot, in that order. */
  kicker: string;
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
  openAt: string;
  closeAt: string;
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  /** What it is worth if a reader passes it. */
  points: number;
  /** When it was filed, for the verdict line. */
  filedAt?: string | null;
  cta: { label: string; href: string };
  expert?: { k: string; v: string }[] | null;
};

const GRADE_LABEL: Record<QuestCardData["grade"], string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  HARD: "Hard",
  EXPERT: "Expert",
};

const NUMBER = new Intl.NumberFormat("en-GB");
const FILED = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

/**
 * One open quest.
 *
 * Read top to bottom the way somebody decides whether to go: which quest and
 * what it is worth, where it is, what it costs in legs, and how long is left.
 * The chip top-right is the one thing that changes with state — points while
 * it is still open, the verdict once a reader has been — because that is the
 * question being asked at each stage.
 *
 * The card takes stamp ink only while its clock is genuinely short. A card
 * that is always urgent is a card nobody reads as urgent.
 */
export function SqQuestCard({ quest, index = 0 }: { quest: QuestCardData; index?: number }) {
  const points: MapPoint[] = [];
  if (quest.parkingLat != null && quest.parkingLng != null) {
    points.push({
      lat: quest.parkingLat,
      lng: quest.parkingLng,
      label: quest.parkingName ?? "Trailhead",
      kind: "start",
    });
  }
  points.push({ lat: quest.latitude, lng: quest.longitude, label: quest.title, kind: "summit" });

  const gone = progress(quest.openAt, quest.closeAt);
  const settled = quest.status === "APPROVED" || quest.status === "REJECTED";
  const urgent = !settled && gone > 75;

  return (
    <article
      className="sq-quest-card"
      data-urgent={urgent ? "1" : "0"}
      style={{ ["--i" as string]: index }}
    >
      <div className="sq-quest-head">
        <span className="sq-kicker" style={{ fontSize: 10 }}>
          {quest.kicker}
        </span>
        {settled ? (
          <span
            className="sq-tag sq-tag-xs"
            style={
              quest.status === "APPROVED"
                ? { background: "var(--color-accent-100)", color: "var(--color-accent-700)" }
                : { background: "var(--signal-wash)", color: "var(--signal)" }
            }
          >
            {quest.status === "APPROVED" ? `Approved · +${quest.points}` : "Sent back"}
          </span>
        ) : quest.status === "PENDING" ? (
          <span className="sq-tag sq-tag-xs">
            Filed{quest.filedAt ? ` ${FILED.format(new Date(quest.filedAt))}` : ""}
          </span>
        ) : (
          <span className="sq-tag sq-tag-stamp sq-tag-xs">+{quest.points} points</span>
        )}
      </div>

      <h2 className="sq-quest-title">{quest.title}</h2>
      <p className="sq-quest-where">{quest.where}</p>

      <div className="sq-quest-map">
        <SqMap points={points} height={190} interactive={false} style={{ borderRadius: 10 }} />
        <span className="sq-map-legend" aria-hidden="true">
          <i data-kind="start" />
          Trailhead
          <i data-kind="summit" />
          Summit
        </span>
      </div>

      <dl className="sq-quest-facts">
        <Fact k="Distance" v={`${quest.distance.toFixed(1)} km`} />
        <Fact k="Ascent" v={`${NUMBER.format(Math.round(quest.elevationGain))} m`} />
        <Fact k="Grade" v={GRADE_LABEL[quest.grade]} />
      </dl>

      {quest.expert && quest.expert.length > 0 ? (
        <Slab kicker="Expert figures" style={{ padding: "12px 14px", borderRadius: 10 }}>
          <SlabFigures figures={quest.expert} />
        </Slab>
      ) : null}

      <div className="sq-quest-clock">
        <div className="sq-quest-clock-row">
          <span>
            {settled
              ? "Read by a human"
              : quest.status === "PENDING"
                ? "Waiting on a reader"
                : "Closes in"}
          </span>
          <b
            className="sq-mono"
            style={{
              color: settled
                ? quest.status === "APPROVED"
                  ? "var(--moss)"
                  : "var(--signal)"
                : urgent
                  ? "var(--signal)"
                  : "var(--ink-2)",
            }}
          >
            {settled ? (
              quest.status === "APPROVED" ? (
                `Approved · +${quest.points}`
              ) : (
                "File it again"
              )
            ) : (
              <SqCountdown to={quest.closeAt} closedLabel="Window shut" />
            )}
          </b>
        </div>
        <span className="sq-bar">
          <span
            style={{
              width: settled ? "100%" : `${gone}%`,
              background: settled
                ? quest.status === "APPROVED"
                  ? "var(--moss)"
                  : "var(--signal)"
                : urgent
                  ? "var(--signal)"
                  : "var(--moss)",
            }}
          />
        </span>
      </div>

      <Link href={quest.cta.href} className="sq-btn sq-btn-primary sq-btn-block sq-quest-cta">
        {quest.cta.label}
      </Link>
    </article>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function progress(openAt: string, closeAt: string): number {
  const from = new Date(openAt).getTime();
  const to = new Date(closeAt).getTime();
  if (to <= from) return 100;
  return Math.max(0, Math.min(100, ((Date.now() - from) / (to - from)) * 100));
}
