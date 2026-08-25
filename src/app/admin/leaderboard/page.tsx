import type { Metadata } from "next";
import Link from "next/link";

import { SqSegmentedLinks } from "@/components/sq/controls";
import { LogoSilhouette } from "@/components/sq/icons";
import { Avatar, Bar, EmptyState, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getLeaderboard, pastSlots } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Leaderboards · Admin" };
export const dynamic = "force-dynamic";

const MEDAL_COLOUR: Record<string, string> = {
  GOLD: "var(--gold)",
  SILVER: "#c6ccbf",
  BRONZE: "#c08552",
};

/**
 * The boards, from behind the desk.
 *
 * Exactly what the members see, plus the one thing they cannot: how much
 * unread proof is sitting inside the window. A board with a queue behind it is
 * a board that is still going to move, and sealing one while proof waits is
 * the mistake this screen exists to prevent.
 */
export default async function AdminLeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; slot?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const period = params.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  const board = await getLeaderboard(period, params.slot);
  const slots = pastSlots(period, 8);

  const [unread, awards, sealedCount] = await Promise.all([
    db.submission.count({
      where: {
        status: "PENDING",
        OR: [
          { startedAt: { gte: board.openAt, lt: board.closeAt } },
          { startedAt: null, createdAt: { gte: board.openAt, lt: board.closeAt } },
        ],
      },
    }),
    db.leaderboardAward.findMany({
      where: { period },
      orderBy: [{ slotKey: "desc" }, { rank: "asc" }],
      take: 24,
      select: {
        slotKey: true,
        rank: true,
        medal: true,
        score: true,
        user: { select: { name: true } },
      },
    }),
    db.leaderboardAward.groupBy({ by: ["slotKey"], where: { period }, _count: { _all: true } }),
  ]);

  const leader = board.rows[0]?.score ?? 0;
  const bySlot = new Map<string, typeof awards>();
  for (const award of awards) {
    bySlot.set(award.slotKey, [...(bySlot.get(award.slotKey) ?? []), award]);
  }

  return (
    <>
      <PageHeader
        kicker="Who is winning"
        title="Leaderboards"
        lede="Exactly what the members see. A closed board is sealed the first time anybody opens it, and the podium stops moving from then on."
        right={
          <SqSegmentedLinks
            label="Cadence"
            active={period}
            options={[
              { key: "MONTHLY", label: "Monthly", href: "/admin/leaderboard" },
              { key: "WEEKLY", label: "Weekly", href: "/admin/leaderboard?period=WEEKLY" },
            ]}
          />
        }
      />

      <StatGrid>
        <StatTile label="On this board" count={board.rows.length} index={0} />
        <StatTile
          label="Unread in the window"
          count={unread}
          note={unread > 0 ? "This board can still move" : "Nothing is waiting"}
          index={1}
        />
        <StatTile label="Sealed boards" count={sealedCount.length} index={2} />
        <StatTile value={board.sealed ? "Sealed" : board.state === "live" ? "Open" : "Closed"} label="This one" index={3} />
      </StatGrid>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            {board.label} · {board.dates}
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Tag tone={board.state === "live" ? "stamp" : "plain"} small>
              {board.state === "live" ? "OPEN" : board.sealed ? "SEALED" : "CLOSED"}
            </Tag>
            <div className="sq-seg">
              {slots.map((slot) => (
                <Link
                  key={slot.key}
                  href={`/admin/leaderboard?period=${period}&slot=${slot.key}`}
                  className="sq-seg-opt"
                  data-on={slot.key === board.slotKey ? "1" : "0"}
                  scroll={false}
                >
                  {slot.key}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {board.rows.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyState
              glyph="laurel"
              title="Nothing on this board"
              body="A board counts approved proof only. Until a reader has passed something, there is nothing to rank."
            />
          </div>
        ) : (
          <ul className="sq-stagger">
            {board.rows.map((row, index) => (
              <li
                key={row.userId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 32px minmax(120px,1fr) minmax(50px,110px) auto 56px",
                  gap: 12,
                  alignItems: "center",
                  padding: "11px 22px",
                  borderTop: "1px solid var(--line-2)",
                  ["--i" as string]: index,
                }}
              >
                <span className="sq-mono" style={{ fontSize: 14, color: "var(--ink-3)" }}>
                  {row.rank}
                </span>
                <Avatar name={row.username} size={32} square />
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{row.username}</b>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    {row.quests} {row.quests === 1 ? "quest" : "quests"}
                    {row.tookFeatured ? " · took the featured one" : ""}
                  </span>
                </span>
                <Bar pct={leader === 0 ? 0 : (row.score / leader) * 100} />
                <span style={{ display: "flex", justifyContent: "flex-end" }}>
                  {row.medal ? (
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        background: MEDAL_COLOUR[row.medal] ?? "var(--sage)",
                      }}
                      title={row.medal}
                    >
                      <LogoSilhouette size={14} />
                    </span>
                  ) : null}
                </span>
                <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, textAlign: "right" }}>
                  {row.score}
                </b>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Sealed podiums
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Written down, not recomputed
          </span>
        </div>
        {bySlot.size === 0 ? (
          <p style={{ padding: "16px 22px", fontSize: 13, color: "var(--ink-3)" }}>
            Nothing has sealed yet. A board seals the first time anybody opens it after its window
            shuts.
          </p>
        ) : (
          <ul>
            {[...bySlot.entries()].map(([slotKey, entries]) => (
              <li
                key={slotKey}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr)",
                  gap: 16,
                  alignItems: "center",
                  padding: "13px 22px",
                  borderTop: "1px solid var(--line-2)",
                }}
              >
                <span className="sq-mono" style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {slotKey}
                </span>
                <span style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                  {entries.map((award) => (
                    <span key={`${award.slotKey}-${award.rank}`} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <i
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          background: MEDAL_COLOUR[award.medal] ?? "var(--sage)",
                          display: "block",
                        }}
                      />
                      {award.user.name}
                      <b className="sq-mono" style={{ fontWeight: 500, fontSize: 11.5, color: "var(--ink-3)" }}>
                        {award.score}
                      </b>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
