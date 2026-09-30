import Link from "next/link";

import { TrailPhoto } from "@/components/domain/trail-photo";
import type { Locale, Messages } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";
import { TRAIL_MARK_COLOR, TRAIL_MARKS_SHOWN, trailMarksOf, type TrailMark } from "@/lib/trail-marks";

/**
 * The Trail domain components (design/DESIGN-SYSTEM.md §1.5, §7.4, §7.5).
 *
 * Deliberately not client components: they hold no state, so the server
 * pages render them directly and a client component can render them too.
 * Words come in through `t`, numbers through `locale`.
 */

export type Difficulty = "EASY" | "MODERATE" | "HARD" | "EXPERT";

const PEAKS: Record<Difficulty, { on: number; ink: string }> = {
  EASY: { on: 1, ink: "var(--color-diff-easy)" },
  MODERATE: { on: 2, ink: "var(--color-diff-moderate)" },
  HARD: { on: 3, ink: "var(--color-diff-hard)" },
  EXPERT: { on: 4, ink: "var(--color-diff-expert)" },
};

/* --- trail marks ---------------------------------------------------------- */

function Mark({ mark }: { mark: TrailMark }) {
  if (mark === "EDUCATIONAL") return <span className="trail-mark" data-kind="EDUCATIONAL" aria-hidden="true" />;
  return (
    <span className="trail-mark" aria-hidden="true" style={{ ["--mark" as string]: TRAIL_MARK_COLOR[mark] }}>
      <i />
      <i />
      <i />
    </span>
  );
}

/** The marks in walking order, drawn and spelled out ("Red → Blue"). */
export function TrailMarks({ marks, t }: { marks: readonly string[] | null | undefined; t: Messages }) {
  const known = trailMarksOf(marks);
  if (known.length === 0) {
    return (
      <span className="trail-marks">
        <span className="trail-marks-empty">{t.trail.noMarks}</span>
      </span>
    );
  }
  const shown = known.slice(0, TRAIL_MARKS_SHOWN);
  const rest = known.length - shown.length;
  const words = known.map((mark) => t.trail.marks[mark]).join(" → ");

  return (
    <span className="trail-marks">
      <span className="trail-marks-set">
        {shown.map((mark, index) => (
          <span key={`${mark}-${index}`} style={{ display: "contents" }}>
            {index > 0 ? (
              <span className="trail-marks-arrow" aria-hidden="true">
                →
              </span>
            ) : null}
            <Mark mark={mark} />
          </span>
        ))}
        {rest > 0 ? <span className="trail-marks-more">+{rest}</span> : null}
      </span>
      <span className="trail-marks-text">{words}</span>
    </span>
  );
}

/* --- difficulty ----------------------------------------------------------- */

/** Four peaks, as many filled as the grade; the word beside it in text ink. */
export function DifficultyMeter({ level, t }: { level: Difficulty; t: Messages }) {
  const peaks = PEAKS[level];
  return (
    <span className="trail-diff">
      <span className="trail-diff-peaks" style={{ ["--peak" as string]: peaks.ink }} aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <svg key={index} viewBox="0 0 14 12">
            <path className={index < peaks.on ? "on" : "off"} d="M7 1 13 11H1z" />
          </svg>
        ))}
      </span>
      {t.trail.difficulty[level]}
    </span>
  );
}

/* --- figures -------------------------------------------------------------- */

export function formatKm(locale: Locale, km: number): string {
  return `${formatNumber(locale, Math.round(km * 10) / 10)} km`;
}

