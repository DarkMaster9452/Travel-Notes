import type { CSSProperties } from "react";

import { dayHeat, type ActivityGrid } from "@/lib/activity";
import type { AccentInk } from "@/lib/accents";
import type { Locale, Messages } from "@/lib/i18n";
import { tagFor } from "@/lib/i18n/format";

/**
 * Monday first, and only three rows labelled — the rest is inferred.
 *
 * Taken from `Intl` rather than written out, so Slovak reads Po/St/Pi and
 * German Mo/Mi/Fr without three more dictionary keys. 2024-01-01 was a Monday,
 * which is all the anchor date is for.
 */
function weekdayLabels(locale: Locale): string[] {
  const format = new Intl.DateTimeFormat(tagFor(locale), { weekday: "short", timeZone: "UTC" });
  return [0, 1, 2, 3, 4, 5, 6].map((offset) =>
    offset % 2 === 0 && offset < 5
      ? format.format(new Date(Date.UTC(2024, 0, 1 + offset)))
      : "",
  );
}

/**
 * A year of days, in the shape everybody already knows how to read.
 *
 * Columns are weeks, rows are weekdays, and the ink is the profile's own
 * accent rather than a fixed green — two people's years should not look like
 * the same person's.
 *
 * Three things it does deliberately differently from the month strip it
 * replaced. It staggers by *column*, because 371 cells at the strip's 26ms
 * step would take nine and a half seconds to draw. It scrolls inside its own
 * box rather than shrinking, because a 53-column grid squeezed into a phone
 * gives 3px cells that read as noise. And the days after today are rendered as
 * holes rather than as empty squares, because "nothing yet" and "not yet" are
 * different claims.
 */
export function SqActivityGrid({
  grid,
  accent,
  name,
  locale,
  t,
}: {
  grid: ActivityGrid;
  accent: AccentInk;
  /** Whose year it is, for the summary line. */
  name: string;
  locale: Locale;
  t: Messages;
}) {
  const when = new Intl.DateTimeFormat(tagFor(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <div
      className="sq-year-wrap"
      style={
        { "--ink": accent.ink, "--wash": accent.wash, "--edge": accent.edge } as CSSProperties
      }
    >
      <div className="sq-year-scroll">
        <div className="sq-year-months" aria-hidden>
          {grid.months.map((month) => (
            <span key={`${month.at}-${month.label}`} style={{ gridColumn: month.at + 1 }}>
              {month.label}
            </span>
          ))}
        </div>

        <div className="sq-year-body">
          <div className="sq-year-days" aria-hidden>
            {weekdayLabels(locale).map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>

          <div className="sq-year-grid" role="img" aria-label={summary(grid, name, t)}>
            {grid.weeks.map((week, index) => (
              <div key={index} className="sq-year-week" style={{ ["--i" as string]: index }}>
                {week.map((cell) =>
                  cell.day === null ? (
                    <span key={cell.key} className="sq-day-cell" data-void="1" />
                  ) : (
                    <span
                      key={cell.key}
                      className="sq-day-cell"
                      data-heat={dayHeat(cell.count)}
                      title={t.profile.dayTooltip(when.format(cell.day), cell.count)}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sq-year-foot">
        <span>{summary(grid, name, t)}</span>
        <span className="sq-year-key" aria-hidden>
          {t.profile.less}
          {[0, 1, 2, 3, 4].map((step) => (
            <i key={step} className="sq-day-cell" data-heat={step} />
          ))}
          {t.profile.more}
        </span>
      </div>
    </div>
  );
}

function summary(grid: ActivityGrid, name: string, t: Messages): string {
  if (grid.days === 0) return t.profile.yearEmpty(name);
  return t.profile.yearSummary(name, grid.days, grid.best);
}
