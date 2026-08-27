"use server";

import { revalidatePath } from "next/cache";

import { isStaffRole } from "@/lib/admin/access";
import { requireClient } from "@/lib/auth/guards";
import { syncFromTransaction } from "@/lib/billing";
import { planById, type BillingInterval, type PlanId } from "@/lib/config";
import { db } from "@/lib/db";
import { isDemoPlans } from "@/lib/env";
import { queueNudge } from "@/lib/nudges";
import { priceIdFor } from "@/lib/paddle";
import type { Plan } from "@prisma/client";

export type ActivateResult =
  | { ok: true; plan: PlanId; name: string }
  | { ok: false; message: string };

/** A demo activation runs for a year. Long enough to stop being a question. */
const DEMO_PERIOD_DAYS = 365;

const PLAN_RECORD: Record<PlanId, Plan> = {
  free: "FREE",
  explorer: "EXPLORER",
  ultra: "ULTRA",
};

/**
 * Turn a plan on without taking any money.
 *
 * This is the demo path, and it is deliberately the *same* path as the paid
 * one from the entitlement's point of view: it writes the same subscription
 * row, with the same plan and the same active status, so every capability
 * check, sticker allowance and locked panel behaves exactly as it will when
 * Paddle is wired up. The only thing that marks it is `demo`, and the only
 * thing that reads that is the revenue page, which must not count it as money.
 *
 * Two things it does not do. It does not ask for a postal address — that ask
 * is queued for a day later (`queueNudge`), because a form in the middle of a
 * celebration is answered worse than one that arrives on its own. And it does
 * not touch a real Paddle subscription: an account that is actually paying is
 * refused here rather than having its billing quietly rewritten.
 */
export async function activatePlanAction(planId: string): Promise<ActivateResult> {
  const user = await requireClient();

  if (!isDemoPlans()) {
    return { ok: false, message: "Plans are bought through checkout on this deployment." };
  }

  // Belt and braces: `requireClient` already refuses staff, but this is the
  // function that hands out entitlements and it should say no on its own.
  if (isStaffRole(user.role)) {
    return { ok: false, message: "Staff accounts can't hold a subscription." };
  }

  if (planId !== "explorer" && planId !== "ultra" && planId !== "free") {
    return { ok: false, message: "That isn't a plan." };
  }
  const plan = planId as PlanId;
  const definition = planById(plan);

  const existing = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { paddleSubscriptionId: true, demo: true, plan: true },
  });

  if (existing?.paddleSubscriptionId && !existing.demo) {
    return {
      ok: false,
      message: "This account has a real subscription — change it through the billing portal.",
    };
  }

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + DEMO_PERIOD_DAYS);

  const values = {
    plan: PLAN_RECORD[plan],
    status: "ACTIVE" as const,
    demo: true,
    cancelAtPeriodEnd: false,
    currentPeriodStart: now,
    currentPeriodEnd: plan === "free" ? null : end,
  };

  await db.subscription.upsert({
    where: { userId: user.id },
    update: values,
    create: { userId: user.id, ...values },
  });

  // The envelope is the one thing a plan can include that needs something
  // back from the member. Ask for it later, and only for a plan that posts.
  if (definition.capabilities.includes("mail")) {
    await queueNudge(user.id, "SHIPPING_ADDRESS", { plan, activatedAt: now.toISOString() }, now);
  }

  revalidatePath("/settings/billing");
  revalidatePath("/dashboard");
  revalidatePath("/stickers");

  return { ok: true, plan, name: definition.name };
}

/* -------------------------------------------------------------------------- */
/* The real thing                                                              */
/* -------------------------------------------------------------------------- */

export type CheckoutIntent =
  | { ok: true; priceId: string; customerId: string | null; email: string; custom: { userId: string; plan: string } }
  | { ok: false; message: string };

/**
 * Everything the browser needs to open a Paddle checkout, and nothing more.
 *
 * Paddle has no server-created checkout session: the overlay is opened by
 * Paddle.js in the browser, with a price id. That moves a decision the server
 * used to make — *which* price, and for whom — into the client, so this action
 * makes it on the server anyway and hands over only the answer. The browser
 * never picks a price id; it is told one.
 *
 * The account checks are the same ones the old checkout route made, and they
 * are made here for the same reason: the panel never renders a buy button, and
 * this is what makes that true rather than merely tidy.
 *
 * Note what this deliberately does *not* do: grant anything. It returns
 * intent. Entitlement changes only when Paddle says money moved, through the
 * webhook or through `syncFromTransaction`, both of which read Paddle rather
 * than the browser.
 */
export async function startCheckoutAction(
  planId: string,
  intervalId: string,
): Promise<CheckoutIntent> {
  const user = await requireClient();

  if (isStaffRole(user.role)) {
    return { ok: false, message: "Staff accounts can't hold a subscription." };
  }

  if (planId !== "explorer" && planId !== "ultra") {
    return { ok: false, message: "That isn't a plan you can buy." };
  }
  const interval: BillingInterval = intervalId === "yearly" ? "yearly" : "monthly";

  const priceId = priceIdFor(planId, interval);
  if (!priceId) {
    return { ok: false, message: "That plan isn't available right now." };
  }

  // Reuse the customer Paddle already knows about, so a second purchase does
  // not create a second customer record with the same email — Paddle would
  // accept it, and the account's history would then be split across two.
  const existing = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { paddleCustomerId: true },
  });

  return {
    ok: true,
    priceId,
    customerId: existing?.paddleCustomerId ?? null,
    email: user.email,
    custom: { userId: user.id, plan: planId },
  };
}

/**
 * Bring a completed checkout into our database before the webhook lands.
 *
 * The overlay closes the moment payment clears and hands back a transaction
 * id. That id is a claim, not proof — so it is taken to Paddle and checked
 * against the account asking, in `syncFromTransaction`. The webhook remains
 * the authority; this only stops the page from saying "free plan" to somebody
 * who has just paid.
 *
 * Returns false when Paddle has not caught up yet, which is a real outcome
 * rather than an error: the webhook will finish the job a moment later.
 */
export async function completeCheckoutAction(transactionId: string): Promise<boolean> {
  const user = await requireClient();

  if (typeof transactionId !== "string" || !transactionId.startsWith("txn_")) return false;

  const synced = await syncFromTransaction(transactionId, user.id);
  if (!synced) return false;

  revalidatePath("/settings/billing");
  revalidatePath("/dashboard");
  revalidatePath("/stickers");
  return true;
}
