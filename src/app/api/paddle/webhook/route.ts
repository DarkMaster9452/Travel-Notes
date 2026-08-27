import { NextResponse } from "next/server";

import { markPaymentFailed, syncSubscription } from "@/lib/billing";
import { env } from "@/lib/env";
import { getPaddle } from "@/lib/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/paddle/webhook
 *
 * The only way subscription state changes. Every request is verified against
 * the signing secret before it is read — an unsigned or replayed body is
 * rejected outright, so nobody can grant themselves a subscription by posting
 * here.
 *
 * `unmarshal` does the verification and the parsing together and will not hand
 * back an event it could not authenticate, which is why there is no separate
 * "is this valid" step to forget. Paddle's validator also rejects a signature
 * whose timestamp is too old, so a body captured off the wire cannot be
 * replayed later.
 */
export async function POST(request: Request) {
  const paddle = getPaddle();
  if (!paddle || !env.PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: false, reason: "not_configured" }, { status: 503 });
  }

  const signature = request.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ received: false, reason: "missing_signature" }, { status: 400 });
  }

  // The raw body is required for signature verification — do not parse first.
  const payload = await request.text();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(payload, env.PADDLE_WEBHOOK_SECRET, signature);
  } catch (error) {
    console.error("[paddle] signature verification failed", error);
    return NextResponse.json({ received: false, reason: "bad_signature" }, { status: 400 });
  }

  if (!event) {
    return NextResponse.json({ received: false, reason: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.eventType) {
      // Every subscription event carries the whole subscription, so unlike
      // Stripe there is nothing to fetch back: the payload *is* the state.
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.paused":
      case "subscription.resumed":
      case "subscription.past_due":
      case "subscription.trialing": {
        await syncSubscription(event.data);
        break;
      }

      // A failed charge does not change the subscription's status by itself —
      // Paddle moves it to `past_due` separately, and that arrives as a
      // subscription event. This is here so the row reflects the failure at
      // the moment it happens rather than whenever the second event lands.
      case "transaction.payment_failed": {
        const customerId = event.data.customerId;
        if (customerId) await markPaymentFailed(customerId);
        break;
      }

      default:
        // Unhandled event types are acknowledged so Paddle stops retrying.
        break;
    }
  } catch (error) {
    // Returning 500 asks Paddle to retry, which is what we want for a
    // transient database failure.
    console.error(`[paddle] handler failed for ${event.eventType}`, error);
    return NextResponse.json({ received: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
