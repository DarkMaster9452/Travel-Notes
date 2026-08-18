import type { Metadata } from "next";

import { UnlockCeremony } from "@/components/app/unlock-ceremony";
import { requireClient } from "@/lib/auth/guards";
import { syncFromCheckoutSession } from "@/lib/billing";
import { EXPLORER_PLAN, headlineCapabilities } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

/**
 * Where checkout returns to.
 *
 * The subscription is pulled from Stripe here rather than waited for: the
 * webhook usually lands first, but "usually" is not good enough for the one
 * screen whose entire job is to prove that something changed. If Stripe is
 * genuinely slow the page still runs the ceremony and says the confirmation is
 * in flight, because the payment did happen — it is the record that is late.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireClient();
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;

  let entitlement = await getEntitlement(user.id);

  if (!entitlement.isSubscribed && sessionId) {
    const synced = await syncFromCheckoutSession(sessionId, user.id);
    if (synced) entitlement = await getEntitlement(user.id);
  }

  // Nothing confirmed yet: show the plan they bought rather than the free one
  // they are momentarily still recorded as holding.
  const plan = entitlement.isSubscribed ? entitlement.plan : EXPLORER_PLAN.id;
  const capabilities = headlineCapabilities(
    entitlement.isSubscribed ? entitlement.definition : EXPLORER_PLAN,
    Infinity,
  );

  return (
    <UnlockCeremony
      plan={plan}
      capabilities={capabilities}
      pending={!entitlement.isSubscribed}
    />
  );
}
