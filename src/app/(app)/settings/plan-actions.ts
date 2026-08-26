"use server";

import { revalidatePath } from "next/cache";

import { isStaffRole } from "@/lib/admin/access";
import { requireClient } from "@/lib/auth/guards";
import { planById, type PlanId } from "@/lib/config";
import { db } from "@/lib/db";
import { isDemoPlans } from "@/lib/env";
import { queueNudge } from "@/lib/nudges";
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
 * Stripe is wired up. The only thing that marks it is `demo`, and the only
 * thing that reads that is the revenue page, which must not count it as money.
 *
 * Two things it does not do. It does not ask for a postal address — that ask
 * is queued for a day later (`queueNudge`), because a form in the middle of a
 * celebration is answered worse than one that arrives on its own. And it does
 * not touch a real Stripe subscription: an account that is actually paying is
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
    select: { stripeSubscriptionId: true, demo: true, plan: true },
  });

  if (existing?.stripeSubscriptionId && !existing.demo) {
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
