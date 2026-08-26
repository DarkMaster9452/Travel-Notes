"use server";

import type { SchedulePeriod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAchievements } from "@/lib/achievements";
import { requireClient, requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isWithinRefundWindow } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";
import { getStripe } from "@/lib/stripe";
import { LOCATIONS } from "@/lib/quest/locations";
import { getFeaturedQuest, materialiseFeatured } from "@/lib/quest/featured";
import { getUserStats, unlockQuestForUser } from "@/lib/quest/service";
import {
  activityIdFrom,
  disconnectStrava,
  getActivity,
  getStravaConnection,
} from "@/lib/strava";
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
 * No account is ever sent the same quest twice. The engine enforces that on
 * the signature — the place, the shape and the timing together — and refuses
 * rather than repeating; this side of it only decides the order in which
 * places are offered up.
 *
 * That order is: somewhere new first, in random order, because being sent
 * somewhere you have never been is the point of the product. Once the whole
 * catalogue has been visited the places come back round, longest-ago first,
 * and the engine builds a different day out of the same ground — a second
 * visit to a valley is not a repeat, being handed the same walk is.
 *
 * Every guard that matters (entitlement, rate limit, quota) lives in
 * `unlockQuestForUser`, on the server, reading database state.
 */
export async function issueQuestAction(): Promise<IssueState> {
  const user = await requireClient();

  const visited = await db.questHistory.findMany({
    where: { userId: user.id },
    orderBy: { generatedAt: "desc" },
    select: { generatedAt: true, quest: { select: { location: true } } },
  });

  // Newest first, so the first sighting recorded for a place is the latest.
  const lastSeen = new Map<string, number>();
  for (const entry of visited) {
    if (!lastSeen.has(entry.quest.location)) {
      lastSeen.set(entry.quest.location, entry.generatedAt.getTime());
    }
  }

  const unseen = shuffle(LOCATIONS.filter((location) => !lastSeen.has(location.name)));
  const revisit = LOCATIONS.filter((location) => lastSeen.has(location.name)).sort(
    (a, b) => lastSeen.get(a.name)! - lastSeen.get(b.name)!,
  );

  const outcome = await unlockQuestForUser(
    user.id,
    [...unseen, ...revisit].map((location) => location.id),
  );
  if (!outcome.ok) return { ok: false, message: outcome.message };

  revalidateQuestPaths(outcome.quest.id);
  return { ok: true, questId: outcome.quest.id, title: outcome.quest.title };
}

/** Fisher–Yates. Order matters here, so a comparator returning noise won't do. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const proofSchema = z.object({
  note: z.string().trim().min(10, "Tell us what happened.").max(2000),
  stravaUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  distance: z.coerce.number().min(0).max(500).optional(),
  elevation: z.coerce.number().int().min(0).max(20000).optional(),
  movingTime: z.coerce.number().int().min(0).max(20000).optional(),
  retreated: z.coerce.boolean().optional(),
  /** The day it happened, which is not the day it was filed. The leaderboard
   *  counts a quest into the week it was walked, so somebody who went on
   *  Sunday and wrote it up on Tuesday lands on the right board. */
  startedAt: z.coerce.date().optional(),
  // The parts of the form that describe the person rather than the day.
  usualStart: z.string().trim().max(5).optional().or(z.literal("")),
  partySize: z.coerce.number().int().min(1).max(40).optional(),
  gear: z.string().trim().max(300).optional().or(z.literal("")),
  pace: z.coerce.number().min(0).max(60).optional(),
  stravaProfile: z.string().trim().url().max(300).optional().or(z.literal("")),
  /** The checkbox. Nothing about the account changes unless this is ticked. */
  saveDetails: z.coerce.boolean().optional(),
});

export type ProofResult = { ok: boolean; message?: string };

