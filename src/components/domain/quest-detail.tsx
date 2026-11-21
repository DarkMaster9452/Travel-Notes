import type { ReactNode } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import type { Locale, Messages } from "@/lib/i18n";
import { formatDistance, formatHeight, type Units } from "@/lib/i18n/units";
import { scoreBreakdown, type ScoredEntry } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

/**
 * The blocks a quest's own page is made of (design/DESIGN-SYSTEM.md §12,
 * "detail 8 / 4"): the brief, how it scores, the approach, and what others
 * said about the ground. The monthly page and a quest's page share them.
 */

/** A label on the left, a sentence on the right, hairlines between. */
export function BriefCard({
  title,
  lede,
  lines,
  foot,
}: {
  title: string;
  lede?: string | null;
  lines: { label: string; text: ReactNode; tone?: "danger" }[];
  foot?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      {lede ? <p className="max-w-text text-body text-muted text-pretty">{lede}</p> : null}
      {lines.length > 0 ? (
        <dl className={cn("divide-y divide-border", lede && "mt-4")}>
          {lines.map((line) => (
            <div key={line.label} className="flex flex-col gap-1 py-3 last:pb-0 sm:flex-row sm:gap-4">
              <dt
                className={cn(
                  "shrink-0 text-overline font-semibold uppercase sm:w-28 sm:pt-1",
                  line.tone === "danger" ? "text-danger" : "text-subtle",
                )}
              >
                {line.label}
              </dt>
              <dd className="min-w-0 text-body-sm text-text">{line.text}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {foot ? <p className="mt-4 text-caption text-subtle">{foot}</p> : null}
    </Card>
  );
}

/**
 * How a quest scores, itemised from the same arithmetic the board uses
 * (`scoreBreakdown`), and worded in the reader's language and units.
 */
export function ScoreCard({
  entry,
  t,
  locale,
  units,
}: {
  entry: ScoredEntry;
  t: Messages;
  locale: Locale;
  units?: Units;
}) {
  const { lines, total } = scoreBreakdown(entry);
  const words = t.app.quest.score;

  const label = (kind: (typeof lines)[number]["kind"]) => {
    if (kind === "grade") return words.grade(t.trail.difficulty[entry.difficulty]);
    if (kind === "distance") return words.distance(formatDistance(locale, entry.distance, units));
    if (kind === "ascent") return words.ascent(formatHeight(locale, entry.elevationGain, units));
    if (kind === "bonus") return entry.featuredPeriod === "MONTHLY" ? words.monthlyBonus : words.weeklyBonus;
    return words.retreat;
  };

  return (
    <Card>
      <CardHeader title={t.monthly.howItScores} />
      <dl className="divide-y divide-border">
        {lines.map((line) => (
          <div key={line.kind} className="flex items-baseline justify-between gap-4 py-2 first:pt-0">
            <dt className={cn("text-body-sm", line.muted ? "text-subtle" : "text-muted")}>{label(line.kind)}</dt>
            <dd className="text-body-sm font-semibold tabular-nums">
              {line.points >= 0 ? `+${line.points}` : line.points}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 pt-3">
          <dt className="text-body-sm font-semibold text-text">{t.monthly.ifApproved}</dt>
          <dd className="font-display text-h3 font-bold tabular-nums text-primary">{words.points(total)}</dd>
        </div>
      </dl>
    </Card>
  );
}

/** The way in, in stages: where to leave the car, where the route starts, the destination. */
export function ApproachCard({
  title,
  legs,
}: {
  title: string;
  legs: { at: string; place: string; what: string; up?: string }[];
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <ol className="divide-y divide-border">
        {legs.map((leg) => (
          <li key={leg.place} className="flex items-baseline gap-4 py-3 first:pt-0 last:pb-0">
            <span className="w-16 shrink-0 text-caption tabular-nums text-subtle">{leg.at}</span>
            <span className="min-w-0 flex-1">
              <b className="block text-body-sm font-semibold text-text">{leg.place}</b>
              <span className="text-caption text-muted">{leg.what}</span>
            </span>
            {leg.up ? <span className="shrink-0 text-caption tabular-nums text-muted">{leg.up}</span> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** What other people who walked it wrote, newest first. */
export function ConditionsCard({
  title,
  empty,
  entries,
}: {
  title: string;
  empty: string;
  entries: { when: string; note: string }[];
}) {
  return (
    <Card>
      <CardHeader title={title} />
      {entries.length === 0 ? (
        <p className="text-body-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((entry, index) => (
            <li key={index} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
              <span className="text-caption tabular-nums text-subtle">{entry.when}</span>
              <span className="text-body-sm text-text">{entry.note}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** The first couple of sentences, so a long account does not run a panel over. */
export function trimNote(note: string, max = 180): string {
  if (note.length <= max) return note;
  return `${note.slice(0, max - 2).trimEnd()}…`;
}