export function formatMetres(locale: Locale, metres: number): string {
  return `${formatNumber(locale, Math.round(metres))} m`;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/* --- quest card (§7.4) ---------------------------------------------------- */

export type TrailQuest = {
  id: string;
  title: string;
  region: string;
  location: string;
  distance: number;
  elevationGain: number;
  duration: number;
  difficulty: Difficulty;
  coverImage: string | null;
  trailMarks: readonly string[];
  travelTime?: number | null;
  /** Category tags, at most two are shown. */
  tags?: readonly string[];
};

/** Anything shaped like a quest row or a `QuestSummary` → the card's props. */
export function toTrailQuest(
  quest: {
    id: string;
    title: string;
    region: string;
    location: string;
    distance: number;
    elevationGain: number;
    duration: number;
    difficulty: Difficulty;
    coverImage: string | null;
    trailMarks?: readonly string[] | null;
    travelTime?: number | null;
    features?: readonly string[] | null;
  },
  t: Messages,
): TrailQuest {
  return {
    id: quest.id,
    title: quest.title,
    region: quest.region,
    location: quest.location,
    distance: quest.distance,
    elevationGain: quest.elevationGain,
    duration: quest.duration,
    difficulty: quest.difficulty,
    coverImage: quest.coverImage,
    trailMarks: quest.trailMarks ?? [],
    travelTime: quest.travelTime ?? null,
    tags: (quest.features ?? []).map((tag) => t.trail.tags[tag] ?? tag.replace(/_/g, " ")),
  };
}

const TAG_TONES = ["sky", "lake", "lilac", "berry", "sun"] as const;

/** A stable, playful tone per tag word, so "waterfall" is always the same colour. */
function toneFor(tag: string): (typeof TAG_TONES)[number] {
  let hash = 0;
  for (const char of tag) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}

export function QuestCard({
  quest,
  t,
  locale,
  href,
  period,
  foot,
}: {
  quest: TrailQuest;
  t: Messages;
  locale: Locale;
  href?: string;
  /** Weekly quests carry the sky badge; the monthly never appears as a card. */
  period?: "WEEKLY" | null;
  /** The status pill or action in the footer. */
  foot?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="trail-qcard-photo">
        <div style={{ position: "relative" }}>
          <TrailPhoto src={quest.coverImage} alt={quest.title} />
          {period === "WEEKLY" ? (
            <div className="trail-qcard-tags-top">
              <span className="trail-pill" data-tone="weekly">
                {t.trail.weekly}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="trail-qcard-pad trail-qcard-marks">
        <TrailMarks marks={quest.trailMarks} t={t} />
      </div>
      <h3 className="trail-qcard-pad trail-qcard-title">{quest.title}</h3>
      <p className="trail-qcard-pad trail-qcard-where">
        {quest.region} · {t.trail.start} {quest.location}
      </p>
      <div className="trail-qcard-pad trail-qcard-stats">
        <div className="trail-stats3">
          <div>
            <b>{formatKm(locale, quest.distance)}</b>
            <span>{t.trail.distance}</span>
          </div>
          <div>
            <b>{formatMetres(locale, quest.elevationGain)}</b>
            <span>{t.trail.ascent}</span>
          </div>
          <div>
            <b>{formatMinutes(quest.duration)}</b>
            <span>{t.trail.time}</span>
          </div>
        </div>
      </div>
      <div className="trail-qcard-pad trail-qcard-diff">
        <DifficultyMeter level={quest.difficulty} t={t} />
        {quest.travelTime ? (
          <span className="trail-qcard-travel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 16h14M6 16l1.5-5h9L18 16M7 16v2M17 16v2" />
            </svg>
            {formatMinutes(quest.travelTime)}
          </span>
        ) : null}
      </div>
      <div className="trail-qcard-pad trail-qcard-tags">
        {(quest.tags ?? []).slice(0, 2).map((tag) => (
          <span key={tag} className="trail-pill" data-tone={toneFor(tag)}>
            {tag}
          </span>
        ))}
      </div>
      <div aria-hidden="true" />
      <div className="trail-qcard-foot">{foot ?? <span>{t.trail.notStarted}</span>}</div>
    </>
  );

  return href ? (
    <Link href={href} className="trail-qcard">
      {body}
    </Link>
  ) : (
    <article className="trail-qcard">{body}</article>
  );
}

/* --- monthly hero (§7.5) -------------------------------------------------- */

export function MonthlyHero({
  quest,
  t,
  locale,
  monthLabel,
  closesAt,
  lede,
  stickerLabel,
  primary,
  secondary,
  status,
  headingLevel = 2,
}: {
  quest: TrailQuest;
  t: Messages;
  locale: Locale;
  /** "October 2026". */
  monthLabel: string;
  /** When the slot closes; drives the countdown. */
  closesAt?: Date | string | null;
  lede?: string | null;
  /** A small photo-tone chip beside the badge ("Sticker no. 10"). */
  stickerLabel?: string | null;
  primary?: { label: string; href: string } | null;
  secondary?: { label: string; href: string } | null;
  /** Replaces the primary action once the member has filed. */
  status?: React.ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const left = closesAt ? timeLeft(new Date(closesAt)) : null;

  return (
    <article className="trail-monthly" aria-label={`${t.trail.monthly} · ${monthLabel}`}>
      <TrailPhoto src={quest.coverImage} alt={quest.title} eager />
      <div className="trail-monthly-body">
        <div className="trail-monthly-badges">
          <span className="trail-pill" data-tone="monthly">
            {t.trail.monthly} · {monthLabel}
          </span>
          {stickerLabel ? (
            <span className="trail-pill" data-tone="photo">
              {stickerLabel}
            </span>
          ) : null}
        </div>
        <Heading className="trail-monthly-title">{quest.title}</Heading>
        {lede ? <p className="trail-monthly-lede">{lede}</p> : null}
        <div className="trail-monthly-facts">
          <TrailMarks marks={quest.trailMarks} t={t} />
          <DifficultyMeter level={quest.difficulty} t={t} />
        </div>
        <div className="trail-monthly-stats">
          <div>
            <b>{formatKm(locale, quest.distance)}</b>
            <span>{t.trail.distance}</span>
          </div>
          <div>
            <b>{formatMetres(locale, quest.elevationGain)}</b>
            <span>{t.trail.ascent}</span>
          </div>
          <div>
            <b>{formatMinutes(quest.duration)}</b>
            <span>{t.trail.time}</span>
          </div>
          <div>
            <b>{quest.location}</b>
            <span>{t.trail.start}</span>
          </div>
        </div>
        {left ? (
          <p className="trail-monthly-count">
            {t.trail.endsIn}{" "}
            <b>
              {left.days} {t.trail.days} {String(left.hours).padStart(2, "0")} {t.trail.hours}
            </b>
          </p>
        ) : null}
        <div className="trail-monthly-actions">
          {status ??
            (primary ? (
              <Link className="trail-btn" data-variant="monthly" data-size="lg" href={primary.href}>
                {primary.label}
              </Link>
            ) : null)}
          {secondary ? (
            <Link className="trail-btn" data-variant="on-feature" data-size="lg" href={secondary.href}>
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function timeLeft(until: Date): { days: number; hours: number } | null {
  const ms = until.getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  return { days: Math.floor(hours / 24), hours: hours % 24 };
}

export { TrailPhoto };
