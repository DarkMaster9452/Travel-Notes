import { Car } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { TrailPhoto } from "@/components/domain/trail-photo";
import { Badge, tagTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { type } from "@/components/ui/typography";
import type { Locale, Messages } from "@/lib/i18n";
import { formatDistance, formatHeight, formatMinutes, type Units } from "@/lib/i18n/units";
import { TRAIL_MARK_COLOR, TRAIL_MARKS_SHOWN, trailMarksOf, type TrailMark } from "@/lib/trail-marks";
import { cn } from "@/lib/utils";

/**
 * The Trail domain components (design/DESIGN-SYSTEM.md §1.5, §7.4, §7.5):
 * trail marks, the difficulty meter, the quest card and the monthly hero.
 *
 * Deliberately not client components: they hold no state, so the server
 * pages render them directly and a client component can render them too.
 * Words come in through `t`, figures through `locale` and `units`.
 */

export type Difficulty = "EASY" | "MODERATE" | "HARD" | "EXPERT";

/** Where the component sits: on a normal surface, or on the Sun feature panel. */
type Ground = "surface" | "feature";

const PEAKS: Record<Difficulty, { on: number; ink: string }> = {
  EASY: { on: 1, ink: "var(--color-diff-easy)" },
  MODERATE: { on: 2, ink: "var(--color-diff-moderate)" },
  HARD: { on: 3, ink: "var(--color-diff-hard)" },
  EXPERT: { on: 4, ink: "var(--color-diff-expert)" },
};

/* --- trail marks ---------------------------------------------------------- */

function Mark({ mark, ground }: { mark: TrailMark; ground: Ground }) {
  // The outline keeps the white stripes visible on a white card, and darkens
  // on the Sun panel for the same reason.
  const edge = ground === "feature" ? "ring-feature-fg/35" : "ring-border-strong";

  if (mark === "EDUCATIONAL") {
    return (
      <span
        className={cn("relative inline-block size-4 shrink-0 overflow-hidden rounded-xs bg-mark-white ring-1", edge)}
        aria-hidden="true"
      >
        <i className="absolute -left-1 top-1.5 h-1 w-6 -rotate-45 bg-mark-green" />
      </span>
    );
  }
  return (
    <span
      className={cn("inline-grid h-4 w-6 shrink-0 grid-rows-3 overflow-hidden rounded-xs bg-mark-white ring-1", edge)}
      style={{ ["--mark" as string]: TRAIL_MARK_COLOR[mark] }}
      aria-hidden="true"
    >
      <i />
      <i className="bg-(--mark)" />
      <i />
    </span>
  );
}

/** The marks in walking order, drawn and spelled out ("Red → Blue"). */
export function TrailMarks({
  marks,
  t,
  ground = "surface",
  className,
}: {
  marks: readonly string[] | null | undefined;
  t: Messages;
  ground?: Ground;
  className?: string;
}) {
  const known = trailMarksOf(marks);
  const quiet = ground === "feature" ? "text-feature-fg/70" : "text-subtle";

  if (known.length === 0) {
    return <span className={cn("inline-flex min-w-0 text-body-sm font-medium", quiet, className)}>{t.trail.noMarks}</span>;
  }

  const shown = known.slice(0, TRAIL_MARKS_SHOWN);
  const rest = known.length - shown.length;

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 text-body-sm font-medium", className)}>
      <span className="inline-flex shrink-0 items-center gap-1">
        {shown.map((mark, index) => (
          <span key={`${mark}-${index}`} className="contents">
            {index > 0 ? (
              <span className={cn("text-caption", quiet)} aria-hidden="true">
                →
              </span>
            ) : null}
            <Mark mark={mark} ground={ground} />
          </span>
        ))}
        {rest > 0 ? <span className={cn("text-caption", quiet)}>+{rest}</span> : null}
      </span>
      <span className="min-w-0 truncate">{known.map((mark) => t.trail.marks[mark]).join(" → ")}</span>
    </span>
  );
}

/* --- difficulty ----------------------------------------------------------- */

/** Four peaks, as many filled as the grade; the word beside it in text ink. */
export function DifficultyMeter({
  level,
  t,
  ground = "surface",
  className,
}: {
  level: Difficulty;
  t: Messages;
  ground?: Ground;
  className?: string;
}) {
  const peaks = PEAKS[level];
  const empty = ground === "feature" ? "stroke-feature-fg/35" : "stroke-border-strong";
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-body-sm font-medium", className)}>
      <span className="inline-flex gap-0.5" style={{ ["--peak" as string]: peaks.ink }} aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <svg key={index} viewBox="0 0 14 12" className="h-3 w-3.5">
            <path
              d="M7 1 13 11H1z"
              className={index < peaks.on ? "fill-(--peak) stroke-(--peak)" : cn("fill-none", empty)}
            />
          </svg>
        ))}
      </span>
      {t.trail.difficulty[level]}
    </span>
  );
}

/* --- quest facts ---------------------------------------------------------- */

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
    tags: (quest.features ?? []).map((tag) => tagLabel(tag, t)),
  };
}

