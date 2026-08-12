import { NextResponse } from "next/server";
import type Stripe from "stripe";

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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("[stripe] signature verification failed", error);
    return NextResponse.json({ received: false, reason: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        await syncSubscription(event.data.object);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) await markPaymentFailed(customerId);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscriptionField = (invoice as unknown as { subscription?: string | { id: string } })
          .subscription;
        const subscriptionId =
          typeof subscriptionField === "string" ? subscriptionField : subscriptionField?.id;
        if (subscriptionId) {
          await syncSubscription(await stripe.subscriptions.retrieve(subscriptionId));
        }
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
