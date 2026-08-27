import "server-only";

import { Environment, Paddle } from "@paddle/paddle-node-sdk";

import type { BillingInterval, PlanId } from "@/lib/config";
import { env, isPaddleEnabled, paddleEnvironment } from "@/lib/env";

/** The two plans that are actually sold. `free` is the absence of a purchase. */
export type PaidPlanId = Exclude<PlanId, "free">;

let client: Paddle | null = null;

/**
 * Lazily constructed Paddle client. Returns `null` when Paddle isn't
 * configured so local development works without billing credentials.
 *
 * The environment is explicit rather than inferred from the key's shape.
 * Sandbox keys do contain `_sdbx`, but relying on that would mean a renamed
 * or rotated key could silently point a branch at production, and the failure
 * mode there is charging somebody's real card.
 */
export function getPaddle(): Paddle | null {
  if (!isPaddleEnabled()) return null;
  client ??= new Paddle(env.PADDLE_API_KEY, {
    environment: paddleEnvironment() === "production" ? Environment.production : Environment.sandbox,
  });
  return client;
}

/** The configured price for a paid plan, or null if this deployment has none. */
export function priceIdFor(plan: PaidPlanId, interval: BillingInterval): string | null {
  const id =
    plan === "ultra"
      ? interval === "yearly"
        ? env.PADDLE_PRICE_ID_ULTRA_YEARLY
        : env.PADDLE_PRICE_ID_ULTRA_MONTHLY
      : interval === "yearly"
        ? env.PADDLE_PRICE_ID_EXPLORER_YEARLY
        : env.PADDLE_PRICE_ID_EXPLORER_MONTHLY;
  return id.length > 0 ? id : null;
}

/**
 * Which plan a Paddle price belongs to.
 *
 * The webhook needs this to tell an Explorer subscription from an Ultra one,
 * and it must not guess: a price that matches nothing configured returns null
 * so the caller can fall back to the plan recorded in the subscription's
 * custom data rather than silently granting the wrong tier.
 */
export function planForPriceId(priceId: string | null | undefined): PaidPlanId | null {
  if (!priceId) return null;
  const ultra = [env.PADDLE_PRICE_ID_ULTRA_MONTHLY, env.PADDLE_PRICE_ID_ULTRA_YEARLY];
  const explorer = [env.PADDLE_PRICE_ID_EXPLORER_MONTHLY, env.PADDLE_PRICE_ID_EXPLORER_YEARLY];
  if (ultra.some((id) => id.length > 0 && id === priceId)) return "ultra";
  if (explorer.some((id) => id.length > 0 && id === priceId)) return "explorer";
  return null;
}

/**
 * Which billing interval a price id is for.
 *
 * Resolved against the configured ids rather than by looking for "yearly" in
 * the string, which is what the billing screen used to do. Neither Stripe nor
 * Paddle puts anything meaningful in a price id — they are `pri_01h…` — so
 * that test was always false and every subscription rendered as monthly.
 *
 * Unknown ids read as monthly, which is the same thing the old code did by
 * accident and the right default: monthly is the cheaper claim to make.
 */
export function intervalForPriceId(priceId: string | null | undefined): BillingInterval {
  if (!priceId) return "monthly";
  const yearly = [env.PADDLE_PRICE_ID_EXPLORER_YEARLY, env.PADDLE_PRICE_ID_ULTRA_YEARLY];
  return yearly.some((id) => id.length > 0 && id === priceId) ? "yearly" : "monthly";
}

/**
 * Maps Paddle subscription statuses onto our enum.
 *
 * Paddle has exactly five, and they are the five our enum now carries besides
 * `INCOMPLETE` — which is ours, not Paddle's: it marks the gap between "we
 * created a customer record" and "a subscription exists", a state Paddle has
 * no word for because from its side nothing has happened yet.
 *
 * The `default` branch is not decoration. Paddle can add a status without
 * asking us, and an unknown one must not read as active — falling back to
 * `INCOMPLETE` denies access until somebody looks, which is the safe
 * direction to be wrong in.
 */
export function mapPaddleStatus(status: string) {
  switch (status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
      return "PAST_DUE" as const;
    case "paused":
      return "PAUSED" as const;
    case "canceled":
      return "CANCELED" as const;
    default:
      return "INCOMPLETE" as const;
  }
}

export { isPaddleEnabled };
