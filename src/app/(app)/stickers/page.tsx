import type { Metadata } from "next";
import { Mail, MailWarning, Monitor } from "lucide-react";

import { StickersSeen } from "@/components/app/sticker-seen";
import { Sticker } from "@/components/domain/sticker";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { PageHeader, PageStack, Section, Stat } from "@/components/ui/page";
import { getAchievements, stickerAllowance } from "@/lib/achievements";
import { requireClient } from "@/lib/auth/guards";
import { planCopy } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { envelopeCopy, getEnvelopeStatus } from "@/lib/envelope";
import { getT } from "@/lib/i18n/server";
import { getUserStats } from "@/lib/quest/service";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).stickers.heading };
}
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

  const envelopeWords = envelopeCopy(t, envelope.reason);

  return (
    <PageStack>
      <div>
        <PageHeader
          title={t.stickers.heading}
          lede={t.stickers.lede}
          actions={
            <>
              <Stat count={earned.length} countId="stickers-earned" label={t.stickers.earned} />
              <Stat
                count={stickerAllowance(entitlement.plan)}
                countId="stickers-plan"
                label={t.stickers.onYourPlan}
              />
              <Stat value={achievements.length} label={t.stickers.printedInAll} />
            </>
          }
        />

        {/* Whether these actually reach a letterbox is decided in one place —
            `lib/envelope` — and said out loud here, because the page above
            promises real post and the promise has a condition on it. */}
        <Alert
          tone={envelope.posts ? "success" : envelope.reason === "no_address" ? "warning" : "info"}
          title={envelopeWords.title}
          action={
            envelope.reason === "no_address" ? (
              <ButtonLink href="/settings/address" size="sm">
                {t.stickers.addAddress}
              </ButtonLink>
            ) : undefined
          }
        >
          {envelopeWords.detail}
        </Alert>
      </div>

      <StickersSeen
        ids={reachable.filter((entry) => entry.earned && !seenSet.has(entry.id)).map((entry) => entry.id)}
      />

      {/* Sticker grid: 2 · 3 · 4 across (§6.4). */}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {reachable.map((entry) => {
          const fresh = entry.earned && !seenSet.has(entry.id);
          return (
            <Card
              as="li"
              key={entry.id}
              pad="sm"
              tone={entry.earned ? "surface" : "sunken"}
              className={cn("flex flex-col items-center gap-3 text-center", entry.revoked && "border-danger")}
            >
              <Sticker sticker={entry.sticker} state={entry.earned ? "earned" : "open"} size="lg" fresh={fresh} />
              <div className="min-w-0">
                <h2 className={cn("text-body-sm font-semibold", !entry.earned && "text-muted")}>{entry.label}</h2>
                <p className="mt-1 text-caption text-muted">
                  {entry.revoked ? t.stickers.withdrawn : entry.earned ? entry.description : entry.progressLabel}
                </p>
              </div>
              {/* Most of the sheet is ink on a screen. Saying which ones are
                  really cut and posted is the difference between "thirty
                  stickers" and "thirty stickers you will hold". */}
              <Badge
                tone={entry.printed ? "primary" : "neutral"}
                icon={entry.printed ? (envelope.posts ? Mail : MailWarning) : Monitor}
                size="sm"
                className="mt-auto"
              >
                {entry.printed ? t.stickers.posted : t.stickers.onScreen}
              </Badge>
            </Card>
          );
        })}
      </ul>

      {beyond.length > 0 ? (
        <Section
          title={t.stickers.beyondHeading(beyond.length)}
          note={t.stickers.beyondBody(planCopy(t, entitlement.plan).name, reachable.length, achievements.length)}
          action={
            <ButtonLink href="/settings/billing" variant="secondary">
              {t.stickers.seePlans}
            </ButtonLink>
          }
        >
          <Card tone="sunken">
            <ul className="flex flex-wrap gap-3">
              {beyond.map((entry) => (
                <li key={entry.id}>
                  <Sticker
                    sticker={entry.sticker}
                    state="locked"
                    size="sm"
                    title={`${t.common.locked} · ${planCopy(t, entry.requiredPlan).name}`}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}
    </PageStack>
  );
}
