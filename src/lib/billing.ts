import "server-only";

import type Stripe from "stripe";

import { db } from "@/lib/db";
import { mapStripeStatus } from "@/lib/stripe";

/**
 * Translating Stripe's world into ours.
 *
 * Only this module writes subscription state, and it only ever writes it from
 * data fetched from Stripe (webhooks or a direct retrieve) — never from
 * anything a browser sent us.
 */

type PeriodBearing = {
  current_period_start?: number | null;
  current_period_end?: number | null;
};

/**
 * Billing period moved from the subscription onto its items in recent API
 * versions; read whichever is present so an API upgrade can't silently make
 * every subscription look expired.
 */
export function readPeriod(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = subscription.items?.data?.[0] as unknown as PeriodBearing | undefined;
  const source = (subscription as unknown as PeriodBearing).current_period_end
    ? (subscription as unknown as PeriodBearing)
    : item;

  return {
    start: source?.current_period_start ? new Date(source.current_period_start * 1000) : null,
    end: source?.current_period_end ? new Date(source.current_period_end * 1000) : null,
  };
}

function resolveUserId(subscription: Stripe.Subscription): string | null {
  const fromMetadata = subscription.metadata?.userId;
  return typeof fromMetadata === "string" && fromMetadata.length > 0 ? fromMetadata : null;
}

/** Upsert our subscription row from a Stripe subscription object. */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const existing = await db.subscription.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
    },
    select: { id: true, userId: true },
  });

  const userId = existing?.userId ?? resolveUserId(subscription);
  if (!userId) {
    console.error(`[billing] no user for subscription ${subscription.id}; ignoring`);
    return;
  }

  const status = mapStripeStatus(subscription.status);
  const period = readPeriod(subscription);
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;

  // A cancelled or unpaid subscription drops back to the free plan, which is
  // what `getEntitlement` reads to decide whether generation is allowed.
  const plan =
    status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE"
      ? ("EXPLORER" as const)
      : ("FREE" as const);

  const data = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    status,
    plan,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
  };

  await db.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

/** Record the customer id as soon as checkout starts, before any webhook. */
export async function linkCustomer(userId: string, customerId: string): Promise<void> {
  await db.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customerId, status: "INCOMPLETE", plan: "FREE" },
    update: { stripeCustomerId: customerId },
  });
}

export async function markPaymentFailed(customerId: string): Promise<void> {
  await db.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: "PAST_DUE" },
  });
}
