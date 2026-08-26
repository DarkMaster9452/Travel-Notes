import Link from "next/link";

import { SqSpark, SqStatusRibbon } from "@/components/sq/charts";
import {
  STATUS_COLOUR,
  STATUS_LABEL,
  worstOf,
  type SystemReading,
  type SystemStatus,
} from "@/lib/admin/systems";

/**
 * The board.
 *
 * One tile per system, colour-signalled down its leading edge, each one a link
 * into that system's own page. Shared by the dashboard — which shows the board
 * and nothing else about it — and by `/admin/systems`, which shows it grouped
 * with the readings spelled out.
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
 * The one-line verdict over the whole board.
 *
 * Worst-of rather than an average: nine systems up and one down is not "90%
 * up", it is an outage, and a headline that rounded it away would be the
 * headline nobody trusts. `off` counts as neither — an unwired integration is
 * not a fault, so it never drags the summary red.
 */
export function SqSystemsSummary({ systems }: { systems: SystemReading[] }) {
  const overall = worstOf(systems.map((system) => system.status));
  const counted: Record<SystemStatus, number> = { ok: 0, degraded: 0, down: 0, off: 0 };
  for (const system of systems) counted[system.status] += 1;

  const headline =
    counted.down > 0
      ? `${counted.down} system${counted.down === 1 ? "" : "s"} down`
      : counted.degraded > 0
        ? `${counted.degraded} degraded`
        : "Everything is up";

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 9, ["--status" as string]: STATUS_COLOUR[overall] }}
    >
      <span className="sq-status-dot" data-status={overall} />
      <b style={{ fontSize: 13.5, fontWeight: 600 }}>{headline}</b>
      <span className="sq-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
        {counted.ok} up
        {counted.off > 0 ? ` · ${counted.off} not wired up` : ""}
      </span>
    </span>
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
