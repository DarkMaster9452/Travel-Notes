import type { Metadata } from "next";
import Link from "next/link";

import { SqParamSelect, SqSegmentedLinks } from "@/components/sq/controls";
import { LogoSilhouette } from "@/components/sq/icons";
import { Avatar, Bar, EmptyState, Tag } from "@/components/sq/ui";
import { slotLabel } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { plural } from "@/lib/i18n/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { getLeaderboard, pastSlots, SCORING_NOTES } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const MEDAL_COLOUR = ["var(--gold)", "#c6ccbf", "#c08552"];
const PODIUM_HEIGHT = [200, 168, 148];

/**
 * The board.
 *
 * Points for approved proof, on the same clock as everything else. The podium
 * is drawn from the same rows as the table rather than from a separate query:
 * one board, read twice, cannot disagree with itself.
 *
 * A sealed board keeps its podium for good — see `LeaderboardAward` — so the
 * medals here are whatever was written down, not whatever the arithmetic says
 * today.
 */
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; slot?: string }>;
}) {
  const user = await requireClient();
  const params = await searchParams;
  const period = params.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  const [board, t, locale] = await Promise.all([
    getLeaderboard(period, params.slot),
    getT(user.id),
    getLocale(user.id),
  ]);
  const slots = pastSlots(period, 8);

  const mine = board.rows.find((row) => row.userId === user.id) ?? null;
  const leader = board.rows[0]?.score ?? 0;
  const podium = board.rows.slice(0, 3);
  const rest = board.rows;

  return (
    <>
      <header className="sq-head">
        <div className="sq-head-row">
          <div style={{ minWidth: 0 }}>
            <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
              {t.leaderboard.everybodyRanked}
            </span>
            <h1 className="sq-h1" style={{ fontSize: 40, maxWidth: "none", marginBottom: 12 }}>
              {t.leaderboard.title}
            </h1>
            <p className="sq-lede">
              {t.leaderboard.lede}
            </p>
          </div>
          <SqSegmentedLinks
            label={t.leaderboard.cadence}
            active={period}
            options={[
              { key: "MONTHLY", label: t.leaderboard.monthlyTab, href: "/leaderboard" },
              { key: "WEEKLY", label: t.leaderboard.weeklyTab, href: "/leaderboard?period=WEEKLY" },
            ]}
          />
        </div>
      </header>

      <section
        className="sq-slab"
        style={{
          padding: "24px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div>
          <span className="sq-kicker">
            Your standing · {board.label} · {board.state === "live" ? "open" : board.sealed ? "sealed" : "closed"}
          </span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, margin: "14px 0 16px" }}>
            <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 50, lineHeight: 0.85 }}>
              {mine ? `#${mine.rank}` : "—"}
            </b>
            <span style={{ paddingBottom: 6 }}>
              <b
                style={{
                  display: "block",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize: 24,
                  lineHeight: 1,
                }}
              >
                {t.leaderboard.yourPoints(mine?.score ?? 0)}
              </b>
              <span style={{ fontSize: 13, color: "var(--forest-ink-3)" }}>
                {mine
                  ? `${plural(locale, mine.quests, t.common.quests)}${
                      mine.tookFeatured ? ` · ${t.leaderboard.tookFeatured}` : ""
                    }`
                  : t.leaderboard.emptyWindow}
              </span>
            </span>
          </div>
          <div style={{ maxWidth: 460 }}>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${leader === 0 ? 0 : Math.round(((mine?.score ?? 0) / leader) * 100)}%`,
                  background: "var(--signal-2)",
                }}
              />
            </div>
            <p style={{ marginTop: 10, fontSize: 13, color: "var(--forest-ink-3)" }}>
              {mine && mine.rank > 1 ? (
                <>
                  <b style={{ color: "var(--forest-ink)" }}>
                    {t.leaderboard.toOvertake(mine.toOvertake)}
                  </b>{" "}
                  {t.leaderboard.takesPlaceAbove} {t.leaderboard.offTheLead(mine.behindLeader)}
                </>
              ) : mine ? (
                t.leaderboard.leading
              ) : (
                t.leaderboard.emptyBody
              )}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {["Gold", "Silver", "Bronze"].map((label, index) => (
            <span
              key={label}
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                background: MEDAL_COLOUR[index],
                color: "#14251b",
              }}
            >
              <LogoSilhouette size={22} />
              <b className="sq-mono" style={{ fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                {label}
              </b>
            </span>
          ))}
        </div>
      </section>

      <section className="sq-card sq-pad" style={{ marginTop: 18 }}>
        <div className="sq-section-head" style={{ marginBottom: 22 }}>
          <h2 className="sq-h2" style={{ fontSize: 21 }}>
            {board.label} · {board.dates}
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Tag tone={board.state === "live" ? "stamp" : "plain"} small>
              {board.state === "live"
                ? t.leaderboard.openNow(board.rows.length)
                : board.sealed
                  ? t.leaderboard.sealed
                  : t.leaderboard.closed}
            </Tag>
            <SqParamSelect
              name="slot"
              label={t.leaderboard.window}
              value={board.slotKey}
              options={slots.map((slot) => ({ value: slot.key, label: slotLabel(slot) }))}
            />
          </div>
        </div>

        {board.rows.length === 0 ? (
          <EmptyState
            glyph="laurel"
            title={t.leaderboard.empty}
            body={t.leaderboard.approvedOnly}
            action={
              <Link href="/monthly" className="sq-btn sq-btn-primary sq-btn-sm">
                {t.leaderboard.openMonthly}
              </Link>
            }
          />
        ) : (
          <>
            {podium.length === 3 ? (
              <div className="sq-podium">
                {[podium[1], podium[0], podium[2]].map((row, position) => {
                  const place = position === 1 ? 0 : position === 0 ? 1 : 2;
                  return (
                    <div
                      key={row.userId}
                      className="sq-podium-col"
                      style={{
                        height: PODIUM_HEIGHT[place],
                        borderBottom: `4px solid ${MEDAL_COLOUR[place]}`,
                        ["--i" as string]: position,
                      }}
                    >
                      <span
                        className="sq-podium-medal"
                        style={{ background: MEDAL_COLOUR[place], ["--i" as string]: position }}
                      >
                        <LogoSilhouette size={26} />
                      </span>
                      <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18, lineHeight: 1.15 }}>
                        {row.username}
                      </b>
                      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, lineHeight: 1 }}>
                        {row.score}
                      </span>
                      <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                        {plural(locale, row.quests, t.common.quests)}
                      </span>
                      <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
                        {[t.leaderboard.first, t.leaderboard.second, t.leaderboard.third][place]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <ul className="sq-stagger" style={{ marginTop: 22 }}>
              {rest.map((row, index) => (
                <li
                  key={row.userId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px 32px minmax(120px,1fr) minmax(50px,110px) auto 56px",
                    gap: 12,
                    alignItems: "center",
                    padding: "11px 12px",
                    borderTop: "1px solid var(--line-2)",
                    background: row.userId === user.id ? "var(--paper-2)" : "transparent",
                    borderLeft: `2px solid ${row.userId === user.id ? "var(--signal)" : "transparent"}`,
                    ["--i" as string]: index,
                  }}
                >
                  <span className="sq-mono" style={{ fontSize: 14, color: "var(--ink-3)" }}>
                    {row.rank}
                  </span>
                  <Avatar name={row.username} size={32} square />
                  <span style={{ minWidth: 0 }}>
                    {row.handle ? (
                      <Link href={`/people/${row.handle}`} style={{ color: "var(--color-text)" }}>
                        <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{row.username}</b>
                      </Link>
                    ) : (
                      <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{row.username}</b>
                    )}
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                      {row.quests} {row.quests === 1 ? "quest" : "quests"}
                      {row.tookFeatured ? " · took the featured one" : ""}
                    </span>
                  </span>
                  <Bar pct={leader === 0 ? 0 : (row.score / leader) * 100} />
                  <span className="sq-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {row.medal ?? ""}
                  </span>
                  <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, textAlign: "right" }}>
                    {row.score}
                  </b>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="sq-grid sq-grid-fit-md" style={{ marginTop: 18, alignItems: "start" }}>
        <article className="sq-tinted sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 16 }}>
            How the score works
          </h2>
          <ol style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SCORING_NOTES.map((note, index) => (
              <li key={note} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                <b
                  className="sq-mono"
                  style={{ fontWeight: 400, fontSize: 12, color: "var(--ink-3)", flex: "0 0 24px", paddingTop: 3 }}
                >
                  {String(index + 1).padStart(2, "0")}
                </b>
                <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>{note}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="sq-card sq-pad-sm" style={{ borderColor: "var(--line)", boxShadow: "none" }}>
          <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 10 }}>
            Sealed boards keep their podium
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
            Once a window closes the top three are fixed for good — a verdict changed three weeks
            later moves the points, never the medal. Winners&rsquo; stickers go out with the next
            envelope.
          </p>
        </article>
      </section>
    </>
  );
}
