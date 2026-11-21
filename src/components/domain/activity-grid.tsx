import { dayHeat, type ActivityGrid as ActivityGridData } from "@/lib/activity";
import type { Locale, Messages } from "@/lib/i18n";
import { tagFor } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

/**
 * A year of days (design/DESIGN-SYSTEM.md §7.11): 12 px squares, weeks as
 * columns and weekdays as rows, on the Meadow scale.
 *
 * It scrolls inside its own box rather than shrinking, because a 53-column
 * grid squeezed into a phone gives 3 px cells that read as noise. Days before
 * the window starts are holes rather than empty squares, because "nothing
 * yet" and "not yet" are different claims.
 */

/* The heat scale: a chart palette, so it names the raw Meadow steps (§1.1). */
const HEAT = ["bg-surface-sunken", "bg-meadow-100", "bg-meadow-300", "bg-meadow-500", "bg-meadow-700"] as const;

/** Monday first, and only three rows labelled; the rest is inferred. */
function weekdayLabels(locale: Locale): string[] {
  const format = new Intl.DateTimeFormat(tagFor(locale), { weekday: "short", timeZone: "UTC" });
  // 2024-01-01 was a Monday, which is all the anchor date is for.
  return [0, 1, 2, 3, 4, 5, 6].map((offset) =>
    offset % 2 === 0 && offset < 5 ? format.format(new Date(Date.UTC(2024, 0, 1 + offset))) : "",
  );
}

export function ActivityGrid({
  grid,
  name,
  locale,
  t,
  className,
}: {
  grid: ActivityGridData;
  /** Whose year it is, for the summary line. */
  name: string;
  locale: Locale;
  t: Messages;
  className?: string;
}) {
  const when = new Intl.DateTimeFormat(tagFor(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const months = new Map(grid.months.map((month) => [month.at, month.label]));
  const summary = grid.days === 0 ? t.profile.yearEmpty(name) : t.profile.yearSummary(name, grid.days, grid.best);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex w-max gap-2 pt-5">
          <div className="flex flex-col gap-0.5" aria-hidden="true">
            {weekdayLabels(locale).map((day, index) => (
              <span key={index} className="h-3 text-overline font-normal normal-case leading-3 tracking-normal text-subtle">
                {day}
              </span>
            ))}
          </div>

          <div role="img" aria-label={summary} className="flex gap-0.5">
            {grid.weeks.map((week, index) => (
              <div key={index} className="relative flex flex-col gap-0.5">
                {months.has(index) ? (
                  <span
                    className="absolute -top-5 left-0 whitespace-nowrap text-overline font-normal normal-case tracking-normal text-subtle"
                    aria-hidden="true"
                  >
                    {months.get(index)}
                  </span>
                ) : null}
                {week.map((cell) =>
                  cell.day === null ? (
                    <span key={cell.key} className="size-3" />
                  ) : (
                    <span
                      key={cell.key}
                      className={cn("size-3 rounded-xs", HEAT[dayHeat(cell.count)])}
                      title={t.profile.dayTooltip(when.format(cell.day), cell.count)}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-muted">
        <span>{summary}</span>
        <span className="flex items-center gap-1" aria-hidden="true">
          {t.profile.less}
          {HEAT.map((step) => (
            <i key={step} className={cn("size-3 rounded-xs", step)} />
          ))}
          {t.profile.more}
        </span>
      </div>
    </div>
  );
}
