"use server";

import { revalidatePath } from "next/cache";

import { isStaffRole } from "@/lib/admin/access";
import { requireClient } from "@/lib/auth/guards";
import { syncFromTransaction } from "@/lib/billing";
import {
  planById,
  planIdFromRecord,
  type BillingInterval,
  type Capability,
  type PlanId,
} from "@/lib/config";
import { db } from "@/lib/db";
import { queueNudge } from "@/lib/nudges";
import { priceIdFor } from "@/lib/paddle";

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
 * What a finished purchase tells the browser.
 *
 * `gains` is the plan's whole capability list rather than the difference
 * against what the account held a moment ago — that difference is unknowable
 * by the time this runs, because syncing has already overwritten the old
 * plan. Listing what the plan gives is the honest thing to show on a
 * celebration anyway.
 */
export type CheckoutResult =
  | { ok: true; plan: PlanId; name: string; gains: Capability[] }
  | { ok: false };

/**
 * Bring a completed checkout into our database before the webhook lands.
 *
 * The overlay closes the moment payment clears and hands back a transaction
 * id. That id is a claim, not proof — so it is taken to Paddle and checked
 * against the account asking, in `syncFromTransaction`. The webhook remains
 * the authority; this only stops the page from saying "free plan" to somebody
 * who has just paid.
 *
 * Two things ride on this beyond the sync, both of which used to belong to the
 * demo activation and would have been lost with it:
 *
 *   · The postal address is queued as a nudge for the following day, and only
 *     for a plan that actually posts. Asking in the middle of a celebration
 *     gets a worse answer than asking on its own the next day — and without
 *     this, nobody who pays would ever be asked, so the envelope would have
 *     nowhere to go.
 *   · The plan's name and capabilities come back so the browser can show the
 *     unlock celebration. It used to fire only on a free demo activation,
 *     which meant the one moment worth celebrating — somebody actually paying
 *     — was the one that got nothing.
 *
 * Returns `{ ok: false }` when Paddle has not caught up yet, which is a real
 * outcome rather than an error: the webhook will finish the job a moment later.
 */
export async function completeCheckoutAction(transactionId: string): Promise<CheckoutResult> {
  const user = await requireClient();

  if (typeof transactionId !== "string" || !transactionId.startsWith("txn_")) {
    return { ok: false };
  }

  const synced = await syncFromTransaction(transactionId, user.id);
  if (!synced) return { ok: false };

  // Read back what the sync actually wrote rather than trusting what checkout
  // was opened for. The price is the authority on which tier was bought, and
  // the browser is not.
  const row = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });
  const plan = planIdFromRecord(row?.plan);
  const definition = planById(plan);

  if (definition.capabilities.includes("mail")) {
    await queueNudge(
      user.id,
      "SHIPPING_ADDRESS",
      { plan, activatedAt: new Date().toISOString() },
      new Date(),
    );
  }

  revalidatePath("/settings/billing");
  revalidatePath("/dashboard");
  revalidatePath("/stickers");

  return { ok: true, plan, name: definition.name, gains: [...definition.capabilities] };
}
