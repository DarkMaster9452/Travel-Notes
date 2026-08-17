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
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    appInfo: { name: "Summit Quest", version: "1.0.0" },
  });
  return client;
}

/** The configured price for a paid plan, or null if this deployment has none. */
export function priceIdFor(
  plan: PaidPlanId,
  interval: BillingInterval,
): string | null {
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
 * so the caller can fall back to the plan recorded in subscription metadata
 * rather than silently granting the wrong tier.
 */
export function planForPriceId(priceId: string | null | undefined): PaidPlanId | null {
  if (!priceId) return null;
  const ultra = [env.STRIPE_PRICE_ID_ULTRA_MONTHLY, env.STRIPE_PRICE_ID_ULTRA_YEARLY];
  const explorer = [env.STRIPE_PRICE_ID_EXPLORER_MONTHLY, env.STRIPE_PRICE_ID_EXPLORER_YEARLY];
  if (ultra.some((id) => id.length > 0 && id === priceId)) return "ultra";
  if (explorer.some((id) => id.length > 0 && id === priceId)) return "explorer";
  return null;
}

/** Maps Stripe subscription statuses onto our enum. */
export function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
      return "PAST_DUE" as const;
    case "canceled":
      return "CANCELED" as const;
    case "incomplete":
      return "INCOMPLETE" as const;
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED" as const;
    case "unpaid":
      return "UNPAID" as const;
    case "paused":
      return "PAUSED" as const;
    default:
      return "INCOMPLETE" as const;
  }
}

export { isStripeEnabled };
