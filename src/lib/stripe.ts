import "server-only";

import Stripe from "stripe";

import { env, stripeEnabled } from "@/lib/env";

let client: Stripe | null = null;

/**
 * Lazily constructed Stripe client. Returns `null` when Stripe isn't
 * configured so local development works without billing credentials.
 */
export function getStripe(): Stripe | null {
  if (!stripeEnabled) return null;
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    appInfo: { name: "SIDEQUEST", version: "1.0.0" },
  });
  return client;
}

export function priceIdFor(interval: "monthly" | "yearly"): string | null {
  const id =
    interval === "yearly"
      ? env.STRIPE_PRICE_ID_EXPLORER_YEARLY
      : env.STRIPE_PRICE_ID_EXPLORER_MONTHLY;
  return id.length > 0 ? id : null;
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

export { stripeEnabled };
