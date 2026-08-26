import "server-only";

import type { NudgeKind, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Things the product needs to ask for, later.
 *
 * The word doing the work here is *later*. Asking for a postal address in the
 * same breath as "you have unlocked Explorer" turns the good moment into a
 * form, and people fill in a form worse when it interrupts something than when
 * it arrives on its own. So the ask is queued with a time on it, and the
 * screen that would have interrupted stays a celebration.
 *
 * A nudge is answered (`doneAt`) or waved away (`dismissedAt`), and the two are
 * kept apart because their consequences differ — see `lib/envelope`.
 */

/** How long an ask waits before it is allowed to appear. */
export const NUDGE_DELAY: Record<NudgeKind, number> = {
  SHIPPING_ADDRESS: 24 * 60 * 60 * 1000,
};

export type DueNudge = {
  id: string;
  kind: NudgeKind;
  context: Prisma.JsonValue;
  dueAt: Date;
};

/**
 * Queue an ask, if it is not already queued or already answered.
 *
 * Idempotent by `(userId, kind)`: activating a plan twice must not produce two
 * copies of the same question. An existing row is left exactly as it is —
 * including one that has been dismissed, because re-queueing a question
 * somebody has already waved away is how a product becomes nagging.
 */
export async function queueNudge(
  userId: string,
  kind: NudgeKind,
  context?: Prisma.InputJsonValue,
  now = new Date(),
): Promise<void> {
  const dueAt = new Date(now.getTime() + NUDGE_DELAY[kind]);

  await db.nudge.upsert({
    where: { userId_kind: { userId, kind } },
    create: { userId, kind, dueAt, context },
    update: {},
  });
}

/**
 * What this account should be asked right now.
 *
 * Read on every member page load, so it is one indexed query and nothing more.
 * Anything already answered or waved away is excluded in the query rather than
 * filtered afterwards — an ask that has been dealt with should not travel as
 * far as the layout.
 */
export async function getDueNudges(userId: string, now = new Date()): Promise<DueNudge[]> {
  return db.nudge.findMany({
    where: {
      userId,
      dueAt: { lte: now },
      doneAt: null,
      dismissedAt: null,
    },
    orderBy: { dueAt: "asc" },
    take: 3,
    select: { id: true, kind: true, context: true, dueAt: true },
  });
}

/** Somebody has looked at it. Recorded once; a second look is not news. */
export async function markNudgeSeen(userId: string, kind: NudgeKind): Promise<void> {
  await db.nudge.updateMany({
    where: { userId, kind, seenAt: null },
    data: { seenAt: new Date() },
  });
}

/** They gave us what we asked for. */
export async function completeNudge(userId: string, kind: NudgeKind): Promise<void> {
  await db.nudge.updateMany({
    where: { userId, kind, doneAt: null },
    data: { doneAt: new Date() },
  });
}

/**
 * They waved it away.
 *
 * Not a soft no. The ask does not come back, and the consequence of not
 * answering it stands — no address means no envelope. Saying so on the notice
 * is what makes dismissing it a decision rather than a mistake.
 */
export async function dismissNudge(userId: string, kind: NudgeKind): Promise<void> {
  await db.nudge.updateMany({
    where: { userId, kind, dismissedAt: null, doneAt: null },
    data: { dismissedAt: new Date() },
  });
}