/** Photo links, one per line, as the form collects them. */
function readPhotos(formData: FormData): string[] {
  return String(formData.get("photos") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//.test(line))
    .slice(0, 6);
}

/**
 * Which slot, if any, a quest is being logged against right now.
 *
 * Read at filing time and then stored on the submission, because the answer
 * expires: proof filed on Sunday evening is proof of that week's quest, and
 * the same question asked on Tuesday would say no. It is what puts the
 * submission at the front of the review queue and what the leaderboard scores
 * as a featured finish, so it has to describe the moment it was filed.
 */
async function cadenceForFiling(
  questId: string,
  now = new Date(),
): Promise<{ period: SchedulePeriod; slotKey: string } | null> {
  const slot = await db.questSchedule.findFirst({
    where: { questId, openAt: { lte: now }, closeAt: { gt: now } },
    // The monthly outranks the weekly where a quest somehow fills both.
    orderBy: { period: "asc" },
    select: { period: true, slotKey: true },
  });
  return slot ? { period: slot.period, slotKey: slot.slotKey } : null;
}

type Proof = z.infer<typeof proofSchema> & { photos: string[] };

/**
 * Read and check the form, before anything is written.
 *
 * Separate from filing because the two callers need it at different moments:
 * logging a featured quest has to resolve (and, for a generated one, create)
 * the quest row it will point at, and doing that for a form that turns out to
 * be missing its photograph would leave a quest in somebody's history that
 * they never filed anything against.
 */
function readProof(formData: FormData): { ok: true; proof: Proof } | { ok: false; message: string } {
  const parsed = proofSchema.safeParse({
    note: formData.get("note"),
    stravaUrl: formData.get("stravaUrl") || undefined,
    distance: formData.get("distance") || undefined,
    elevation: formData.get("elevation") || undefined,
    movingTime: formData.get("movingTime") || undefined,
    retreated: formData.get("retreated") === "true",
    startedAt: formData.get("startedAt") || undefined,
    usualStart: formData.get("usualStart") || undefined,
    partySize: formData.get("partySize") || undefined,
    gear: formData.get("gear") || undefined,
    pace: formData.get("pace") || undefined,
    stravaProfile: formData.get("stravaProfile") || undefined,
    saveDetails: formData.get("saveDetails") === "true",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  // A day in the future is a typo, not a walk. Rejected rather than clamped:
  // the date decides which leaderboard the quest lands on, so quietly moving
  // it would put somebody on a board they never asked for.
  if (parsed.data.startedAt && parsed.data.startedAt.getTime() > Date.now()) {
    return { ok: false, message: "That date hasn't happened yet." };
  }

  const photos = readPhotos(formData);

  // At least one photo is required — a written account alone isn't proof
  // somebody can approve, and this is checked here rather than left to the
  // form, since the form is not the authority on what a submission needs.
  if (photos.length === 0) {
    return { ok: false, message: "Add at least one photo link before filing." };
  }

  return { ok: true, proof: { ...parsed.data, photos } };
}

/**
 * File proof that a quest was done.
 *
 * This replaces marking a quest complete by hand. Nothing counts until an
 * admin has read it — so this only records the claim and the evidence, and
 * `reviewSubmissionAction` on the other side of the desk is what writes the
 * quest into history.
 *
 * Proof can be filed against any quest in the catalogue, not only one this
 * account was issued. Somebody who walked a route on Saturday should be able
 * to log it on Sunday, and refusing because the generator had not handed them
 * that particular quest was a rule about our bookkeeping rather than about
 * their day. Filing is not an unlock: it writes the history row it needs and
 * spends no quota, because nothing was issued.
 *
 * What is still refused is a quest nobody can see — an unpublished one that
 * is not already this account's, which is what another account's generated
 * quest looks like from here.
 */
async function fileProof(
  userId: string,
  questId: string,
  proof: Proof,
  cadence?: { period: SchedulePeriod; slotKey: string } | null,
): Promise<ProofResult> {
  const quest = await db.quest.findUnique({
    where: { id: questId },
    select: {
      id: true,
      published: true,
      isShowcase: true,
      history: { where: { userId }, select: { id: true }, take: 1 },
    },
  });
  if (!quest) return { ok: false, message: "That quest is gone." };

  const owned = quest.history.length > 0;
  if (!owned && !(quest.published && quest.isShowcase)) {
    return { ok: false, message: "That quest isn't open to file against." };
  }

  const stamp = cadence === undefined ? await cadenceForFiling(questId) : cadence;

  const values = {
    note: proof.note,
    photos: proof.photos,
    stravaUrl: proof.stravaUrl || null,
    distance: proof.distance ?? null,
    elevation: proof.elevation ?? null,
    movingTime: proof.movingTime ?? null,
    retreated: proof.retreated ?? false,
    startedAt: proof.startedAt ?? null,
    period: stamp?.period ?? null,
    slotKey: stamp?.slotKey ?? null,
    // Re-filing after a decline puts it back in the queue rather than opening
    // a second row: one submission per person per quest, edited in place.
    status: "PENDING" as const,
    reviewedById: null,
    reviewedAt: null,
    reviewNote: null,
  };

  await db.$transaction(async (tx) => {
    // Filing against a quest that was never issued still needs the history
    // row: it is what an approval marks complete, and what the stats and the
    // sticker sheet are computed from.
    if (!owned) {
      await tx.questHistory.upsert({
        where: { userId_questId: { userId, questId } },
        update: {},
        create: { userId, questId },
      });
    }

    await tx.submission.upsert({
      where: { userId_questId: { userId, questId } },
      update: values,
      create: { userId, questId, ...values },
    });
  });

  // Only if asked. Filing a log is not consent to rewrite your account, and a
  // form that quietly remembered things would be the kind of surprise that
  // makes people stop filling forms in honestly.
  if (proof.saveDetails) {
    const defaults = {
      stravaProfile: proof.stravaProfile || null,
      usualStart: proof.usualStart || null,
      partySize: proof.partySize ?? null,
      gear: proof.gear || null,
      pace: proof.pace ?? null,
      // Remembered so the next form can show them beside the empty fields.
      // Never filled in for you — see the note on the model for why.
      lastDistance: proof.distance ?? null,
      lastElevation: proof.elevation ?? null,
      lastMovingTime: proof.movingTime ?? null,
    };
    await db.userLogDefaults.upsert({
      where: { userId },
      update: defaults,
      create: { userId, ...defaults },
    });
  }

  revalidateQuestPaths(questId);
  revalidatePath("/weekly");
  revalidatePath("/monthly");
  revalidatePath("/submissions");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  return { ok: true };
}

export async function submitProofAction(formData: FormData): Promise<ProofResult> {
  const user = await requireClient();

  const read = readProof(formData);
  if (!read.ok) return { ok: false, message: read.message };

  const questId = String(formData.get("questId") ?? "").trim();
  if (!questId || questId.length > 60) return { ok: false, message: "Unknown quest." };

  return fileProof(user.id, questId, read.proof);
}

/**
 * File proof against this week's or this month's featured quest.
 *
 * Distinct from `submitProofAction` for one reason: the cadence stamp.
 * `cadenceForFiling` finds the slot by looking for an admin's booking, and a
 * *generated* featured quest has no booking to find — it is one account's
 * copy of one week. Without this, the two quests the product asks everybody
 * to do would be the only ones that never reached the front of the review
 * queue or carried their bonus onto the board.
 *
 * The period is resolved server-side from the account's own featured slot,
 * never taken from the form. A form that could name its own slot could award
 * itself a monthly bonus for an afternoon walk.
 */
export async function submitFeaturedProofAction(formData: FormData): Promise<ProofResult> {
  const user = await requireClient();

  const read = readProof(formData);
  if (!read.ok) return { ok: false, message: read.message };

  const period = formData.get("period") === "month" ? "month" : "week";
  const featured = await getFeaturedQuest(user.id, period);
  if (!featured) {
    return {
      ok: false,
      message: "There's no quest placed for this period — widen your range in settings.",
    };
  }

  const questId = await materialiseFeatured(user.id, featured);

  return fileProof(user.id, questId, read.proof, {
    period: period === "week" ? "WEEKLY" : "MONTHLY",
    slotKey: featured.key,
  });
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

/**
 * Record that these stickers have been celebrated.
 *
 * Called by the sheet once the unlock animation has played. Ids are filtered
 * against the account's actual earned set before being written: this arrives
 * from the browser, and without that check anyone could post the whole
 * catalogue and quietly switch off their own celebrations for ever.
 */
export async function markStickersSeenAction(ids: string[]): Promise<void> {
  const user = await requireClient();
  if (!Array.isArray(ids) || ids.length === 0) return;

  const [stats, entitlement, revocations] = await Promise.all([
    getUserStats(user.id),
    getEntitlement(user.id),
    db.achievementRevocation.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    }),
  ]);

  const earned = new Set(
    getAchievements(
      stats,
      entitlement.plan,
      revocations.map((row) => row.achievementId),
    )
      .filter((achievement) => achievement.earned)
      .map((achievement) => achievement.id),
  );

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { seenAchievements: true },
  });

  const merged = new Set(record?.seenAchievements ?? []);
  for (const id of ids) if (earned.has(id)) merged.add(id);

  await db.user.update({
    where: { id: user.id },
    data: { seenAchievements: [...merged] },
  });

  revalidatePath("/achievements");
}

