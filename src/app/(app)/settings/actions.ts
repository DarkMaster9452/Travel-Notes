"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireClient } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { isPostable } from "@/lib/envelope";
import { completeNudge } from "@/lib/nudges";
import { getStripe } from "@/lib/stripe";

export type SettingsResult = { ok: boolean; message?: string };

/* -------------------------------------------------------------------------- */
/* How the product is read                                                     */
/* -------------------------------------------------------------------------- */

const displaySchema = z.object({
  units: z.enum(["METRIC", "IMPERIAL"]),
  language: z.enum(["en", "sk"]),
  expertStats: z.coerce.boolean().optional(),
});

/**
 * Units, language, and the extra figures.
 *
 * `expertStats` is checked against the entitlement rather than trusted: the
 * switch is disabled on a free plan, and a form that could set it anyway would
 * make the disabled state decoration.
 */
export async function saveDisplayAction(formData: FormData): Promise<SettingsResult> {
  const user = await requireClient();

  const parsed = displaySchema.safeParse({
    units: formData.get("units"),
    language: formData.get("language"),
    expertStats: formData.get("expertStats") === "true",
  });
  if (!parsed.success) return { ok: false, message: "Those settings didn't make sense." };

  const entitlement = await getEntitlement(user.id);
  const expertStats = parsed.data.expertStats === true && entitlement.isSubscribed;

  const values = { units: parsed.data.units, language: parsed.data.language, expertStats };
  await db.displaySettings.upsert({
    where: { userId: user.id },
    update: values,
    create: { userId: user.id, ...values },
  });

  revalidatePath("/settings/units");
  revalidatePath("/settings/general");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Where the envelope goes                                                     */
/* -------------------------------------------------------------------------- */

const addressSchema = z.object({
  recipient: z.string().trim().max(80).optional().or(z.literal("")),
  line1: z.string().trim().max(120).optional().or(z.literal("")),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  postcode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(60),
});

export async function saveAddressAction(formData: FormData): Promise<SettingsResult> {
  const user = await requireClient();

  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "That address didn't save." };

  const values = {
    recipient: parsed.data.recipient || null,
    line1: parsed.data.line1 || null,
    line2: parsed.data.line2 || null,
    city: parsed.data.city || null,
    postcode: parsed.data.postcode || null,
    country: parsed.data.country,
  };

  await db.shippingAddress.upsert({
    where: { userId: user.id },
    update: values,
    create: { userId: user.id, ...values },
  });

  // The ask is answered by an address that could actually be posted to, not by
  // the act of opening the form. A row with only a country in it leaves the
  // notice standing, which is correct: there is still nowhere to send anything.
  if (isPostable(values)) await completeNudge(user.id, "SHIPPING_ADDRESS");

  revalidatePath("/settings/address");
  revalidatePath("/settings/billing");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Which emails                                                                */
/* -------------------------------------------------------------------------- */

export async function saveNotificationsAction(formData: FormData): Promise<SettingsResult> {
  const user = await requireClient();

  const values = {
    questDrop: formData.get("questDrop") === "true",
    verdict: formData.get("verdict") === "true",
    boardSealed: formData.get("boardSealed") === "true",
    productNews: formData.get("productNews") === "true",
  };

  await db.notificationSettings.upsert({
    where: { userId: user.id },
    update: values,
    create: { userId: user.id, ...values },
  });

  revalidatePath("/settings/notifications");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Password                                                                    */
/* -------------------------------------------------------------------------- */

const passwordSchema = z.object({
  current: z.string().min(1, "Type your current password."),
  next: z.string().min(10, "A new password needs at least ten characters.").max(200),
});

/**
 * Change the password, and end every other session.
 *
 * Changing a password is usually somebody saying "make the other one stop
 * working". Leaving old sessions alive would make it a suggestion rather than
 * a change, so every session but nothing-in-particular is revoked and the
 * browser doing the changing signs in again.
 */
export async function changePasswordAction(formData: FormData): Promise<SettingsResult> {
  const user = await requireClient();

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That won't do." };
  }

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return { ok: false, message: "That account is gone." };

  if (!(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { ok: false, message: "That is not your current password." };
  }

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.next) },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return { ok: true, message: "Password changed. Every session has been signed out." };
}

/* -------------------------------------------------------------------------- */
/* Pause                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Pause billing for a month.
 *
 * Stripe's own `pause_collection` rather than a flag of ours: a pause that
 * only this app knew about would still be charged. Resuming clears it, and
 * everything already earned is untouched either way.
 */
export async function pausePlanAction(months = 1): Promise<SettingsResult> {
  const user = await requireClient();
  const stripe = getStripe();
  if (!stripe) return { ok: false, message: "Billing isn't configured on this deployment." };

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeSubscriptionId: true },
  });
  if (!subscription?.stripeSubscriptionId) {
    return { ok: false, message: "There is no live subscription to pause." };
  }

  const resumesAt = new Date();
  resumesAt.setMonth(resumesAt.getMonth() + Math.min(3, Math.max(1, months)));

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    pause_collection: { behavior: "void", resumes_at: Math.floor(resumesAt.getTime() / 1000) },
  });

  await db.subscription.update({
    where: { userId: user.id },
    data: { status: "PAUSED" },
  });

  revalidatePath("/settings/cancel");
  revalidatePath("/settings/billing");
  return { ok: true, message: `Paused until ${resumesAt.toLocaleDateString("en-GB")}.` };
}

export async function resumePlanAction(): Promise<SettingsResult> {
  const user = await requireClient();
  const stripe = getStripe();
  if (!stripe) return { ok: false, message: "Billing isn't configured on this deployment." };

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeSubscriptionId: true },
  });
  if (!subscription?.stripeSubscriptionId) {
    return { ok: false, message: "There is nothing paused." };
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    pause_collection: null,
  });
  await db.subscription.update({ where: { userId: user.id }, data: { status: "ACTIVE" } });

  revalidatePath("/settings/cancel");
  revalidatePath("/settings/billing");
  return { ok: true, message: "Billing resumed." };
}
