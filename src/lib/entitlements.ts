import "server-only";

import type { Subscription } from "@prisma/client";

import { db } from "@/lib/db";
import { FREE_QUEST_ALLOWANCE } from "@/lib/config";

export type Entitlement = {
  /** May the user generate another quest right now? */
  canGenerate: boolean;
  isSubscribed: boolean;
  plan: "FREE" | "EXPLORER";
  status: Subscription["status"] | null;
  freeQuestsUsed: number;
  freeQuestsRemaining: number;
  freeQuestAllowance: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  reason: "subscribed" | "free_quota" | "quota_exhausted";
};

/** Statuses that grant access. `PAST_DUE` keeps access during Stripe's retries. */
const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);

/**
 * The single source of truth for "is this user allowed to generate?".
 *
 * Always computed on the server from database state — never from anything the
 * client sends. Every generation path calls this before doing work.
 */
export async function getEntitlement(userId: string): Promise<Entitlement> {
  const [user, subscription] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { freeQuestsUsed: true },
    }),
    db.subscription.findUnique({ where: { userId } }),
  ]);

  const freeQuestsUsed = user?.freeQuestsUsed ?? 0;
  const freeQuestsRemaining = Math.max(0, FREE_QUEST_ALLOWANCE - freeQuestsUsed);

  const periodValid =
    !subscription?.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > Date.now();

  const isSubscribed = Boolean(
    subscription &&
      subscription.plan === "EXPLORER" &&
      ACTIVE_STATUSES.has(subscription.status) &&
      periodValid,
  );

  return {
    canGenerate: isSubscribed || freeQuestsRemaining > 0,
    isSubscribed,
    plan: isSubscribed ? "EXPLORER" : "FREE",
    status: subscription?.status ?? null,
    freeQuestsUsed,
    freeQuestsRemaining,
    freeQuestAllowance: FREE_QUEST_ALLOWANCE,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    reason: isSubscribed ? "subscribed" : freeQuestsRemaining > 0 ? "free_quota" : "quota_exhausted",
  };
}
