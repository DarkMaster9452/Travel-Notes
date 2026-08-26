import { NextResponse } from "next/server";

import { isStaffRole } from "@/lib/admin/access";
import { getCurrentUser } from "@/lib/auth/session";
import { linkCustomer } from "@/lib/billing";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { getStripe, priceIdFor } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/stripe/checkout — start an Explorer or Ultra Explorer subscription. */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { ok: false, message: "Billing isn't configured on this deployment." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Log in first." }, { status: 401 });
  }

  // A staff account has no allowance to lift and no quests to unlock, so
  // there is nothing for them to buy. Refused here as well as hidden in the UI: the
  // panel never renders a checkout button, and this is what makes that true
  // rather than merely tidy.
  if (isStaffRole(user.role)) {
    return NextResponse.json(
      { ok: false, message: "Staff accounts can't hold a subscription." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const interval = body?.interval === "yearly" ? "yearly" : "monthly";
  const plan = body?.plan === "ultra" ? "ultra" : "explorer";
  const priceId = priceIdFor(plan, interval);
  if (!priceId) {
    return NextResponse.json(
      { ok: false, message: "That plan isn't available right now." },
      { status: 503 },
    );
  }

  const existing = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  let customerId = existing?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await linkCustomer(user.id, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    // Metadata lands on the subscription, which is how the webhook maps an
    // event back to a user without trusting the browser. The plan rides along
    // as a fallback for the rare price id that isn't in this deployment's env.
    subscription_data: { metadata: { userId: user.id, plan } },
    success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/upgrade?checkout=cancelled`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json({ ok: false, message: "Stripe didn't return a checkout URL." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: session.url });
}
