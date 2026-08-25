import Link from "next/link";

import { Avatar, IconArrowRight, IconClock, IconMarker } from "@/components/field";
import type { AdminNotice } from "@/lib/admin/notifications";
import { slotKeyLabel } from "@/lib/admin/schedule";
import type { QueueEntry } from "@/lib/admin/stats";
import { cn } from "@/lib/utils";

/**
 * The desk.
 *
 * The overview used to be a contact sheet: five stat cards, four charts, a
 * notice list and a block of quick actions, all at the same volume. Everything
 * on it was true and none of it was ranked, so the page answered "how is the
 * product doing" and never answered the only question an admin opens the panel
 * with — *what is waiting for me*.
 *
 * So this rebuild has one subject. The review queue is the hero: the list is
 * the largest thing on the page, it is the first thing under the fold of the
 * header, and every other figure here is either about that queue or is a quiet
 * number in the rail above it. The charts moved below the fold and lost their
 * grid; there is one trend and one ranking, not six panels competing.
 *
 * These are all server components. Nothing here holds state — the range toggle
 * and the ranking tabs are links that write a search param, which keeps the
 * whole page a single server render and means a chosen range survives a
 * refresh and can be linked to somebody else.
 */

/* ------------------------------------------------------------------ scope -- */

/**
 * The segmented control the trend and the ranking are both read through.
 *
 * A link per option rather than a client-side toggle. The page is already
 * `force-dynamic` and every option is a different query, so a button that set
 * React state would have to refetch anyway — this way the URL carries the
 * answer and the control needs no JavaScript at all.
 */
export function ScopeToggle({
  options,
  active,
  param,
  params,
  label,
}: {
  options: readonly { key: string; label: string }[];
  active: string;
  /** The search param this control writes. */
  param: string;
  /** Everything currently in the URL, so one control never clears the other. */
  params: Record<string, string | undefined>;
  label: string;
}) {
  return (
    <div className="scope" role="group" aria-label={label}>
      {options.map((option) => {
        const next = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && key !== param) next.set(key, value);
        }
        next.set(param, option.key);

        const current = option.key === active;
        return (
          <Link
            key={option.key}
            href={`/admin?${next.toString()}`}
            scroll={false}
            className={cn("scope-option", current && "is-on")}
            aria-current={current ? "true" : undefined}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- rail -- */

export type Figure = {
  label: string;
  value: string | number;
  /** One short clause under the number. Never a second sentence. */
  foot?: string;
  /** Turns the number to stamp ink. Only the queue's own count uses it. */
  late?: boolean;
};

/**
 * One vital, in its own box on the grid.
 *
 * These were a single ruled strip in the first cut, which read well on its own
 * and lined up with nothing: the strip divided its own width into quarters
 * while the panels below it divided the grid into sevenths and fifths, so no
 * edge below matched any edge above. Four boxes placed on the same 12-column
 * grid as everything else share their column edges by construction.
 */
export function Vital({ figure }: { figure: Figure }) {
  return (
    <div className={cn("desk-box vital", figure.late && "is-late")}>
      <p className="vital-label">{figure.label}</p>
      <div>
        <p className="vital-value">{figure.value}</p>
        {figure.foot && <p className="vital-foot">{figure.foot}</p>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- notice -- */

/**
 * The single loudest thing wrong, or nothing at all.
 *
 * The panel still derives its whole notice list on every request and the bell
 * in the sidebar still carries all of it. What changed is that the overview
 * prints only the top one: a list of six conditions above the fold trained
 * everyone to scroll past the block entirely, and a banner that is sometimes
 * absent is read every time it appears.
 */
export function TopNotice({ notice, total }: { notice: AdminNotice | null; total: number }) {
  if (!notice) {
    return (
      <p className="desk-clear">
        <span className="desk-clear-dot" aria-hidden="true" />
        Nothing needs attention. The schedule is booked and the catalogue has quests to draw from.
      </p>
    );
  }

  return (
    <Link href={notice.href} className={cn("desk-notice", `is-${notice.tone}`)}>
      <span className="desk-notice-tone" aria-hidden="true" />
      <span className="desk-notice-body">
        <b>{notice.title}</b>
        <span>{notice.detail}</span>
      </span>
      <span className="desk-notice-go">
        {notice.action}
        <IconArrowRight width={13} height={13} />
      </span>
      {total > 1 && (
        <span className="desk-notice-more">
          +{total - 1} more
          <span className="sr-only"> conditions, in the notification bell</span>
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ queue -- */

const GRADE_LABEL: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  HARD: "Hard",
  EXPERT: "Expert",
};

/**
 * How long somebody has been waiting, said in words.
 *
 * Two days is where this turns from grey to stamp ink, matching the threshold
 * the notice module already judges the queue by — the overview and the bell
 * should never disagree about what counts as late.
 */
function waitTone(days: number): "fresh" | "aging" | "late" {
  if (days >= 4) return "late";
  if (days >= 2) return "aging";
  return "fresh";
}

function waitLabel(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

/**
 * The hero: who is waiting on a verdict.
 *
 * Ordered exactly as the review page deals it, and capped — this is the front
 * of the queue, not the queue. The row is built so the two things an admin
 * triages on are the two things furthest apart: the person and the quest on
 * the left, how long they have waited on the right, with the middle carrying
 * the detail that decides whether this is a quick read or a long one.
 */
export function QueueList({ entries, pending }: { entries: QueueEntry[]; pending: number }) {
  if (entries.length === 0) {
    return (
      <div className="queue-empty">
        <p className="queue-empty-mark" aria-hidden="true">
          ✓
        </p>
        <p className="queue-empty-title">The queue is clear.</p>
        <p className="queue-empty-note">
          Every submission filed has a verdict. Nobody is waiting to hear back.
        </p>
      </div>
    );
  }

  return (
    <ul className="queue">
      {entries.map((entry) => {
        const tone = waitTone(entry.waitedDays);
        return (
          <li key={entry.id}>
            <Link href={`/admin/review#${entry.id}`} className="queue-row">
              <Avatar name={entry.name} className="queue-avatar" />

              <span className="queue-who">
                <b>{entry.name}</b>
                <span className="queue-quest">{entry.questTitle}</span>
              </span>

              <span className="queue-detail">
                {entry.period && entry.slotKey && (
                  <span className="queue-cadence">
                    {entry.period === "MONTHLY" ? "Monthly" : "Weekly"} ·{" "}
                    {slotKeyLabel(entry.period as "WEEKLY" | "MONTHLY", entry.slotKey)}
                  </span>
                )}
                <span className="queue-facts">
                  <span>
                    <IconMarker width={12} height={12} />
                    {entry.region}
                  </span>
                  <span>{GRADE_LABEL[entry.difficulty] ?? entry.difficulty}</span>
                  {entry.photos > 0 && (
                    <span>
                      {entry.photos} {entry.photos === 1 ? "photo" : "photos"}
                    </span>
                  )}
                  {entry.retreated && <span className="queue-retreat">Turned back</span>}
                </span>
              </span>

              <span className={cn("queue-wait", `is-${tone}`)}>
                <IconClock width={12} height={12} />
                {waitLabel(entry.waitedDays)}
              </span>
            </Link>
          </li>
        );
      })}

      {pending > entries.length && (
        <li className="queue-rest">
          <Link href="/admin/review">
            {pending - entries.length} more waiting
            <IconArrowRight width={13} height={13} />
          </Link>
        </li>
      )}
    </ul>
  );
}
