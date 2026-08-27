import Link from "next/link";

import { SqSpark, SqStatusRibbon } from "@/components/sq/charts";
import {
  STATUS_COLOUR,
  STATUS_LABEL,
  type SystemReading,
  type SystemsPulse,
} from "@/lib/admin/systems";

/**
 * The board, and the two one-liners that stand in for it.
 *
 * `SqSystemTile` is the full thing and lives only on `/admin/systems`, where
 * there is room for ten of them. The dashboard and the rail get a dot and a
 * sentence instead — the question worth answering everywhere is "is anything
 * broken", and that does not need a grid.
 *
 * Every tile carries its recent history as a smoothed curve where there is a
 * duration to draw, and a run of status blocks where there is not: "is it up"
 * and "how fast is it" are two questions, and stacking them on one axis would
 * answer neither.
 */

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function SqSystemTile({ system }: { system: SystemReading }) {
  const colour = STATUS_COLOUR[system.status];
  const timed = system.history.some((point) => point.value !== null && point.value > 0);

  return (
    <Link
      href={`/admin/systems/${system.id}`}
      className="sq-system"
      style={{ ["--status" as string]: colour }}
    >
      <div className="sq-system-head">
        <span className="sq-status-dot" data-status={system.status} />
        <b className="sq-system-name">{system.label}</b>
        <span className="sq-system-state">{STATUS_LABEL[system.status]}</span>
      </div>

      <p className="sq-system-detail">{system.detail}</p>

      {timed ? (
        <SqSpark
          id={sparkId(system.id)}
          points={system.history.map((point) => ({ value: point.value }))}
          colour={colour}
          height={40}
        />
      ) : (
        <SqStatusRibbon
          buckets={system.history.map((point) => ({
            colour: STATUS_COLOUR[point.status],
            title: `${TIME.format(point.at)} · ${STATUS_LABEL[point.status]}`,
          }))}
          height={14}
        />
      )}

      <div className="sq-system-foot">
        <span>{system.latencyMs === null ? "—" : `${system.latencyMs} ms`}</span>
        <span>24h</span>
      </div>
    </Link>
  );
}

/**
 * The whole board in one sentence.
 *
 * Worst-of rather than an average: nine systems up and one down is not "90%
 * up", it is an outage, and a headline that rounded it away would be the
 * headline nobody trusts.
 */
function headlineFor(pulse: SystemsPulse): string {
  if (pulse.status === "off") return "Nothing wired up";
  if (pulse.down > 0) return `${pulse.down} system${pulse.down === 1 ? "" : "s"} down`;
  if (pulse.degraded > 0) return `${pulse.degraded} degraded`;
  return "Everything is running";
}

/**
 * The strip at the foot of the panel's rail.
 *
 * This is the whole reason the board does not need to be on the dashboard: the
 * one question worth having permanently on screen is "is anything broken", and
 * that is a dot and four words. Everything else — which system, how slow, what
 * the log says — is a click away and belongs on a page that has room for it.
 *
 * It sits in the rail rather than on a page so it is true on every panel
 * screen, not only on the one somebody happens to have open.
 */
export function SqSystemsPulse({ pulse }: { pulse: SystemsPulse }) {
  return (
    <Link
      href="/admin/systems"
      className="sq-side-status"
      style={{ ["--status" as string]: STATUS_COLOUR[pulse.status] }}
    >
      <span className="sq-status-dot" data-status={pulse.status} />
      <span className="sq-side-status-text">
        <b>{headlineFor(pulse)}</b>
        <span>
          {pulse.up}/{pulse.total} up
          {pulse.off > 0 ? ` · ${pulse.off} off` : ""}
        </span>
      </span>
    </Link>
  );
}

/**
 * The dashboard's version: one row, no tiles.
 *
 * The overview is about the queue and the figures. Ten tiles of infrastructure
 * at the top of it pushed all of that below the fold to answer a question that
 * is almost always "yes" — so the dashboard states the answer and links on.
 */
export function SqSystemsLine({ pulse, href }: { pulse: SystemsPulse; href?: string }) {
  const inside = (
    <>
      <span className="sq-status-dot" data-status={pulse.status} />
      <b style={{ fontSize: 14, fontWeight: 600 }}>{headlineFor(pulse)}</b>
      <span className="sq-mono" style={{ fontSize: 11.5, color: "var(--ink-3)", flex: 1 }}>
        {pulse.up} of {pulse.total} up
        {pulse.degraded > 0 ? ` · ${pulse.degraded} degraded` : ""}
        {pulse.down > 0 ? ` · ${pulse.down} down` : ""}
        {pulse.off > 0 ? ` · ${pulse.off} not wired up` : ""}
      </span>
      {href ? <span className="sq-system-line-go">Systems &rarr;</span> : null}
    </>
  );

  const style = { ["--status" as string]: STATUS_COLOUR[pulse.status] };

  // On the systems page itself there is nowhere to go, so it is a heading
  // rather than a link — an arrow pointing at the page you are already on is
  // the kind of small dishonesty that makes people stop trusting the arrows.
  return href ? (
    <Link href={href} className="sq-system-line" style={style}>
      {inside}
    </Link>
  ) : (
    <div className="sq-system-line" style={style}>
      {inside}
    </div>
  );
}

/**
 * SVG gradient ids have to be unique on the page and valid as a fragment
 * reference, and system ids contain dots (`job.quest-drop`). A dot in a
 * `url(#…)` is legal but a selector's worth of trouble; swapping it for a
 * hyphen keeps every id one word.
 */
export function sparkId(systemId: string): string {
  return systemId.replace(/\./g, "-");
}
