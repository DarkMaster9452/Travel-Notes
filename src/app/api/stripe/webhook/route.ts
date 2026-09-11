import { NextResponse } from "next/server";

import { markPaymentFailed, syncSubscription } from "@/lib/billing";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 *
 * The only way subscription state changes. Every request is verified against
 * the signing secret before it is read — an unsigned or replayed body is
 * rejected outright, so nobody can grant themselves a subscription by posting
 * here.
 *
 * `constructEventAsync` does the verification and the parsing together and
 * will not hand back an event it could not authenticate, which is why there is
 * no separate "is this valid" step to forget. It also rejects a signature
 * whose timestamp is too old, so a body captured off the wire cannot be
 * replayed later.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: false, reason: "not_configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ received: false, reason: "missing_signature" }, { status: 400 });
  }

  // The raw body is required for signature verification — do not parse first.
  const payload = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("[stripe] signature verification failed", error);
    return NextResponse.json({ received: false, reason: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Every subscription event carries the whole subscription, so there is
      // nothing to fetch back: the payload *is* the state.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object);
        break;
      }

      // A failed charge does not change the subscription's status by itself —
      // Stripe moves it to `past_due` separately, and that arrives as a
      // subscription event. This is here so the row reflects the failure at
      // the moment it happens rather than whenever the second event lands.
      case "invoice.payment_failed": {
        const customer = event.data.object.customer;
        const customerId = typeof customer === "string" ? customer : customer?.id;
        if (customerId) await markPaymentFailed(customerId);
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (error) {
    // Returning 500 asks Stripe to retry, which is what we want for a
    // transient database failure.
    console.error(`[stripe] handler failed for ${event.type}`, error);
    return NextResponse.json({ received: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
