import type { Metadata } from "next";
import Link from "next/link";

import { SqCountdown } from "@/components/sq/countdown";
import { SqMap, type MapPoint } from "@/components/sq/map";
import { EmptyState, PageHeader, Tag } from "@/components/sq/ui";
import { slotFor, slotLabel } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { scoreBreakdown } from "@/lib/leaderboard";
import { loadFeaturedSlot } from "@/lib/quest/slot";

export const metadata: Metadata = { title: "The monthly" };
export const dynamic = "force-dynamic";

const NUMBER = new Intl.NumberFormat("en-GB");

/**
 * The monthly, in full.
 *
 * The headline quest gets a whole page rather than a card: the brief, the map,
 * the window, what it is worth and what other people have said about the
 * ground. Opening this page *is* taking the quest — unlike the dashboard,
 * which only glances — so `loadFeaturedSlot` materialises it.
 */
export default async function MonthlyPage() {
  const user = await requireClient();
  const now = new Date();
  const slot = slotFor("MONTHLY", now);

  const state = await loadFeaturedSlot(user.id, "month", now);
  const featured = state.featured;

  if (!featured) {
    return (
      <>
        <PageHeader
          kicker={`The big one · ${slotLabel(slot)}`}
          title="No monthly is placed yet."
        />
        <EmptyState
          glyph="peaks"
          title="Nothing booked for this month"
          body="A monthly is either booked by the desk or generated against your preferences. Widen your range in settings and it will find you one."
          action={
            <Link href="/settings/general" className="sq-btn sq-btn-ghost sq-btn-sm">
              Open settings
            </Link>
          }
        />
      </>
    );
  }

  const quest = featured.summary;

  const [filed, approved, conditions, display, entitlement] = await Promise.all([
    db.submission.count({ where: { period: "MONTHLY", slotKey: featured.key } }),
    db.submission.count({
      where: { period: "MONTHLY", slotKey: featured.key, status: "APPROVED" },
    }),
    db.submission.findMany({
      where: { questId: quest.id, status: "APPROVED" },
      orderBy: { reviewedAt: "desc" },
      take: 4,
      select: { note: true, startedAt: true, createdAt: true, user: { select: { name: true } } },
    }),
    db.displaySettings.findUnique({ where: { userId: user.id }, select: { expertStats: true } }),
    getEntitlement(user.id),
  ]);

  // A setting, not a design variant: the switch on Settings → General decides
  // whether the slab appears, and the plan decides whether the switch moves.
  const expertStats = (display?.expertStats ?? false) && entitlement.isSubscribed;

  const { lines, total } = scoreBreakdown({
    difficulty: quest.difficulty,
    distance: quest.distance,
    elevationGain: quest.elevationGain,
    retreated: false,
    featuredPeriod: "MONTHLY",
  });

  const openAt = slot.openAt.getTime();
  const closeAt = state.closesAt.getTime();
  const gone = Math.max(0, Math.min(100, ((now.getTime() - openAt) / (closeAt - openAt)) * 100));
  const daysGone = Math.floor((now.getTime() - openAt) / 86_400_000);
  const daysTotal = Math.round((closeAt - openAt) / 86_400_000);

  const points: MapPoint[] = [];
  if (quest.parkingLat != null && quest.parkingLng != null) {
    points.push({
      lat: quest.parkingLat,
      lng: quest.parkingLng,
      label: quest.parkingName ?? "Park here",
      kind: "start",
    });
  }
  points.push({ lat: quest.latitude, lng: quest.longitude, label: quest.title, kind: "summit" });

  const filedAlready = state.proof.status !== "NONE";

  return (
    <>
      <header className="sq-head">
        <div className="sq-head-row">
          <div style={{ minWidth: 0 }}>
            <span className="sq-kicker" style={{ display: "block", marginBottom: 10, color: "var(--signal)" }}>
              The big one · {slotLabel(slot)}
            </span>
            <h1 className="sq-h1" style={{ fontSize: 40, maxWidth: "22ch", marginBottom: 10 }}>
              {quest.title}
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink-2)" }}>
              {quest.location} · {quest.region} · {title(quest.difficulty)}
              {quest.number ? ` · Quest № ${String(quest.number).padStart(4, "0")}` : ""}
            </p>
          </div>
          <Tag tone={state.closed ? "plain" : "stamp"} small>
            {state.closed ? "Window shut" : <>Closes in <SqCountdown to={state.closesAt.toISOString()} /></>}
          </Tag>
        </div>
      </header>

      <section className="sq-grid sq-grid-fit" style={{ alignItems: "start" }}>
        <article className="sq-card" style={{ overflow: "hidden" }}>
          <SqMap points={points} height={300} style={{ borderRadius: 0, border: 0 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
              gap: 1,
              background: "var(--line-2)",
            }}
          >
            {[
              { k: "Distance", v: `${quest.distance.toFixed(1)} km` },
              { k: "Ascent", v: `${NUMBER.format(quest.elevationGain)} m` },
              { k: "Moving", v: hours(quest.duration) },
              { k: "Grade", v: title(quest.difficulty) },
            ].map((fact) => (
              <div key={fact.k} style={{ background: "var(--paper-2)", padding: "13px 15px" }}>
                <p className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
                  {fact.k}
                </p>
                <b
                  style={{
                    display: "block",
                    marginTop: 4,
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    fontSize: 19,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fact.v}
                </b>
              </div>
            ))}
          </div>
        </article>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <article className="sq-card sq-pad-sm">
            <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 12 }}>
              The brief
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                textWrap: "pretty",
                marginBottom: 14,
              }}
            >
              {quest.objective}
            </p>
            <ul>
              {briefLines(quest).map((line) => (
                <li
                  key={line.k}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "baseline",
                    padding: "10px 0",
                    borderTop: "1px solid var(--line-2)",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                  }}
                >
                  <b
                    className="sq-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--moss)",
                      flex: "0 0 62px",
                    }}
                  >
                    {line.k}
                  </b>
                  <span>{line.text}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="sq-slab" style={{ padding: "22px 24px" }}>
            <span className="sq-kicker">Window</span>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, margin: "12px 0 14px" }}>
              <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 36, lineHeight: 0.9 }}>
                {state.closed ? "Shut" : <SqCountdown to={state.closesAt.toISOString()} />}
              </b>
              <span style={{ fontSize: 13, paddingBottom: 5, color: "var(--forest-ink-3)" }}>
                {state.closed ? "for this month" : "left to file"}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.14)",
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <span
                style={{ display: "block", height: "100%", width: `${gone}%`, background: "var(--signal-2)" }}
              />
            </div>
            <p style={{ fontSize: 12.5, color: "var(--forest-ink-3)", marginBottom: 18 }}>
              {daysGone} of {daysTotal} days gone · {filed} {filed === 1 ? "person has" : "people have"} filed ·{" "}
              {approved} approved so far
            </p>
            <Link
              href={`/quests/${quest.id}/proof`}
              className="sq-btn sq-btn-block"
              style={{ background: "var(--signal)", color: "#fff" }}
            >
              {filedAlready ? "Edit your proof" : "File your proof"}
            </Link>
          </article>

          <article className="sq-tinted" style={{ padding: "20px 22px" }}>
            <h3 className="sq-h2" style={{ fontSize: 17, marginBottom: 10 }}>
              What counts as proof
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
              A written account, at least one photo, and your figures if a watch recorded them. A
              retreat filed honestly scores half — turning back and saying so is worth more than
              nothing.
            </p>
          </article>
        </div>
      </section>

      {expertStats ? (
        <section className="sq-slab" style={{ marginTop: 16, padding: "22px 26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <h2 className="sq-h2" style={{ fontSize: 19 }}>
              Expert figures
            </h2>
            <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
              On because you turned them on in Settings
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            {[
              {
                k: "Metres per kilometre",
                v: String(Math.round(quest.elevationGain / Math.max(1, quest.distance))),
                note: "How steep the day is on average, before any single climb.",
              },
              {
                k: "Asked pace",
                v: `${(quest.distance / Math.max(1, quest.duration / 60)).toFixed(1)} km/h`,
                note: "What the moving-time estimate assumes you keep up.",
              },
              {
                k: "Travel from home",
                v: quest.travelTime ? `${quest.travelTime} min` : "—",
                note: "From the country you measure from, not from an address.",
              },
              {
                k: "Filed so far",
                v: String(filed),
                note: `${approved} of them have been approved.`,
              },
              {
                k: "Approval rate",
                v: filed === 0 ? "—" : `${Math.round((approved / filed) * 100)}%`,
                note: "Of the proof a reader has already reached.",
              },
              {
                k: "Worth, approved",
                v: `${total} pts`,
                note: "Grade, distance, ascent and the monthly bonus.",
              },
            ].map((figure) => (
              <div key={figure.k} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px" }}>
                <p className="sq-kicker-sm" style={{ fontSize: 9.5, marginBottom: 7 }}>
                  {figure.k}
                </p>
                <b
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    fontSize: 22,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {figure.v}
                </b>
                <p style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.4, color: "var(--forest-ink-3)" }}>
                  {figure.note}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="sq-grid sq-grid-fit-md" style={{ marginTop: 16, alignItems: "start" }}>
        <article className="sq-card-flat">
          <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
            <h2 className="sq-h2">The approach</h2>
          </div>
          <ul>
            {approachLegs(quest).map((leg) => (
              <li
                key={leg.place}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr) auto",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "13px 22px",
                  borderTop: "1px solid var(--line-2)",
                }}
              >
                <span
                  className="sq-mono"
                  style={{ fontSize: 10, letterSpacing: "0.07em", color: "var(--ink-3)" }}
                >
                  {leg.at}
                </span>
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{leg.place}</b>
                  <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-3)" }}>
                    {leg.what}
                  </span>
                </span>
                <span
                  className="sq-mono"
                  style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-2)" }}
                >
                  {leg.up}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <article className="sq-card-flat">
            <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
              <h2 className="sq-h2">How it scores</h2>
            </div>
            <ul>
              {lines.map((line) => (
                <li
                  key={line.what}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "11px 22px",
                    borderTop: "1px solid var(--line-2)",
                    fontSize: 13.5,
                    color: line.muted ? "var(--ink-3)" : undefined,
                  }}
                >
                  <span>{line.what}</span>
                  <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12.5 }}>
                    {line.points >= 0 ? `+${line.points}` : line.points}
                  </b>
                </li>
              ))}
              <li
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "11px 22px",
                  borderTop: "1px solid var(--line-2)",
                  fontSize: 13.5,
                  color: "var(--signal)",
                }}
              >
                <span>If it is approved</span>
                <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12.5 }}>
                  {total} points
                </b>
              </li>
            </ul>
          </article>

          <article className="sq-tinted" style={{ padding: "20px 22px" }}>
            <h3 className="sq-h2" style={{ fontSize: 17, marginBottom: 12 }}>
              Conditions, as filed by others
            </h3>
            {conditions.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
                Nobody has filed approved proof of this one yet. Yours would be the first word on
                the ground.
              </p>
            ) : (
              <ul>
                {conditions.map((entry, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "baseline",
                      padding: "10px 0",
                      borderTop: "1px solid var(--line-2)",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    <b
                      className="sq-mono"
                      style={{
                        fontSize: 9.5,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--ink-3)",
                        flex: "0 0 56px",
                      }}
                    >
                      {shortDate(entry.startedAt ?? entry.createdAt)}
                    </b>
                    <span>{trim(entry.note)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
    </>
  );
}

function title(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function hours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${rest > 0 ? `${String(rest).padStart(2, "0")}m` : ""}`.trim() : `${rest}m`;
}

function shortDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(value);
}

/** The first two sentences, so a long account does not run the panel over. */
function trim(note: string): string {
  if (note.length <= 180) return note;
  return `${note.slice(0, 178).trimEnd()}…`;
}

function briefLines(quest: {
  distance: number;
  elevationGain: number;
  duration: number;
  terrain: string[];
  features: string[];
  mood: string | null;
}): { k: string; text: string }[] {
  const lines: { k: string; text: string }[] = [
    {
      k: "Asked",
      text: `${quest.distance.toFixed(1)} km, ${NUMBER.format(quest.elevationGain)} m of ascent, about ${hours(quest.duration)} moving.`,
    },
  ];
  if (quest.terrain.length > 0) {
    lines.push({ k: "Ground", text: quest.terrain.join(", ") });
  }
  if (quest.features.length > 0) {
    lines.push({ k: "Look for", text: quest.features.join(", ") });
  }
  if (quest.mood) lines.push({ k: "Mood", text: quest.mood });
  return lines;
}

/**
 * The approach, in stages.
 *
 * Built from the parking, approach and transit fields the quest actually
 * carries. A leg-by-leg route breakdown would be a nicer list, but nothing in
 * the schema records one, and a page that invented five plausible waypoints
 * would be lying about ground somebody is going to stand on.
 */
function approachLegs(quest: {
  parkingName: string | null;
  parkingNote: string | null;
  approachTime: number | null;
  transitNote: string | null;
  location: string;
  title: string;
  distance: number;
  elevationGain: number;
  duration: number;
}): { at: string; place: string; what: string; up: string }[] {
  const legs: { at: string; place: string; what: string; up: string }[] = [];

  if (quest.parkingName) {
    legs.push({
      at: "00:00",
      place: quest.parkingName,
      what: quest.parkingNote ?? "Leave the car here.",
      up: "0 m",
    });
  }
  if (quest.transitNote) {
    legs.push({ at: "—", place: "Without a car", what: quest.transitNote, up: "" });
  }
  legs.push({
    at: quest.approachTime ? `+${quest.approachTime}m` : "Start",
    place: quest.location,
    what: "Where the route proper begins.",
    up: "",
  });
  legs.push({
    at: hours(quest.duration),
    place: quest.title,
    what: `${quest.distance.toFixed(1)} km from the start.`,
    up: `${NUMBER.format(quest.elevationGain)} m ↑`,
  });

  return legs;
}
