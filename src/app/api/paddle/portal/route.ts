import { NextResponse } from "next/server";

import { isStaffRole } from "@/lib/admin/access";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getPaddle } from "@/lib/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/paddle/portal — manage or cancel an existing subscription. */
export async function POST() {
  const paddle = getPaddle();
  if (!paddle) {
    return NextResponse.json(
      { ok: false, message: "Billing isn't configured on this deployment." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Log in first." }, { status: 401 });
  }

  // Admin accounts have no customer side: nothing to bill, nothing to manage.
  if (isStaffRole(user.role)) {
    return NextResponse.json(
      { ok: false, message: "Admin accounts don't have a subscription." },
      { status: 403 },
    );
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { paddleCustomerId: true, paddleSubscriptionId: true },
  });

  if (!subscription?.paddleCustomerId) {
    return NextResponse.json({ ok: false, message: "No billing account yet." }, { status: 404 });
  }

  // Naming the subscription gets the portal to include its cancel and
  // update-payment links; without it the session opens on a bare overview.
  // An account that has a customer record but no subscription yet is a normal
  // state — it opens on the overview, which is the truthful page for it.
  const session = await paddle.customerPortalSessions.create(
    subscription.paddleCustomerId,
    subscription.paddleSubscriptionId ? [subscription.paddleSubscriptionId] : [],
  );

  return NextResponse.json({ ok: true, url: session.urls.general.overview });
}
