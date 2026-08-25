import type { Metadata } from "next";
import Link from "next/link";

import { LockGlyph } from "@/components/sq/icons";
import { SqQuestCard, type QuestCardData } from "@/components/sq/quest-card";
import { PageHeader, QuietLink, Stat, Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getLeaderboard } from "@/lib/leaderboard";
import { getAchievements } from "@/lib/achievements";
import { getEntitlement } from "@/lib/entitlements";
import { getUserStats } from "@/lib/quest/service";
import { getOpenSlots, getSealedSlots } from "@/lib/quest/upcoming";
import { glanceFeaturedSlot } from "@/lib/quest/slot";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * The dashboard.
 *
 * Three questions in the order they matter: what is open and running, what is
 * coming and still shut, and where that has put you. Nothing here writes —
 * glancing at a summary card is not accepting a quest, so the featured slots
 * are read without being materialised (see `glanceFeaturedSlot`).
 *
 * The headline is written from what is actually outstanding rather than from
 * the time of day. "Two quests open, one clock running" is a fact about this
 * account, and a greeting would not be.
 */
export default async function DashboardPage() {
  const user = await requireClient();
  const now = new Date();

  const [monthly, weekly, openSlots, sealed, board, stats, entitlement, revocations] =
    await Promise.all([
      glanceFeaturedSlot(user.id, "month", now),
      glanceFeaturedSlot(user.id, "week", now),
      getOpenSlots(now),
      getSealedSlots(3, now),
      getLeaderboard("MONTHLY", undefined, now),
      getUserStats(user.id),
      getEntitlement(user.id),
      db.achievementRevocation.findMany({
        where: { userId: user.id },
        select: { achievementId: true },
      }),
    ]);

  const achievements = getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
  );

  const myRow = board.rows.find((row) => row.userId === user.id) ?? null;

  const cards: QuestCardData[] = [];
  for (const [slot, glance] of [
    ["MONTHLY", monthly] as const,
    ["WEEKLY", weekly] as const,
  ]) {
    if (!glance.featured || glance.closed) continue;
    const summary = glance.featured.summary;
    const open = openSlots.find((entry) => entry.period === slot);
    cards.push({
      id: summary.id,
      kicker: slot === "MONTHLY" ? `The monthly · ${open?.label ?? ""}` : `The weekly · ${open?.label ?? ""}`,
      grade: summary.difficulty,
      title: summary.title,
      where: `${summary.location} · ${summary.region}`,
      distance: summary.distance,
      elevationGain: summary.elevationGain,
      duration: summary.duration,
      latitude: summary.latitude,
      longitude: summary.longitude,
      parkingLat: summary.parkingLat,
      parkingLng: summary.parkingLng,
      parkingName: summary.parkingName,
      openAt: (open ? new Date(glance.closesAt.getTime() - windowLength(slot)) : now).toISOString(),
      closeAt: glance.closesAt.toISOString(),
      status: glance.status,
      cta:
        glance.status === "NONE" || glance.status === "REJECTED"
          ? { label: "File proof", href: `/quests/${summary.id}/proof` }
          : slot === "MONTHLY"
            ? { label: "Open the monthly", href: "/monthly" }
            : { label: "See the quest", href: `/quests/${summary.id}` },
    });
  }

  const running = cards.filter((card) => card.status === "NONE" || card.status === "REJECTED").length;

  const nearby = neighbours(board.rows, user.id);
  const earned = achievements.filter((entry) => entry.earned);

  return (
    <>
      <PageHeader
        kicker={`${openSlots.find((slot) => slot.period === "WEEKLY")?.label ?? ""} · ${new Intl.DateTimeFormat(
          "en-GB",
          { weekday: "long", day: "numeric", month: "long" },
        ).format(now)}`}
        title={headline(cards.length, running)}
        right={
          <>
            <Stat
              count={myRow?.score ?? 0}
              countId="dash-points"
              value={myRow?.score ?? 0}
              label={`Points, ${board.label.split(" ")[0]}`}
            />
            <Stat
              value={myRow ? `#${myRow.rank}` : "—"}
              count={myRow ? myRow.rank : undefined}
              countId="dash-rank"
              prefix="#"
              label={`Of ${board.rows.length} on the board`}
            />
          </>
        }
      />

      <section className="sq-card-flat">
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2">What&rsquo;s coming</h2>
          <span className="sq-meta">Weeklies drop Monday 06:00 · the monthly on the 1st</span>
        </div>

        <div
          className="sq-grid sq-grid-fit-sm"
          style={{ gap: 10, padding: "16px 22px" }}
        >
          {openSlots.map((slot) => (
            <div
              key={`${slot.period}-${slot.key}`}
              style={{
                borderRadius: 8,
                padding: "14px 16px",
                background: slot.title ? "var(--color-accent-100)" : "var(--paper-2)",
                border: `1px solid ${slot.title ? "var(--color-accent-200)" : "var(--line-2)"}`,
              }}
            >
              <p className="sq-kicker-sm" style={{ marginBottom: 8 }}>
                {slot.period === "MONTHLY" ? "The monthly" : "The weekly"} · {slot.label}
              </p>
              <b style={{ display: "block", fontSize: 15, lineHeight: 1.3, fontWeight: 700 }}>
                {slot.title ?? "Generated for you"}
              </b>
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--ink-2)" }}>
                {slot.dates} · {slot.state}
              </p>
            </div>
          ))}
        </div>

        <ul>
          {sealed.map((slot) => (
            <li
              key={`${slot.period}-${slot.key}`}
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1fr) auto",
                gap: 14,
                alignItems: "center",
                padding: "12px 22px",
                borderTop: "1px solid var(--line-2)",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--paper-2)",
                  color: "var(--ink-3)",
                }}
              >
                <LockGlyph />
              </span>
              <span style={{ minWidth: 0, fontSize: 13.5, color: "var(--ink-2)" }}>{slot.text}</span>
              <span
                className="sq-mono"
                style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-3)" }}
              >
                {slot.when}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {cards.length > 0 ? (
        <section className="sq-grid sq-grid-fit sq-stagger" style={{ marginTop: 18 }}>
          {cards.map((card, index) => (
            <SqQuestCard key={card.id} quest={card} index={index} />
          ))}
        </section>
      ) : (
        <section className="sq-card sq-pad" style={{ marginTop: 18 }}>
          <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 8 }}>
            Nothing is open right now
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
            The next weekly drops Monday at 06:00. Until then the quest database is open, and
            anything you file against it still scores.
          </p>
          <Link href="/quests" className="sq-btn sq-btn-ghost sq-btn-sm" style={{ marginTop: 16 }}>
            Open the quest database
          </Link>
        </section>
      )}

      <section
        className="sq-grid sq-grid-fit-md"
        style={{ marginTop: 18, alignItems: "start" }}
      >
        <article className="sq-tinted sq-pad-sm">
          <div className="sq-section-head" style={{ marginBottom: 14 }}>
            <h2 className="sq-h2" style={{ fontSize: 20 }}>
              Around you on the board
            </h2>
            <QuietLink href="/leaderboard">Full board →</QuietLink>
          </div>
          <ul className="sq-stagger">
            {nearby.map((row, index) => (
              <li
                key={row.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: row.userId === user.id ? "var(--card)" : "transparent",
                  borderLeft: `2px solid ${row.userId === user.id ? "var(--signal)" : "transparent"}`,
                  ["--i" as string]: index,
                }}
              >
                <span className="sq-mono" style={{ fontSize: 13, width: 24, color: "var(--ink-3)" }}>
                  {row.rank}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: row.userId === user.id ? 600 : 400,
                  }}
                >
                  {row.username}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  {row.quests} {row.quests === 1 ? "quest" : "quests"}
                </span>
                <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17 }}>
                  {row.score}
                </b>
              </li>
            ))}
            {nearby.length === 0 ? (
              <li style={{ fontSize: 13, color: "var(--ink-3)", padding: "10px 12px" }}>
                Nothing on the board yet this month. Approved proof is what puts you on it.
              </li>
            ) : null}
          </ul>
        </article>

        <article className="sq-card sq-pad-sm">
          <div className="sq-section-head" style={{ marginBottom: 6 }}>
            <h2 className="sq-h2" style={{ fontSize: 20 }}>
              Sticker sheet
            </h2>
            <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
              {earned.length} of {achievements.length} earned
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-2)", marginBottom: 18 }}>
            Two go out with each envelope, alongside the monthly quest card. Stick them where you
            earned them.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10 }}>
            {achievements.slice(0, 10).map((entry, index) => (
              <span
                key={entry.id}
                className="sq-sticker"
                data-locked={entry.earned ? "0" : "1"}
                style={{ ["--i" as string]: index }}
                title={entry.earned ? entry.label : "Not earned yet"}
              >
                {entry.earned ? entry.label : ""}
              </span>
            ))}
          </div>
          <Link href="/stickers" className="sq-btn sq-btn-ghost sq-btn-sm" style={{ marginTop: 18 }}>
            The whole sheet
          </Link>
        </article>
      </section>

      {cards.some((card) => card.status === "PENDING") ? (
        <p style={{ marginTop: 18 }}>
          <Tag tone="stamp">Proof filed · waiting on a reader</Tag>
        </p>
      ) : null}
    </>
  );
}

/** The one sentence the page opens with, decided by what is actually running. */
function headline(open: number, running: number): string {
  if (open === 0) return "Nothing open. The next one drops Monday.";
  if (open === 2 && running === 2) return "Two quests open, both clocks running.";
  if (open === 2 && running === 1) return "Two quests open, one clock running.";
  if (open === 2) return "Two quests open, both already filed.";
  if (running === 1) return "One quest open, and its window is closing.";
  return "One quest open, already filed.";
}

/** The two above and the two below, which is the only part of a board you read. */
function neighbours<T extends { userId: string }>(rows: T[], userId: string): T[] {
  const index = rows.findIndex((row) => row.userId === userId);
  if (index === -1) return rows.slice(0, 5);
  return rows.slice(Math.max(0, index - 2), Math.max(0, index - 2) + 5);
}

/** How long a window runs, for the progress bar on an open card. */
function windowLength(period: "WEEKLY" | "MONTHLY"): number {
  return period === "WEEKLY" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
}
