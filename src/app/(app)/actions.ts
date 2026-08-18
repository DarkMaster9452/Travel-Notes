"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAchievements } from "@/lib/achievements";
import { requireClient, requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isWithinRefundWindow } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";
import { getStripe } from "@/lib/stripe";
import { LOCATIONS } from "@/lib/quest/locations";
import { getUserStats, unlockQuestForUser } from "@/lib/quest/service";
import { questIdSchema } from "@/lib/validation";

/**
 * The two things a signed-in account can do to a quest: be issued one, and log
 * one. There is no saving and no browsing — you do not pick the hike, it is
 * assigned, which is the whole premise.
 */

export type IssueState =
  | { ok: true; questId: string; title: string }
  | { ok: false; message: string }
  | undefined;

/** Paths whose content changes when a quest is issued or logged. */
const QUEST_PATHS = ["/dashboard", "/history", "/achievements"];

function revalidateQuestPaths(questId?: string) {
  for (const path of QUEST_PATHS) revalidatePath(path);
  if (questId) revalidatePath(`/quests/${questId}`);
}

/**
 * Issue a quest.
 *
 * Somewhere the account has not been sent is preferred — that is the promise
 * the landing page makes, and it is why accounts exist — but someone who has
 * worked through the whole catalogue still gets a quest rather than an error.
 *
 * Every guard that matters (entitlement, rate limit, quota) lives in
 * `unlockQuestForUser`, on the server, reading database state.
 */
export async function issueQuestAction(): Promise<IssueState> {
  const user = await requireClient();

  const visited = await db.questHistory.findMany({
    where: { userId: user.id },
    select: { quest: { select: { location: true } } },
  });
  const seen = new Set(visited.map((entry) => entry.quest.location));

  const unseen = LOCATIONS.filter((location) => !seen.has(location.name));
  const pool = unseen.length > 0 ? unseen : LOCATIONS;
  const pick = pool[Math.floor(Math.random() * pool.length)]!;

  const outcome = await unlockQuestForUser(user.id, pick.id);
  if (!outcome.ok) return { ok: false, message: outcome.message };

  revalidateQuestPaths(outcome.quest.id);
  return { ok: true, questId: outcome.quest.id, title: outcome.quest.title };
}

const proofSchema = z.object({
  questId: z.string().trim().min(1).max(60),
  note: z.string().trim().min(10, "Tell us what happened.").max(2000),
  stravaUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  distance: z.coerce.number().min(0).max(500).optional(),
  elevation: z.coerce.number().int().min(0).max(20000).optional(),
  movingTime: z.coerce.number().int().min(0).max(20000).optional(),
  retreated: z.coerce.boolean().optional(),
});

export type ProofResult = { ok: boolean; message?: string };

/**
 * File proof that a quest was done.
 *
 * This replaces marking a quest complete by hand. Nothing counts until an
 * admin has read it — so this only records the claim and the evidence, and
 * `reviewSubmissionAction` on the other side of the desk is what writes the
 * quest into history.
 *
 * Ownership runs through `quest_history`: proof can only be filed for a quest
 * this account was actually issued.
 */
