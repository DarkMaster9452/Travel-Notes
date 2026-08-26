import type { Metadata } from "next";
import Link from "next/link";

import { Glyph, LockGlyph } from "@/components/sq/icons";
import { SqSticker } from "@/components/sq/sticker";
import { SqStickersSeen } from "@/components/sq/sticker-seen";
import { PageHeader, Stat } from "@/components/sq/ui";
import { getAchievements, stickerAllowance } from "@/lib/achievements";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { envelopeCopy, getEnvelopeStatus } from "@/lib/envelope";
import { getT } from "@/lib/i18n/server";
import { planCopy } from "@/lib/config";
import { getUserStats } from "@/lib/quest/service";
import { SHAPE_RADIUS, stickerStyle } from "@/lib/stickers";

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

  const [stats, entitlement, revocations, seen, envelope, t] = await Promise.all([
    getUserStats(user.id),
    getEntitlement(user.id),
    db.achievementRevocation.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    }),
    db.user.findUnique({ where: { id: user.id }, select: { seenAchievements: true } }),
    getEnvelopeStatus(user.id, user.name),
    getT(user.id),
  ]);

  const achievements = getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
    t,
  );

  const seenSet = new Set(seen?.seenAchievements ?? []);
  const earned = achievements.filter((entry) => entry.earned);
  const reachable = achievements.filter((entry) => !entry.planLocked);
  const beyond = achievements.filter((entry) => entry.planLocked);

  return (
    <>
      <PageHeader
        kicker={t.stickers.kicker}
        title={t.stickers.heading}
        lede={t.stickers.lede}
        right={
          <>
            <Stat
              count={earned.length}
              countId="stickers-earned"
              value={earned.length}
              label={t.stickers.earned}
            />
            <Stat
              count={stickerAllowance(entitlement.plan)}
              countId="stickers-plan"
              value={reachable.length}
              label={t.stickers.onYourPlan}
            />
            <Stat value={achievements.length} label={t.stickers.printedInAll} />
          </>
        }
      />

      {/* Whether these actually reach a letterbox is decided in one place —
          `lib/envelope` — and said out loud here, because the page above
          promises real post and the promise has a condition on it. */}
      <aside
        className={envelope.posts ? "sq-tinted" : "sq-card-flat"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "13px 18px",
          marginBottom: 16,
          borderColor: envelope.reason === "no_address" ? "var(--signal)" : undefined,
        }}
      >
        <span style={{ color: envelope.posts ? "var(--moss)" : "var(--signal)" }}>
          <Glyph name="envelope" size={18} strokeWidth={1.9} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <b style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>
            {envelopeCopy(t, envelope.reason).title}
          </b>
          <span style={{ display: "block", marginTop: 2, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
            {envelopeCopy(t, envelope.reason).detail}
          </span>
        </span>
        {envelope.reason === "no_address" ? (
          <Link href="/settings/address" className="sq-btn sq-btn-primary sq-btn-sm">
            {t.stickers.addAddress}
          </Link>
        ) : null}
      </aside>

      <SqStickersSeen
        ids={reachable.filter((entry) => entry.earned && !seenSet.has(entry.id)).map((entry) => entry.id)}
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
              <SqSticker
                sticker={entry.sticker}
                earned={entry.earned}
                fresh={fresh}
                index={index}
                title={entry.label}
              />
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
                  {entry.revoked ? t.stickers.withdrawn : entry.earned ? entry.description : entry.progressLabel}
                </span>
                {/* Most of the sheet is ink on a screen. Saying which ones are
                    really cut and posted is the difference between "thirty
                    stickers" and "thirty stickers you will hold". */}
                <span
                  className="sq-mono"
                  style={{
                    display: "block",
                    marginTop: 7,
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: entry.printed ? "var(--moss)" : "var(--ink-3)",
                  }}
                >
                  {entry.printed ? t.stickers.posted : t.stickers.onScreen}
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
                {t.stickers.beyondHeading(beyond.length)}
              </h2>
              <p style={{ maxWidth: "58ch", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
                {t.stickers.beyondBody(
                  planCopy(t, entitlement.plan).name,
                  reachable.length,
                  achievements.length,
                )}
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="sq-btn sq-btn-primary"
              style={{ background: "var(--pine)" }}
            >
              {t.stickers.seePlans}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(56px,1fr))", gap: 10 }}>
            {beyond.map((entry, index) => (
              <span
                key={entry.id}
                aria-label="Locked"
                title={`${entry.label} · ${planNameFor(entry.requiredPlan)}`}
                className="sq-sticker sq-sticker-sealed"
                data-locked="1"
                style={{
                  borderRadius: SHAPE_RADIUS[stickerStyle(entry.sticker).shape],
                  ["--i" as string]: index,
                }}
              >
                <LockGlyph size={18} />
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/** "Explorer" / "Ultra Explorer" — what a sealed sticker is waiting on. */
function planNameFor(plan: string): string {
  return plan === "ultra" ? "Ultra Explorer" : plan === "explorer" ? "Explorer" : "Free";
}
