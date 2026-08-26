import Link from "next/link";

import { SqCountdown } from "@/components/sq/countdown";
import { SqMap, type MapPoint } from "@/components/sq/map";
import { Slab, SlabFigures } from "@/components/sq/ui";
import type { Locale, Messages } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/i18n/format";

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
export function SqQuestCard({
  quest,
  index = 0,
  t,
  locale,
}: {
  quest: QuestCardData;
  index?: number;
  t: Messages;
  locale: Locale;
}) {
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
            {quest.status === "APPROVED" ? t.questCard.approved(quest.points) : t.questCard.sentBack}
          </span>
        ) : quest.status === "PENDING" ? (
          <span className="sq-tag sq-tag-xs">
            {quest.filedAt
              ? t.questCard.filedOn(formatDate(locale, quest.filedAt, "weekday"))
              : t.questCard.waiting}
          </span>
        ) : (
          <span className="sq-tag sq-tag-stamp sq-tag-xs">{t.questCard.stamp(quest.points)}</span>
        )}
      </div>

      <h2 className="sq-quest-title">{quest.title}</h2>
      <p className="sq-quest-where">{quest.where}</p>

      <div className="sq-quest-map">
        <SqMap points={points} height={190} interactive={false} style={{ borderRadius: 10 }} />
        <span className="sq-map-legend" aria-hidden="true">
          <i data-kind="start" />
          {t.questCard.trailhead}
          <i data-kind="summit" />
          {t.questCard.summit}
        </span>
      </div>

      <dl className="sq-quest-facts">
        <Fact k={t.questCard.distance} v={`${quest.distance.toFixed(1)} km`} />
        <Fact
          k={t.questCard.ascent}
          v={`${formatNumber(locale, Math.round(quest.elevationGain))} m`}
        />
        <Fact k={t.questCard.grade} v={GRADE_LABEL[quest.grade]} />
      </dl>

      {quest.expert && quest.expert.length > 0 ? (
        <Slab kicker={t.questCard.expertFigures} style={{ padding: "12px 14px", borderRadius: 10 }}>
          <SlabFigures figures={quest.expert} />
        </Slab>
      ) : null}

      <div className="sq-quest-clock">
        <div className="sq-quest-clock-row">
          <span>
            {settled
              ? t.questCard.readByHuman
              : quest.status === "PENDING"
                ? t.questCard.waiting
                : t.questCard.closesIn}
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
                t.questCard.approved(quest.points)
              ) : (
                t.questCard.fileAgain
              )
            ) : (
              <SqCountdown to={quest.closeAt} closedLabel={t.questCard.windowShut} />
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
