import type { Metadata } from "next";
import Link from "next/link";

import { GenerateQuest } from "@/components/app/generate-quest";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getEntitlement } from "@/lib/entitlements";

export const metadata: Metadata = { title: "You're in" };
export const dynamic = "force-dynamic";

/**
 * Post-checkout landing.
 *
 * Stripe redirects here immediately, but the subscription only becomes real
 * when the webhook lands — so this page reads our own database and tells the
 * truth either way rather than assuming success.
 */
export default async function UpgradeSuccessPage() {
  const user = await requireOnboardedUser();
  const entitlement = await getEntitlement(user.id);

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-ink px-5 py-20 text-paper sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <Kicker className="text-ember-light">
          {entitlement.isSubscribed ? "Explorer unlocked" : "Payment received"}
        </Kicker>

        <h1 className="display-lg mt-5">
          {entitlement.isSubscribed ? <>Go anywhere. As often as you like.</> : <>Almost there.</>}
        </h1>

        <p className="mt-7 max-w-lg text-lg leading-relaxed text-paper/70">
          {entitlement.isSubscribed
            ? "Unlimited quests are live on your account. The generator will keep steering you away from everywhere you've already been."
            : "Stripe is still confirming the payment. This usually takes a few seconds — refresh in a moment and your plan will be active."}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {entitlement.isSubscribed ? (
            <GenerateQuest label="Generate a quest" variant="light" />
          ) : (
            <Button asChild variant="light" size="xl">
              <Link href="/upgrade/success">Check again</Link>
            </Button>
          )}
          <Button asChild variant="outlineLight" size="xl">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