/** A category tag in the reader's language; an unknown tag prints as written. */
export function tagLabel(tag: string, t: Messages): string {
  return t.trail.tags[tag] ?? tag.replace(/_/g, " ");
}

/** Distance · ascent · time: the three figures every quest shows, always in this order. */
export function QuestFigures({
  quest,
  t,
  locale,
  units,
  className,
}: {
  quest: Pick<TrailQuest, "distance" | "elevationGain" | "duration">;
  t: Messages;
  locale: Locale;
  units?: Units;
  className?: string;
}) {
  const figures = [
    { value: formatDistance(locale, quest.distance, units), label: t.trail.distance },
    { value: formatHeight(locale, quest.elevationGain, units), label: t.trail.ascent },
    { value: formatMinutes(quest.duration), label: t.trail.time },
  ];
  return (
    <dl className={cn("grid grid-cols-3 divide-x divide-border rounded-control bg-surface-sunken", className)}>
      {figures.map((figure) => (
        <div key={figure.label} className="flex min-w-0 flex-col-reverse px-3 py-2">
          <dt className="text-caption text-muted">{figure.label}</dt>
          <dd className="whitespace-nowrap text-body font-semibold tabular-nums">{figure.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* --- quest card (§7.4) ---------------------------------------------------- */

/**
 * Quest grid: 1 · 2 · 3 columns. Cards share their rows through `subgrid`, so
 * the marks, title, figures and footer line up across a row whatever the
 * length of a title. The row gap lives on the card's margin, not on the grid:
 * a grid gap would be added between every one of a card's nine rows.
 */
export function QuestGrid({ children, className }: { children: ReactNode; className?: string }) {
  // Columns follow the width of the column the grid sits in (a container
  // query), not the viewport: the same grid is three across on the landing
  // page, two beside the app's rail and one on a phone.
  return (
    <div className={cn("@container", className)}>
      <div className="grid grid-cols-1 gap-x-4 @2xl:grid-cols-2 @4xl:grid-cols-3 @4xl:gap-x-6">{children}</div>
    </div>
  );
}

export function QuestCard({
  quest,
  t,
  locale,
  units,
  href,
  period,
  badge,
  foot,
}: {
  quest: TrailQuest;
  t: Messages;
  locale: Locale;
  units?: Units;
  href?: string;
  /** Weekly quests carry the sky badge; the monthly never appears as a card. */
  period?: "WEEKLY" | null;
  /** A second chip on the photo ("Yours", "Done"). */
  badge?: ReactNode;
  /** The status pill or action in the footer. */
  foot?: ReactNode;
}) {
  const shell =
    "row-span-9 mb-4 grid min-w-0 grid-rows-subgrid gap-y-0 rounded-card border border-border bg-surface text-text no-underline lg:mb-6";

  const body = (
    <>
      <div className="p-2 pb-0">
        <div className="relative">
          <TrailPhoto src={quest.coverImage} alt="" className="aspect-4/3 rounded-control" />
          {period === "WEEKLY" || badge ? (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {period === "WEEKLY" ? <Badge tone="weekly">{t.trail.weekly}</Badge> : null}
              {badge}
            </div>
          ) : null}
        </div>
      </div>
      <div className="px-4 pt-3">
        <TrailMarks marks={quest.trailMarks} t={t} className="max-w-full" />
      </div>
      <h3 className={cn(type.h4, "line-clamp-2 px-4 pt-2 text-balance")}>{quest.title}</h3>
      <p className="px-4 pt-1 text-caption text-muted">
        {quest.region} · {t.trail.start} {quest.location}
      </p>
      <div className="px-4 pt-3">
        <QuestFigures quest={quest} t={t} locale={locale} units={units} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <DifficultyMeter level={quest.difficulty} t={t} />
        {quest.travelTime ? (
          <span className="inline-flex items-center gap-1 text-caption tabular-nums text-muted">
            <Car className="size-4" aria-hidden="true" />
            <span className="sr-only">{t.trail.travel}</span>
            {formatMinutes(quest.travelTime)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap content-start gap-1 px-4 pt-3">
        {(quest.tags ?? []).slice(0, 2).map((tag) => (
          <Badge key={tag} tone={tagTone(tag)}>
            {tag}
          </Badge>
        ))}
      </div>
      <div aria-hidden="true" />
      <div className="mt-4 flex min-h-12 items-center justify-between gap-3 border-t border-border px-4 py-2 text-caption text-muted">
        {foot ?? <span>{t.trail.notStarted}</span>}
      </div>
    </>
  );

  return href ? (
    <Link
      href={href}
      className={cn(
        shell,
        "transition duration-fast ease-standard hover:border-border-strong hover:shadow-1",
      )}
    >
      {body}
    </Link>
  ) : (
    <article className={shell}>{body}</article>
  );
}

/* --- the feature panel ---------------------------------------------------- */

/**
 * The Sun panel (§7.5): the one flat yellow block. It belongs to the monthly
 * quest — its hero, its empty state and the landing's closing call to join it.
 */
export function FeaturePanel({
  as: Tag = "section",
  className,
  children,
  ...props
}: {
  as?: "section" | "article" | "div";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Tag className={cn("rounded-dialog bg-feature p-6 text-feature-fg lg:p-10", className)} {...props}>
      {children}
    </Tag>
  );
}

/* --- monthly hero (§7.5) -------------------------------------------------- */

export function MonthlyHero({
  quest,
  t,
  locale,
  units,
  monthLabel,
  closesAt,
  lede,
  stickerLabel,
  primary,
  secondary,
  status,
  headingLevel = 2,
  className,
}: {
  quest: TrailQuest;
  t: Messages;
  locale: Locale;
  units?: Units;
  /** "October 2026". */
  monthLabel: string;
  /** When the slot closes; drives the countdown. */
  closesAt?: Date | string | null;
  lede?: string | null;
  /** A small chip beside the badge ("Sticker no. 10"). */
  stickerLabel?: string | null;
  primary?: { label: string; href: string } | null;
  secondary?: { label: string; href: string } | null;
  /** Replaces the primary action once the member has filed. */
  status?: ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const left = closesAt ? timeLeft(new Date(closesAt)) : null;

  const tiles = [
    { value: formatDistance(locale, quest.distance, units), label: t.trail.distance },
    { value: formatHeight(locale, quest.elevationGain, units), label: t.trail.ascent },
    { value: formatMinutes(quest.duration), label: t.trail.time },
    // A place name is a phrase, not a figure: it gets the whole row so it
    // never has to break inside a word.
    { value: quest.location, label: t.trail.start, wide: true },
  ];

  return (
    <FeaturePanel as="article" aria-label={`${t.trail.monthly} · ${monthLabel}`} className={cn("@container", className)}>
      {/* 7 / 5 once the panel itself is wide enough, whatever the viewport:
          beside the app's rail the photo goes on top, as on a phone. */}
      <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-12 @3xl:items-center @3xl:gap-10">
      <TrailPhoto
        src={quest.coverImage}
        alt=""
        eager
        tone="feature"
        className="aspect-4/3 rounded-card @lg:aspect-2/1 @3xl:col-span-7 @3xl:aspect-4/3"
      />
      <div className="flex min-w-0 flex-col gap-4 @3xl:col-span-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="monthly">
            {t.trail.monthly} · {monthLabel}
          </Badge>
          {stickerLabel ? <Badge tone="onFeature">{stickerLabel}</Badge> : null}
        </div>
        <Heading className={cn(type.display, "font-extrabold")}>{quest.title}</Heading>
        {lede ? <p className="max-w-text text-body">{lede}</p> : null}
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          <TrailMarks marks={quest.trailMarks} t={t} ground="feature" />
          <DifficultyMeter level={quest.difficulty} t={t} ground="feature" />
        </div>
        <dl className="grid grid-cols-3 gap-2">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className={cn(
                "flex min-w-0 flex-col-reverse rounded-control bg-feature-soft px-3 py-2",
                tile.wide && "col-span-full",
              )}
            >
              <dt className="text-caption">{tile.label}</dt>
              <dd className="text-h4 font-bold tabular-nums wrap-break-word">{tile.value}</dd>
            </div>
          ))}
        </dl>
        {left ? (
          <p className="flex flex-wrap items-baseline gap-2 text-body-sm font-medium">
            {t.trail.endsIn}
            <b className="font-display text-h3 font-bold tabular-nums">
              {left.days} {t.trail.days} {String(left.hours).padStart(2, "0")} {t.trail.hours}
            </b>
          </p>
        ) : null}
        {status || primary || secondary ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {status ??
              (primary ? (
                <ButtonLink href={primary.href} variant="monthly" size="lg">
                  {primary.label}
                </ButtonLink>
              ) : null)}
            {secondary ? (
              <ButtonLink href={secondary.href} variant="onFeature" size="lg">
                {secondary.label}
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </div>
      </div>
    </FeaturePanel>
  );
}

/** The same panel when no monthly quest is open: words only, one way out. */
export function MonthlyEmpty({
  t,
  title,
  body,
  action,
  headingLevel = 2,
}: {
  t: Messages;
  title?: string;
  body?: string;
  action?: { label: string; href: string } | null;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <FeaturePanel className="flex flex-col items-start gap-4">
      <Badge tone="monthly">{t.trail.monthly}</Badge>
      <Heading className={cn(type.display, "font-extrabold")}>{title ?? t.trail.noMonthly}</Heading>
      <p className="max-w-text text-body">{body ?? t.trail.noMonthlyBody}</p>
      {action ? (
        <ButtonLink href={action.href} variant="onFeature" size="lg">
          {action.label}
        </ButtonLink>
      ) : null}
    </FeaturePanel>
  );
}

function timeLeft(until: Date): { days: number; hours: number } | null {
  const ms = until.getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  return { days: Math.floor(hours / 24), hours: hours % 24 };
}

export { TrailPhoto };
