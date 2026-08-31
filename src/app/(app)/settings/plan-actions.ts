"use server";

import { revalidatePath } from "next/cache";

import { isStaffRole } from "@/lib/admin/access";
import { requireClient } from "@/lib/auth/guards";
import { syncFromCheckoutSession } from "@/lib/billing";
import {
  planById,
  planIdFromRecord,
  type BillingInterval,
  type Capability,
  type PlanId,
} from "@/lib/config";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { queueNudge } from "@/lib/nudges";
import { getStripe, priceIdFor } from "@/lib/stripe";

export type CheckoutIntent =
  | { ok: true; clientSecret: string; sessionId: string }
  | { ok: false; message: string };

/**
 * Everything the browser needs to mount an embedded Stripe checkout, and
 * nothing more.
 *
 * The account checks are the same ones the old checkout route made, and they
 * are made here for the same reason: the panel never renders a buy button, and
 * this is what makes that true rather than merely tidy.
 *
 * Note what this deliberately does *not* do: grant anything. It returns a
 * session to render. Entitlement changes only when Stripe says money moved,
 * through the webhook or through `syncFromCheckoutSession`, both of which
 * read Stripe rather than the browser.
 */
export async function startCheckoutAction(
  planId: string,
  intervalId: string,
): Promise<CheckoutIntent> {
  const user = await requireClient();

  if (isStaffRole(user.role)) {
    return { ok: false, message: "Staff accounts can't hold a subscription." };
  }

  if (planId !== "explorer" && planId !== "ultra") {
    return { ok: false, message: "That isn't a plan you can buy." };
  }
  const interval: BillingInterval = intervalId === "yearly" ? "yearly" : "monthly";

  const priceId = priceIdFor(planId, interval);
  if (!priceId) {
    return { ok: false, message: "That plan isn't available right now." };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, message: "Billing isn't configured on this deployment." };
  }

  // Reuse the customer Stripe already knows about, so a second purchase does
  // not create a second customer record with the same email — Stripe would
  // accept it, and the account's history would then be split across two.
  const existing = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  const metadata = { userId: user.id, plan: planId };

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: existing?.stripeCustomerId ?? undefined,
    customer_email: existing?.stripeCustomerId ? undefined : user.email,
    metadata,
    // The session's own metadata is read by `syncFromCheckoutSession` right
    // after payment; the subscription's metadata is what every later webhook
    // event carries, since a `customer.subscription.*` event hands back the
    // subscription object and never the checkout session that created it.
    subscription_data: { metadata },
    return_url: `${appUrl}/settings/billing?checkout={CHECKOUT_SESSION_ID}`,
  });

  if (!session.client_secret) {
    return { ok: false, message: "Checkout would not open." };
  }

  return { ok: true, clientSecret: session.client_secret, sessionId: session.id };
}

/**
 * What a finished purchase tells the browser.
 *
 * `gains` is the plan's whole capability list rather than the difference
 * against what the account held a moment ago — that difference is unknowable
 * by the time this runs, because syncing has already overwritten the old
 * plan. Listing what the plan gives is the honest thing to show on a
 * celebration anyway.
 */
export type CheckoutResult =
  | { ok: true; plan: PlanId; name: string; gains: Capability[] }
  | { ok: false };

/**
 * Bring a completed checkout into our database before the webhook lands.
 *
 * The embedded checkout's `onComplete` fires the moment payment clears and
 * hands back nothing but the session id it was mounted with. That id is a
 * claim, not proof — so it is taken to Stripe and checked against the account
 * asking, in `syncFromCheckoutSession`. The webhook remains the authority;
 * this only stops the page from saying "free plan" to somebody who has just
 * paid.
 *
 * Two things ride on this beyond the sync, both of which used to belong to the
 * demo activation and would have been lost with it:
 *
 *   · The postal address is queued as a nudge for the following day, and only
 *     for a plan that actually posts. Asking in the middle of a celebration
 *     gets a worse answer than asking on its own the next day — and without
 *     this, nobody who pays would ever be asked, so the envelope would have
 *     nowhere to go.
 *   · The plan's name and capabilities come back so the browser can show the
 *     unlock celebration.
 *
 * Returns `{ ok: false }` when Stripe has not caught up yet, which is a real
 * outcome rather than an error: the webhook will finish the job a moment later.
 */
export async function completeCheckoutAction(sessionId: string): Promise<CheckoutResult> {
  const user = await requireClient();

  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return { ok: false };
  }

  const synced = await syncFromCheckoutSession(sessionId, user.id);
  if (!synced) return { ok: false };

  // Read back what the sync actually wrote rather than trusting what checkout
  // was opened for. The price is the authority on which tier was bought, and
  // the browser is not.
  const row = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });
  const plan = planIdFromRecord(row?.plan);
  const definition = planById(plan);

  if (definition.capabilities.includes("mail")) {
    await queueNudge(
      user.id,
      "SHIPPING_ADDRESS",
      { plan, activatedAt: new Date().toISOString() },
      new Date(),
    );
  }

  revalidatePath("/settings/billing");
  revalidatePath("/dashboard");
  revalidatePath("/stickers");

  return { ok: true, plan, name: definition.name, gains: [...definition.capabilities] };
}
