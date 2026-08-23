"use server";

import { revalidatePath } from "next/cache";

import { slotRange, slotState } from "@/lib/admin/schedule";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { pastSlots, sealLeaderboard } from "@/lib/leaderboard";

/**
 * The cheat drawer's actions.
 *
 * Separate from `admin/actions.ts` on purpose. Those are the panel's ordinary
 * writes — one submission, one quest, one slot — the things the product is
 * *for*. These are the blunt ones: approve the whole queue, publish the whole
 * catalogue, hand this account a plan it did not pay for. Keeping them in
 * their own file means nobody adds a bulk delete to the file that reviews a
 * submission, and anybody auditing what an admin can do to the database in one
 * keystroke has one place to read.
 *
 * Every one of them re-checks the role against the database. A server action
 * is a public endpoint: the F7 menu being admin-only is a fact about the UI,
 * not a fact about the network.
 *
 * Nothing here is undoable by pressing it again, so each carries the sentence
 * the menu prints next to it and the destructive ones are confirmed in the UI
 * before they are called.
 */

export type CheatResult = { ok: boolean; message: string };

/* -------------------------------------------------------------------------- */
/* The review queue                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Approve everything waiting.
 *
 * The demo-and-testing button: a review deck with forty seeded submissions in
 * it is the slowest possible way to get a leaderboard with numbers on it. It
 * writes the same two rows per submission that `reviewSubmissionAction` does,
 * so nothing downstream can tell the difference — which is the point, and also
 * why it asks first.
 */
export async function cheatApproveAllPendingAction(): Promise<CheatResult> {
  const admin = await requireAdmin();

  const pending = await db.submission.findMany({
    where: { status: "PENDING" },
    select: { id: true, userId: true, questId: true },
  });
  if (pending.length === 0) return { ok: true, message: "The queue was already empty." };

  const now = new Date();
  await db.$transaction([
    db.submission.updateMany({
      where: { id: { in: pending.map((row) => row.id) } },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: now, reviewNote: null },
    }),
    ...pending.map((row) =>
      db.questHistory.updateMany({
        where: { userId: row.userId, questId: row.questId },
        data: { completed: true, completedAt: now },
      }),
    ),
  ]);

  revalidatePath("/admin/review");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/leaderboard");
  revalidatePath("/leaderboard");
  return { ok: true, message: `Approved ${pending.length}. The queue is empty.` };
}

/* -------------------------------------------------------------------------- */
/* Cadence and boards                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Book a quest into every empty slot in view.
 *
 * Picks published quests at random and fills whatever the calendar has left
 * open, current slot included. Existing bookings are never touched — an empty
 * calendar is the thing this fixes, and overwriting somebody's plan for
 * September is not.
 */
