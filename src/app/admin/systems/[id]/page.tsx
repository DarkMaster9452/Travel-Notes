import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SqSpark, SqStatusRibbon } from "@/components/sq/charts";
import { SqSegmentedLinks } from "@/components/sq/controls";
import { sparkId } from "@/components/sq/systems";
import { EmptyState, PageHeader, Tag } from "@/components/sq/ui";
import {
  findSystem,
  getHistories,
  getSystemFacts,
  getSystemLog,
  getSystemSummary,
  GROUP_LABEL,
  probeOne,
  STATUS_COLOUR,
  STATUS_LABEL,
  SYSTEMS,
  type Fact,
} from "@/lib/admin/systems";
import { requireRank } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const system = findSystem((await params).id);
  return { title: `${system?.label ?? "System"} · Admin` };
}

/** The three windows the graph can be read over, and how finely each is cut. */
const WINDOWS = {
  "24h": { hours: 24, buckets: 24, label: "24 hours", bucket: "an hour" },
  "7d": { hours: 24 * 7, buckets: 42, label: "7 days", bucket: "four hours" },
  "30d": { hours: 24 * 30, buckets: 60, label: "30 days", bucket: "twelve hours" },
} as const;

type WindowKey = keyof typeof WINDOWS;

const STAMP = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const SHORT = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit" });

/**
 * One system, in as much detail as we honestly have.
 *
 * Three things, in this order: what it is doing right now, what it has been
 * doing over the window, and the log. The log is last because it is the thing
 * you read once the first two have told you where to look, and it is filtered
 * to faults by default — a probe on every page load means the happy path is
 * thousands of identical lines saying "answering".
 *
 * The system is probed again here, so this page is never showing a status
 * older than the moment it rendered.
 */
