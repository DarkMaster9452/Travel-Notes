import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/stripe/portal — manage or cancel an existing subscription. */
export async function POST() {
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

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ ok: false, message: "No billing account yet." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/profile`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
