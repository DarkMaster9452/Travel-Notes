import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { logoutAction } from "@/app/(auth)/actions";
import { updatePreferencesAction } from "@/app/(app)/profile/actions";
import { PreferencesForm } from "@/components/app/preferences-form";
import { BillingActions } from "@/components/app/billing-actions";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { EXPLORER_PLAN } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled } from "@/lib/env";
import { getUserStats } from "@/lib/quest/service";
import { formatDate } from "@/lib/utils";

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

  const [preferences, entitlement, stats] = await Promise.all([
    db.userPreferences.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
    getUserStats(user.id),
  ]);

  if (!preferences) notFound();

  return (
    <main className="px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14">
      <header className="border-b border-ink/12 pb-8">
        <Kicker>Account</Kicker>
        <h1 className="display-lg mt-4">{user.name}</h1>
        <p className="mt-3 text-sm text-stone">
          {user.email} · joined {formatDate(user.createdAt)}
        </p>
      </header>

      <div className="grid gap-14 py-12 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="display-md">Preferences</h2>
          <p className="mt-3 max-w-lg text-sm text-stone">
            Change these any time. The generator reads them fresh on every quest.
          </p>

          <div className="mt-8">
            <PreferencesForm
              action={updatePreferencesAction}
              initial={{
                homeLocation: preferences.homeLocation,
                maxDistance: preferences.maxDistance,
                preferredDistance: preferences.preferredDistance,
                interests: preferences.preferredTerrain,
                difficulty: preferences.difficulty,
                timeAvailable: preferences.timeAvailable,
                transport: preferences.transport,
                questStyle: preferences.questStyle,
              }}
            />
          </div>
        </section>

        <aside className="space-y-10">
          <section className="bg-ink p-6 text-paper sm:p-8">
            <Kicker className="text-paper/50">Plan</Kicker>
            <p className="mt-3 font-display text-3xl font-extrabold uppercase">
              {entitlement.isSubscribed ? EXPLORER_PLAN.name : "Scout · free"}
            </p>

            {entitlement.isSubscribed ? (
              <>
                <p className="mt-3 text-sm text-paper/70">
                  {STATUS_COPY[entitlement.status ?? ""] ?? "Active"}
                  {entitlement.currentPeriodEnd && (
                    <>
                      {" · "}
                      {entitlement.cancelAtPeriodEnd ? "ends" : "renews"}{" "}
                      {formatDate(entitlement.currentPeriodEnd)}
                    </>
                  )}
                </p>
                <BillingActions className="mt-6" enabled={isStripeEnabled()} />
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-paper/70">
                  {entitlement.freeQuestsRemaining} of {entitlement.freeQuestAllowance} free quests
                  left.
                </p>
                <Button asChild variant="ember" size="lg" className="mt-6">
                  <Link href="/upgrade">Unlock unlimited</Link>
                </Button>
              </>
            )}
          </section>

          <section>
            <Kicker>Your numbers</Kicker>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Quests generated" value={String(stats.questCount)} />
              <Row label="Completed" value={String(stats.completedCount)} />
              <Row label="Kilometres walked" value={`${stats.kmExplored} km`} />
              <Row label="Metres climbed" value={`${stats.elevation} m`} />
              <Row label="Regions visited" value={String(stats.regions)} />
              <Row label="Saved" value={String(stats.savedCount)} />
            </dl>
          </section>

          <section className="border-t border-ink/12 pt-8">
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="lg">
                Log out
              </Button>
            </form>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/10 pb-3">
      <dt className="text-stone">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
