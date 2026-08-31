import "server-only";

import Stripe from "stripe";

import type { BillingInterval, PlanId } from "@/lib/config";
import { env, isStripeEnabled } from "@/lib/env";

/** The two plans that are actually sold. `free` is the absence of a purchase. */
export type PaidPlanId = Exclude<PlanId, "free">;

let client: Stripe | null = null;

/**
 * Lazily constructed Stripe client. Returns `null` when Stripe isn't
 * configured so local development works without billing credentials.
 */
export function getStripe(): Stripe | null {
  if (!isStripeEnabled()) return null;
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}

/** The configured price for a paid plan, or null if this deployment has none. */
export function priceIdFor(plan: PaidPlanId, interval: BillingInterval): string | null {
  const id =
    plan === "ultra"
      ? interval === "yearly"
        ? env.STRIPE_PRICE_ID_ULTRA_YEARLY
        : env.STRIPE_PRICE_ID_ULTRA_MONTHLY
      : interval === "yearly"
        ? env.STRIPE_PRICE_ID_EXPLORER_YEARLY
        : env.STRIPE_PRICE_ID_EXPLORER_MONTHLY;
  return id.length > 0 ? id : null;
}

/**
 * Which plan a Stripe price belongs to.
 *
 * The webhook needs this to tell an Explorer subscription from an Ultra one,
 * and it must not guess: a price that matches nothing configured returns null
 * so the caller can fall back to the plan recorded in the subscription's own
 * metadata rather than silently granting the wrong tier.
 */
export function planForPriceId(priceId: string | null | undefined): PaidPlanId | null {
  if (!priceId) return null;
  const ultra = [env.STRIPE_PRICE_ID_ULTRA_MONTHLY, env.STRIPE_PRICE_ID_ULTRA_YEARLY];
  const explorer = [env.STRIPE_PRICE_ID_EXPLORER_MONTHLY, env.STRIPE_PRICE_ID_EXPLORER_YEARLY];
  if (ultra.some((id) => id.length > 0 && id === priceId)) return "ultra";
  if (explorer.some((id) => id.length > 0 && id === priceId)) return "explorer";
  return null;
}

/**
 * Which billing interval a price id is for.
 *
 * Resolved against the configured ids rather than by looking for "yearly" in
 * the string — Stripe price ids are `price_1h…` and carry nothing meaningful
 * to pattern-match on.
 *
 * Unknown ids read as monthly, the same safe default the Paddle version used.
 */
export function intervalForPriceId(priceId: string | null | undefined): BillingInterval {
  if (!priceId) return "monthly";
  const yearly = [env.STRIPE_PRICE_ID_EXPLORER_YEARLY, env.STRIPE_PRICE_ID_ULTRA_YEARLY];
  return yearly.some((id) => id.length > 0 && id === priceId) ? "yearly" : "monthly";
}

/**
 * Maps a Stripe subscription onto our enum.
 *
 * Takes the whole subscription rather than a bare status string, because
 * Stripe expresses "billing is paused" as `pause_collection` staying set
 * while `status` itself keeps reading `"active"` — there is no `"paused"`
 * status to switch on the way Paddle had one.
 *
 * The `default` branch is not decoration. Stripe can add a status without
 * asking us, and an unknown one must not read as active — falling back to
 * `INCOMPLETE` denies access until somebody looks, which is the safe
 * direction to be wrong in.
 */
export function mapStripeStatus(subscription: Stripe.Subscription) {
  if (subscription.pause_collection) return "PAUSED" as const;

  switch (subscription.status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
      return "PAST_DUE" as const;
    case "canceled":
      return "CANCELED" as const;
    default:
      return "INCOMPLETE" as const;
  }
}

export { isStripeEnabled };