export async function submitProofAction(formData: FormData): Promise<ProofResult> {
  const user = await requireClient();

  const parsed = proofSchema.safeParse({
    questId: formData.get("questId"),
    note: formData.get("note"),
    stravaUrl: formData.get("stravaUrl") || undefined,
    distance: formData.get("distance") || undefined,
    elevation: formData.get("elevation") || undefined,
    movingTime: formData.get("movingTime") || undefined,
    retreated: formData.get("retreated") === "true",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const proof = parsed.data;

  const photos = String(formData.get("photos") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//.test(line))
    .slice(0, 6);

  // At least one photo is required — a written account alone isn't proof
  // somebody can approve, and this is checked here rather than left to the
  // form, since the form is not the authority on what a submission needs.
  if (photos.length === 0) {
    return { ok: false, message: "Add at least one photo link before filing." };
  }

  const history = await db.questHistory.findUnique({
    where: { userId_questId: { userId: user.id, questId: proof.questId } },
    select: { id: true },
  });
  if (!history) return { ok: false, message: "That quest isn't yours." };

  const values = {
    note: proof.note,
    photos,
    stravaUrl: proof.stravaUrl || null,
    distance: proof.distance ?? null,
    elevation: proof.elevation ?? null,
    movingTime: proof.movingTime ?? null,
    retreated: proof.retreated ?? false,
    // Re-filing after a decline puts it back in the queue rather than opening
    // a second row: one submission per person per quest, edited in place.
    status: "PENDING" as const,
    reviewedById: null,
    reviewedAt: null,
    reviewNote: null,
  };

  await db.submission.upsert({
    where: { userId_questId: { userId: user.id, questId: proof.questId } },
    update: values,
    create: { userId: user.id, questId: proof.questId, ...values },
  });

  revalidateQuestPaths(proof.questId);
  return { ok: true };
}

export type LogResult = {
  ok: boolean;
  completed?: boolean;
  error?: string;
  /** Stickers that unlocked because of this log. */
  unlocked?: { id: string; label: string; description: string }[];
};

/**
 * Log a quest as done, or take the log back.
 *
 * Ownership runs through `quest_history`: without a row linking this account
 * to this quest, the action refuses, so another account's quest id changes
 * nothing.
 */
export async function logQuestAction(rawQuestId: string): Promise<LogResult> {
  const user = await requireClient();
  const parsed = questIdSchema.safeParse(rawQuestId);
  if (!parsed.success) return { ok: false, error: "Unknown quest." };
  const questId = parsed.data;

  const history = await db.questHistory.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
    select: { id: true, completed: true },
  });
  if (!history) return { ok: false, error: "That quest isn't yours." };

  // Snapshot what was already earned, so the difference afterwards is exactly
  // what this log unlocked. Recomputing thresholds by hand here would drift
  // from the achievement definitions the moment either side changed.
  //
  // The plan is passed on both sides: stickers past this account's allowance
  // are never "earned", so the ceremony can't announce one the account cannot
  // actually hold.
  const { plan } = await getEntitlement(user.id);
  const before = new Set(
    getAchievements(await getUserStats(user.id), plan)
      .filter((achievement) => achievement.earned)
      .map((achievement) => achievement.id),
  );

  const completed = !history.completed;
  await db.questHistory.update({
    where: { id: history.id },
    data: { completed, completedAt: completed ? new Date() : null },
  });

  const unlocked = completed
    ? getAchievements(await getUserStats(user.id), plan)
        .filter((achievement) => achievement.earned && !before.has(achievement.id))
        .map(({ id, label, description }) => ({ id, label, description }))
    : [];

  revalidateQuestPaths(questId);
  return { ok: true, completed, unlocked };
}

/* -------------------------------------------------------------------------- */
/* Appearance                                                                  */
/* -------------------------------------------------------------------------- */

const themeSchema = z.enum(["SYSTEM", "LIGHT", "DARK"]);

/**
 * Set the palette the signed-in app renders in.
 *
 * Stored on the account rather than in `localStorage` so the server can put
 * the right palette on the shell in its first response. A theme read on the
 * client after hydration is a theme that arrives one paint too late, and the
 * flash of the wrong one is exactly what someone turning on dark mode is
 * trying to get away from.
 *
 * Admins share the setting — it is a property of the person, not of which
 * side of the product they happen to be looking at.
 */
export async function setThemeAction(value: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = themeSchema.safeParse(value);
  if (!parsed.success) return { ok: false };

  await db.user.update({ where: { id: user.id }, data: { theme: parsed.data } });

  // Every signed-in surface reads the theme off the shell, so the whole
  // authenticated tree is stale after this, not just the page that set it.
  revalidatePath("/", "layout");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Membership                                                                  */
/* -------------------------------------------------------------------------- */

export type CancelResult = {
  ok: boolean;
  message?: string;
  /** True when the cancellation was inside the guarantee and money is coming back. */
  refunded?: boolean;
};

/**
 * Cancel a subscription.
 *
 * Two different things depending on when you ask, and the difference is the
 * whole point of the guarantee:
 *
 *  · Inside the first week — cancelled immediately and refunded in full. You
 *    lose access now, because you are getting the money back for it.
 *  · After that — cancelled at the end of the period you have already paid
 *    for. Access holds until then; nothing is clawed back.
 *
 * Stripe is the payment authority but not the access authority: the
 * subscription row is updated either way, so a deployment without Stripe keys
 * still cancels properly instead of silently doing nothing.
 */
export async function cancelPlanAction(): Promise<CancelResult> {
  const user = await requireClient();

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
      plan: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeSubscriptionId: true,
    },
  });

  if (!subscription || subscription.plan === "FREE") {
    return { ok: false, message: "There's no paid plan on this account." };
  }
  if (subscription.cancelAtPeriodEnd) {
    return { ok: false, message: "That plan is already set to stop." };
  }

  const withinGuarantee = isWithinRefundWindow(subscription.currentPeriodStart);

  const stripe = getStripe();
  if (stripe && subscription.stripeSubscriptionId) {
    try {
      if (withinGuarantee) {
        // Cancel now and refund the latest invoice. Refunding before
        // cancelling would leave a paid-for subscription with no money
        // behind it if the cancel then failed.
        const live = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        const invoiceId =
          typeof live.latest_invoice === "string" ? live.latest_invoice : live.latest_invoice?.id;

        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

        if (invoiceId) {
          // On this API version an invoice links to its money through
          // `payments`, not a bare `payment_intent`, so it has to be expanded
          // to find what to refund.
          const invoice = await stripe.invoices.retrieve(invoiceId, { expand: ["payments"] });
          const payment = invoice.payments?.data.find(
            (entry) => entry.payment?.payment_intent || entry.payment?.charge,
          );
          const intent = payment?.payment.payment_intent;
          const charge = payment?.payment.charge;

          const paymentIntentId = typeof intent === "string" ? intent : intent?.id;
          const chargeId = typeof charge === "string" ? charge : charge?.id;

          if (paymentIntentId) {
            await stripe.refunds.create({ payment_intent: paymentIntentId });
          } else if (chargeId) {
            await stripe.refunds.create({ charge: chargeId });
          }
        }
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch {
      return {
        ok: false,
        message: "Stripe wouldn't accept that just now. Nothing was changed — try again.",
      };
    }
  }

  await db.subscription.update({
    where: { id: subscription.id },
    data: withinGuarantee
      ? { status: "CANCELED", cancelAtPeriodEnd: false, currentPeriodEnd: new Date() }
      : { cancelAtPeriodEnd: true },
  });

  revalidatePath("/upgrade");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");

  return {
    ok: true,
    refunded: withinGuarantee,
    message: withinGuarantee
      ? "Cancelled and refunded in full."
      : "Cancelled. You keep everything until the period ends.",
  };
}