export default async function AdminSystemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ window?: string; show?: string }>;
}) {
  await requireRank("ADMIN");

  const { id } = await params;
  const query = await searchParams;
  const system = findSystem(id);
  if (!system) notFound();

  const windowKey: WindowKey = isWindow(query.window) ? query.window : "24h";
  const window = WINDOWS[windowKey];
  const onlyFaults = query.show !== "all";

  const [reading, histories, summary, log, facts] = await Promise.all([
    // Through the registry's own wrapper, so a system that is down renders
    // this page rather than throwing it away — and so this load contributes a
    // reading to the history like any other.
    probeOne(system),
    getHistories([system.id], window.hours, window.buckets),
    getSystemSummary(system.id, window.hours),
    getSystemLog(system.id, { limit: 80, onlyFaults }),
    getSystemFacts(system.id),
  ]);

  const history = histories.get(system.id) ?? [];
  const colour = STATUS_COLOUR[reading.status];
  const timed = history.some((point) => point.value !== null && point.value > 0);
  const others = SYSTEMS.filter((entry) => entry.id !== system.id);

  return (
    <>
      <PageHeader
        kicker={GROUP_LABEL[system.group]}
        title={system.label}
        lede={system.what}
        right={
          <Link href="/admin/systems" className="sq-btn sq-btn-ghost">
            All systems
          </Link>
        }
      />

      {/* Right now */}
      <section
        className="sq-slab"
        style={{ padding: "24px 26px", ["--status" as string]: colour, marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <span className="sq-status-dot" data-status={reading.status} />
          <b
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 30,
              lineHeight: 1,
              color: reading.status === "off" ? "var(--forest-ink-3)" : colour,
            }}
          >
            {STATUS_LABEL[reading.status]}
          </b>
          {reading.latencyMs !== null ? (
            <span className="sq-mono" style={{ fontSize: 13, color: "var(--forest-ink-3)" }}>
              {reading.latencyMs} ms
            </span>
          ) : null}
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--forest-ink)", maxWidth: 640 }}>
          {reading.detail}
        </p>
        {system.measures ? (
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--forest-ink-3)" }}>
            The duration measures: {system.measures.toLowerCase()}.
          </p>
        ) : null}
      </section>

      {/* Over the window */}
      <section className="sq-card sq-pad" style={{ marginBottom: 16 }}>
        <div className="sq-section-head" style={{ marginBottom: 20 }}>
          <h2 className="sq-h2" style={{ fontSize: 20 }}>
            The last {window.label}
          </h2>
          <SqSegmentedLinks
            label="Window"
            active={windowKey}
            options={(Object.keys(WINDOWS) as WindowKey[]).map((key) => ({
              key,
              label: key,
              href: `/admin/systems/${system.id}?window=${key}${onlyFaults ? "" : "&show=all"}`,
            }))}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Figure
            label="Clean readings"
            value={summary.uptime === null ? "—" : `${(summary.uptime * 100).toFixed(1)}%`}
            tint={summary.uptime !== null && summary.uptime < 0.99 ? colour : undefined}
          />
          <Figure label="Checks" value={summary.checks.toLocaleString("en-GB")} />
          <Figure
            label="Faults"
            value={summary.faults.toLocaleString("en-GB")}
            tint={summary.faults > 0 ? "var(--signal)" : undefined}
          />
          <Figure label="Median" value={summary.medianMs === null ? "—" : `${summary.medianMs} ms`} />
          <Figure label="Slowest" value={summary.slowestMs === null ? "—" : `${summary.slowestMs} ms`} />
        </div>

        {timed ? (
          <>
            <SqSpark
              id={`${sparkId(system.id)}-detail`}
              points={history.map((point) => ({ value: point.value }))}
              colour={colour}
              height={140}
            />
            <p style={{ margin: "10px 0 18px", fontSize: 11.5, color: "var(--ink-3)" }}>
              Mean duration per {window.bucket}. A break in the line is a stretch nobody probed — the
              board is only checked when somebody loads it, so a quiet night leaves a gap rather than a
              zero.
            </p>
          </>
        ) : (
          <p style={{ marginBottom: 16, fontSize: 12.5, color: "var(--ink-3)" }}>
            Nothing here is timed — this system is read from what is in the database rather than by
            calling out to anything, so there is no round trip to draw. The ribbon below is its status,
            per {window.bucket}.
          </p>
        )}

        <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
          Status, per {window.bucket}
        </span>
        <SqStatusRibbon
          buckets={history.map((point) => ({
            colour: STATUS_COLOUR[point.status],
            title: `${SHORT.format(point.at)} · ${STATUS_LABEL[point.status]}`,
          }))}
          height={12}
        />
        <div
          className="sq-mono"
          style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: "var(--ink-3)" }}
        >
          <span>{history.length > 0 ? SHORT.format(history[0].at) : ""}</span>
          <span>{history.length > 0 ? SHORT.format(history[history.length - 1].at) : ""}</span>
        </div>
      </section>

      {/* Everything else worth knowing */}
      {facts.length > 0 ? (
        <section className="sq-card sq-pad" style={{ marginBottom: 16 }}>
          <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 6 }}>
            What it is holding
          </h2>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 18, maxWidth: 620 }}>
            Configuration is reported as set or not set, never printed. Nothing on this page is a key.
          </p>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
              gap: 1,
              background: "var(--line-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {facts.map((fact) => (
              <div key={fact.label} style={{ background: "var(--card)", padding: "12px 14px" }}>
                <dt className="sq-kicker-sm" style={{ fontSize: 9.5, letterSpacing: "0.08em", marginBottom: 5 }}>
                  {fact.label}
                </dt>
                <dd className="sq-mono" style={{ fontSize: 13.5, color: toneInk(fact.tone) }}>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* The log */}
      <section className="sq-card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 20 }}>
            Log
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Tag small>{log.length} shown</Tag>
            <SqSegmentedLinks
              label="Show"
              active={onlyFaults ? "faults" : "all"}
              options={[
                {
                  key: "faults",
                  label: "Faults",
                  href: `/admin/systems/${system.id}?window=${windowKey}`,
                },
                {
                  key: "all",
                  label: "Everything",
                  href: `/admin/systems/${system.id}?window=${windowKey}&show=all`,
                },
              ]}
            />
          </div>
        </div>

        {log.length === 0 ? (
          <div style={{ padding: 28 }}>
            <EmptyState
              glyph="laurel"
              title={onlyFaults ? "No faults recorded" : "Nothing logged yet"}
              body={
                onlyFaults
                  ? "Every reading in the retained window came back clean. Switch to Everything to see them."
                  : "This system has not been probed since the log was introduced, or its rows have aged out. Fourteen days are kept."
              }
            />
          </div>
        ) : (
          <ul>
            {log.map((entry) => (
              <li
                key={entry.id}
                className="sq-log-row"
                style={{ ["--status" as string]: STATUS_COLOUR[entry.status] }}
              >
                <span className="sq-status-dot" />
                <span className="sq-mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  {STAMP.format(entry.at)}
                </span>
                <span
                  className="sq-mono"
                  style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: STATUS_COLOUR[entry.status] }}
                >
                  {STATUS_LABEL[entry.status]}
                </span>
                <span className="sq-log-detail">{entry.detail ?? "—"}</span>
                <span className="sq-mono" style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "right" }}>
                  {entry.ran ? "run" : entry.latencyMs === null ? "—" : `${entry.latencyMs} ms`}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p style={{ padding: "12px 18px", borderTop: "1px solid var(--line-2)", fontSize: 11.5, color: "var(--ink-3)" }}>
          Rows marked <b>run</b> were written by the scheduled route itself when it finished; the rest
          are probes, written whenever somebody loads the board. Fourteen days are kept, then swept.
        </p>
      </section>

      <section className="sq-tinted sq-pad-sm">
        <span className="sq-kicker" style={{ display: "block", marginBottom: 12 }}>
          Elsewhere
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {others.map((other) => (
            <Link key={other.id} href={`/admin/systems/${other.id}`} className="sq-tag">
              {other.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Figure({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div>
      <span className="sq-kicker-sm" style={{ fontSize: 9.5, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <b
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1,
          color: tint ?? "var(--color-text)",
        }}
      >
        {value}
      </b>
    </div>
  );
}

function toneInk(tone: Fact["tone"]): string {
  if (tone === "warn") return "var(--signal)";
  if (tone === "good") return "var(--moss)";
  return "var(--color-text)";
}

function isWindow(value: string | undefined): value is WindowKey {
  return value === "24h" || value === "7d" || value === "30d";
}

