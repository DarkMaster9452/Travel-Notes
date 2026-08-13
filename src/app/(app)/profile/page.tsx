import type { Metadata } from "next";
import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { BillingActions } from "@/components/app/billing-actions";
import { CosmeticsForm } from "@/components/app/cosmetics-form";
import { Panel } from "@/components/app/dashboard-panels";
import { Icon, IconCrown, IconLogout } from "@/components/ui/icons";
import { getAchievements } from "@/lib/achievements";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { EXPLORER_PLAN } from "@/lib/config";
import { accentOf, avatarStyleOf, bannerOf } from "@/lib/cosmetics";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled } from "@/lib/env";
import { getUserStats } from "@/lib/quest/service";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

const STATUS_COPY: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trial",
  PAST_DUE: "Payment failed — we're retrying",
  CANCELED: "Cancelled",
  INCOMPLETE: "Incomplete",
  INCOMPLETE_EXPIRED: "Expired",
  UNPAID: "Unpaid",
  PAUSED: "Paused",
};

export default async function ProfilePage() {
  const user = await requireOnboardedUser();

  const [entitlement, stats, profile] = await Promise.all([
    getEntitlement(user.id),
    getUserStats(user.id),
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        accentColor: true,
        avatarStyle: true,
        bannerStyle: true,
        explorerTitle: true,
        createdAt: true,
      },
    }),
  ]);

  const achievements = getAchievements(stats);
  const earnedTitles = achievements.filter((a) => a.earned).map((a) => a.label);

  const accent = accentOf(profile.accentColor);
  const avatar = avatarStyleOf(profile.avatarStyle);
  const banner = bannerOf(profile.bannerStyle);
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="mx-auto max-w-[90rem] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      {/* ---- Identity card --------------------------------------------- */}
      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <div className={cn("h-28 sm:h-36", banner.className)} />
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 sm:px-8">
          <div className="flex items-end gap-4">
            <span
              aria-hidden="true"
              className={cn(
                "-mt-10 flex size-20 items-center justify-center rounded-full text-paper ring-4 ring-card",
                accent.bg,
              )}
            >
              {avatar.icon ? (
                <Icon name={avatar.icon} size={34} />
              ) : (
                <span className="font-display text-3xl font-extrabold">{initial}</span>
              )}
            </span>
            <div className="pb-1">
              <h1 className="font-display text-2xl font-extrabold normal-case sm:text-3xl">
                {user.name}
              </h1>
              <p className={cn("text-sm font-medium", accent.text)}>
                {profile.explorerTitle ?? "Explorer"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {user.email} · joined {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>

          <form action={logoutAction} className="pb-1">
            <button
              type="submit"
              className="flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-ember transition-colors hover:border-ember/50 hover:bg-ember/10"
            >
              <IconLogout size={16} /> Log out
            </button>
          </form>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* ---- Cosmetics ---------------------------------------------- */}
        <Panel title="Appearance">
          <p className="mb-6 text-sm text-muted">
            How your profile looks. None of this changes the quests you get.
          </p>
          <CosmeticsForm
            name={user.name}
            initialAccent={profile.accentColor}
            initialAvatarStyle={profile.avatarStyle}
            initialBanner={profile.bannerStyle}
            initialTitle={profile.explorerTitle}
            earnedTitles={earnedTitles}
          />
        </Panel>

        <div className="flex flex-col gap-4">
          {/* ---- Plan ------------------------------------------------- */}
          <Panel title="Plan">
            <p className="flex items-center gap-2 font-display text-xl font-extrabold">
              <IconCrown size={18} className={accent.text} />
              {entitlement.isSubscribed ? EXPLORER_PLAN.name : "Free"}
            </p>

            {entitlement.isSubscribed ? (
              <>
                <p className="mt-2 text-sm text-muted">
                  {STATUS_COPY[entitlement.status ?? ""] ?? "Active"}
                  {entitlement.currentPeriodEnd
                    ? entitlement.cancelAtPeriodEnd
                      ? ` · ends ${formatDate(entitlement.currentPeriodEnd)}`
                      : ` · renews ${formatDate(entitlement.currentPeriodEnd)}`
                    : ""}
                </p>
                <BillingActions enabled={isStripeEnabled()} className="mt-5" />
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted">
                  {entitlement.freeQuestsRemaining} of {entitlement.freeQuestAllowance} free quests
                  left.
                </p>
                <Link
                  href="/upgrade"
                  className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-moss"
                >
                  <IconCrown size={16} /> Go unlimited
                </Link>
              </>
            )}
          </Panel>

          {/* ---- Titles ----------------------------------------------- */}
          <Panel title="Titles earned">
            {earnedTitles.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {earnedTitles.map((earned) => (
                  <li
                    key={earned}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm",
                      earned === profile.explorerTitle
                        ? "border-ink bg-ink/5 font-medium text-ink"
                        : "border-line text-muted",
                    )}
                  >
                    {earned}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Titles unlock with achievements. Finish a quest to earn your first.
              </p>
            )}
            <Link
              href="/achievements"
              className="mt-4 inline-block text-sm font-medium text-ink hover:text-moss"
            >
              See all achievements →
            </Link>
          </Panel>
        </div>
      </div>
    </main>
  );
}