/* -------------------------------------------------------------------------- */
/* Connected apps                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Read one Strava activity into the proof form's figures.
 *
 * The URL is the member's own paste, so this refuses anything that is not a
 * Strava activity link before it goes anywhere near the API, and it reads
 * through *this account's* token — an activity somebody else can see is not
 * one this account may import.
 */
export async function importStravaActivityAction(url: string): Promise<{
  ok: boolean;
  message?: string;
  distance?: number;
  elevation?: number;
  movingTime?: number;
}> {
  const user = await requireClient();

  if (!activityIdFrom(url)) {
    return { ok: false, message: "That is not a Strava activity link." };
  }
  if (!(await getStravaConnection(user.id))) {
    return { ok: false, message: "Connect Strava in Settings first." };
  }

  const activity = await getActivity(user.id, url);
  if (!activity) {
    return { ok: false, message: "Strava would not hand that activity over." };
  }

  return {
    ok: true,
    distance: activity.distance,
    elevation: activity.elevation,
    movingTime: activity.movingTime,
  };
}

/** Take the connection away. Deleting the row is the whole of disconnecting. */
export async function disconnectStravaAction(): Promise<{ ok: boolean }> {
  const user = await requireClient();
  await disconnectStrava(user.id);
  revalidatePath("/settings/connected");
  return { ok: true };
}
