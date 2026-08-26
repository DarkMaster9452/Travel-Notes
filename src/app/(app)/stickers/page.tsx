import type { Metadata } from "next";
import Link from "next/link";

import { Glyph, LockGlyph, type GlyphName } from "@/components/sq/icons";
import { PageHeader, Stat } from "@/components/sq/ui";
import { getAchievements, stickerAllowance } from "@/lib/achievements";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getUserStats } from "@/lib/quest/service";

export const metadata: Metadata = { title: "Stickers" };
export const dynamic = "force-dynamic";

/**
 * The sheet.
 *
 * Two kinds of locked, kept visually distinct because they mean different
 * things: a sticker this plan reaches but the work has not earned is shown
 * with its name and its progress, and a sticker beyond the plan is a blank
 * tile with a padlock. The first is an invitation to go for a walk; the second
 * is an invitation to change plan, and pretending they are the same state
 * would make both misleading.
 *
 * A newly earned sticker flips once, with a gold ring, and only once — the
 * `seenAchievements` column on the account is what makes "new since you last
 * looked" answerable at all.
 */
export default async function StickersPage() {
  const user = await requireClient();

  const [stats, entitlement, revocations, seen] = await Promise.all([
    getUserStats(user.id),
    getEntitlement(user.id),
    db.achievementRevocation.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    }),
    db.user.findUnique({ where: { id: user.id }, select: { seenAchievements: true } }),
  ]);

  const achievements = getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
  );

  const seenSet = new Set(seen?.seenAchievements ?? []);
  const earned = achievements.filter((entry) => entry.earned);
  const reachable = achievements.filter((entry) => !entry.planLocked);
  const beyond = achievements.filter((entry) => entry.planLocked);

  return (
    <>
      <PageHeader
        kicker="Printed, gummed, posted"
        title="Stickers"
        lede="Nothing here is a screen trophy. Each one is a real sticker, and an envelope carries at most two of them alongside the monthly quest card — the rest wait their turn."
        right={
          <>
            <Stat count={earned.length} countId="stickers-earned" value={earned.length} label="Earned" />
            <Stat
              count={stickerAllowance(entitlement.plan)}
              countId="stickers-plan"
              value={reachable.length}
              label="On your plan"
            />
            <Stat value={achievements.length} label="Printed in all" />
          </>
        }
      />

      <section
        className="sq-stagger"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}
      >
        {reachable.map((entry, index) => {
          const fresh = entry.earned && !seenSet.has(entry.id);
          return (
            <article
              key={entry.id}
              className="sq-card"
              style={{
                padding: 16,
                display: "flex",
                gap: 13,
                alignItems: "center",
                minHeight: 109,
                boxShadow: entry.earned ? "var(--shadow-sm)" : "none",
                borderColor: entry.revoked ? "var(--signal)" : "var(--line-2)",
                background: entry.earned ? "var(--card)" : "var(--paper-2)",
                ["--i" as string]: index,
              }}
            >
              <span
                className="sq-sticker"
                data-fresh={fresh ? "1" : "0"}
                style={{
                  width: 58,
                  height: 58,
                  flex: "0 0 58px",
                  background: entry.earned ? "var(--color-accent-100)" : "var(--paper-3)",
                  color: entry.earned ? "var(--color-accent-700)" : "var(--ink-3)",
                  ["--i" as string]: index,
                }}
              >
                <Glyph name={glyphFor(entry.sticker)} size={27} strokeWidth={1.8} />
              </span>
              <span style={{ minWidth: 0 }}>
                <b
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    color: entry.earned ? "var(--color-text)" : "var(--ink-2)",
                  }}
                >
                  {entry.label}
                </b>
                <span style={{ display: "block", marginTop: 4, fontSize: 11.5, lineHeight: 1.4, color: "var(--ink-3)" }}>
                  {entry.revoked ? "Withdrawn by the desk" : entry.earned ? entry.description : entry.progressLabel}
                </span>
              </span>
            </article>
          );
        })}
      </section>

      {beyond.length > 0 ? (
        <section className="sq-tinted sq-pad" style={{ marginTop: 26 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <h2 className="sq-h2" style={{ fontSize: 22, marginBottom: 8 }}>
                {beyond.length} sheets you cannot see yet
              </h2>
              <p style={{ maxWidth: "58ch", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
                The {entitlement.definition.name} plan prints {reachable.length} of the{" "}
                {achievements.length}. The rest are cut for members further up — what they are stays
                sealed until the plan is.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="sq-btn sq-btn-primary"
              style={{ background: "var(--pine)" }}
            >
              See the plans
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(56px,1fr))", gap: 10 }}>
            {beyond.map((entry) => (
              <span
                key={entry.id}
                aria-label="Locked"
                style={{
                  aspectRatio: "1",
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--paper-3)",
                  color: "var(--ink-3)",
                  opacity: 0.65,
                }}
              >
                <LockGlyph size={20} />
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function glyphFor(sticker: string): GlyphName {
  const table: Record<string, GlyphName> = {
    peak: "peak",
    ridge: "ridge",
    map: "map",
    marker: "marker",
    laurel: "laurel",
    sun: "sun",
    book: "book",
    ascent: "ascent",
    retreat: "retreat",
    winter: "winter",
    peaks: "peaks",
    compass: "compass",
  };
  return table[sticker] ?? "peak";
}