export async function cheatFillSlotsAction(): Promise<CheatResult> {
  const admin = await requireAdmin();

  const quests = await db.quest.findMany({
    where: { published: true, isShowcase: true },
    select: { id: true },
    take: 200,
  });
  if (quests.length === 0) {
    return { ok: false, message: "There are no published quests to book." };
  }

  const now = new Date();
  const wanted = [
    ...slotRange("WEEKLY", now, { back: 0, forward: 6 }),
    ...slotRange("MONTHLY", now, { back: 0, forward: 2 }),
  ].filter((slot) => slotState(slot, now) !== "past");

  const taken = await db.questSchedule.findMany({
    where: { slotKey: { in: wanted.map((slot) => slot.key) } },
    select: { period: true, slotKey: true },
  });
  const occupied = new Set(taken.map((row) => `${row.period}:${row.slotKey}`));

  const empty = wanted.filter((slot) => !occupied.has(`${slot.period}:${slot.key}`));
  if (empty.length === 0) return { ok: true, message: "Every slot in view was already booked." };

  await db.questSchedule.createMany({
    data: empty.map((slot, index) => ({
      period: slot.period,
      slotKey: slot.key,
      // Walked rather than randomly drawn, so one press cannot put the same
      // quest into the weekly and the monthly of the same fortnight.
      questId: quests[index % quests.length]!.id,
      audience: "FREE" as const,
      openAt: slot.openAt,
      closeAt: slot.closeAt,
      createdById: admin.id,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/admin/schedule");
  revalidatePath("/weekly");
  revalidatePath("/monthly");
  return { ok: true, message: `Booked ${empty.length} empty slot${empty.length === 1 ? "" : "s"}.` };
}

/**
 * Hand out the medals for every board that has closed.
 *
 * Sealing already happens the first time anybody opens a closed board, so this
 * is not a fix — it is a way to make the podium exist before a customer has
 * been the first to look at it.
 */
export async function cheatSealBoardsAction(): Promise<CheatResult> {
  await requireAdmin();

  const now = new Date();
  const slots = [...pastSlots("WEEKLY", 12, now), ...pastSlots("MONTHLY", 6, now)].filter(
    (slot) => slotState(slot, now) === "past",
  );

  let sealed = 0;
  for (const slot of slots) {
    const result = await sealLeaderboard(slot.period, slot.key, now);
    sealed += result.sealed;
  }

  revalidatePath("/admin/leaderboard");
  revalidatePath("/leaderboard");
  revalidatePath("/achievements");
  return {
    ok: true,
    message: sealed === 0 ? "Every closed board was already sealed." : `Sealed ${sealed} finishes.`,
  };
}

/**
 * Tear up the podiums and work them out again.
 *
 * The one action here that destroys something a customer can see: a medal
 * somebody holds may not come back, because the board is recomputed from
 * whatever the submissions say *now*. It exists because a board sealed against
 * bad data is otherwise permanent by design.
 */
export async function cheatResealBoardsAction(): Promise<CheatResult> {
  await requireAdmin();

  const now = new Date();
  const slots = [...pastSlots("WEEKLY", 12, now), ...pastSlots("MONTHLY", 6, now)].filter(
    (slot) => slotState(slot, now) === "past",
  );

  const { count: removed } = await db.leaderboardAward.deleteMany({
    where: { OR: slots.map((slot) => ({ period: slot.period, slotKey: slot.key })) },
  });

  let sealed = 0;
  for (const slot of slots) {
    const result = await sealLeaderboard(slot.period, slot.key, now);
    sealed += result.sealed;
  }

  revalidatePath("/admin/leaderboard");
  revalidatePath("/leaderboard");
  revalidatePath("/achievements");
  return { ok: true, message: `Cleared ${removed} and re-sealed ${sealed}.` };
}

/* -------------------------------------------------------------------------- */
/* The catalogue                                                               */
/* -------------------------------------------------------------------------- */

/** Publish every authored quest, so the whole catalogue is browsable. */
export async function cheatPublishAllAction(): Promise<CheatResult> {
  await requireAdmin();
  const { count } = await db.quest.updateMany({
    where: { isShowcase: true, published: false },
    data: { published: true },
  });
  revalidatePath("/admin/quests/all");
  revalidatePath("/quests");
  return {
    ok: true,
    message: count === 0 ? "Everything was already published." : `Published ${count}.`,
  };
}

/**
 * Take the whole catalogue off the shelf.
 *
 * Nothing can be issued or booked while it is unpublished, so this empties the
 * customer-facing database in one press. Reversible with the button above it,
 * which is the only reason it is here at all.
 */
export async function cheatUnpublishAllAction(): Promise<CheatResult> {
  await requireAdmin();
  const { count } = await db.quest.updateMany({
    where: { isShowcase: true, published: true },
    data: { published: false },
  });
  revalidatePath("/admin/quests/all");
  revalidatePath("/quests");
  return { ok: true, message: `Unpublished ${count}. The customer database is empty.` };
}

/* -------------------------------------------------------------------------- */
/* This account                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Give the signed-in admin an Ultra subscription.
 *
 * Written as a real subscription row rather than a flag, so `getEntitlement`
 * cannot tell it apart from one Stripe created — which is the point of testing
 * with it. Stripe is never told, so this is a local grant and a real customer
 * doing the same thing would still have to pay.
 */
export async function cheatGrantUltraAction(): Promise<CheatResult> {
  const admin = await requireAdmin();

  const now = new Date();
  const values = {
    plan: "ULTRA" as const,
    status: "ACTIVE" as const,
    cancelAtPeriodEnd: false,
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
  };
  await db.subscription.upsert({
    where: { userId: admin.id },
    update: values,
    create: { userId: admin.id, ...values },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "This account now holds Ultra for a year." };
}

/** Put the free-quest counter back to nought on this account. */
export async function cheatResetAllowanceAction(): Promise<CheatResult> {
  const admin = await requireAdmin();
  await db.user.update({ where: { id: admin.id }, data: { freeQuestsUsed: 0 } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Free quests are back to full on this account." };
}

/**
 * Empty the rate-limit table.
 *
 * The limiter is Postgres-backed so it survives restarts, which is right in
 * production and infuriating while testing: twelve unlocks and the hour is
 * gone. This clears every window for everybody.
 */
export async function cheatClearRateLimitsAction(): Promise<CheatResult> {
  await requireAdmin();
  const { count } = await db.rateLimit.deleteMany({});
  return {
    ok: true,
    message: count === 0 ? "No limits were being held." : `Cleared ${count} rate-limit windows.`,
  };
}

/**
 * Sign every other account out.
 *
 * The admin's own sessions are kept, or pressing this would log the person
 * pressing it out of the panel they pressed it from.
 */
export async function cheatRevokeSessionsAction(): Promise<CheatResult> {
  const admin = await requireAdmin();
  const { count } = await db.session.deleteMany({ where: { userId: { not: admin.id } } });
  return { ok: true, message: `Ended ${count} session${count === 1 ? "" : "s"}. Yours is intact.` };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/** Row counts, for the moments when the question is "is anything in there". */
export async function cheatSnapshotAction(): Promise<CheatResult> {
  await requireAdmin();

  const [users, quests, published, schedules, pendingCount, approved, awards] = await Promise.all([
    db.user.count(),
    db.quest.count(),
    db.quest.count({ where: { published: true, isShowcase: true } }),
    db.questSchedule.count(),
    db.submission.count({ where: { status: "PENDING" } }),
    db.submission.count({ where: { status: "APPROVED" } }),
    db.leaderboardAward.count(),
  ]);

  return {
    ok: true,
    message: `${users} accounts · ${published}/${quests} published · ${schedules} slots · ${pendingCount} pending · ${approved} approved · ${awards} medals`,
  };
}
