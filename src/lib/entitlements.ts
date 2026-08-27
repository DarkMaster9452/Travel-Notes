import "server-only";

import type { Subscription } from "@prisma/client";

import { db } from "@/lib/db";
import {
  FREE_QUEST_ALLOWANCE,
  planById,
  planIdFromRecord,
  type Capability,
  type PlanDefinition,
  type PlanId,
} from "@/lib/config";

export type Entitlement = {
  /** May the user unlock another quest right now? */
  canUnlock: boolean;
  isSubscribed: boolean;
  plan: PlanId;
  /** The full plan definition — name, price, features, capabilities. */
  definition: PlanDefinition;
  /** Rank of the current plan. Higher is more. */
  tier: number;
  status: Subscription["status"] | null;
  freeQuestsUsed: number;
  freeQuestsRemaining: number;
  freeQuestAllowance: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  /** True while Paddle is retrying a failed payment: access holds, but say so. */
  inGrace: boolean;
  reason: "subscribed" | "free_quota" | "quota_exhausted";
  /** Does this plan include a given capability? */
  can: (capability: Capability) => boolean;
};

/** Statuses that grant access. `PAST_DUE` keeps access during Paddle's retries. */
const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);

/**
 * The single source of truth for "is this user allowed to unlock a quest?" —
 * and, since the paid tiers arrived, for "what does this account have?".
 *
 * Always computed on the server from database state, never from anything the
 * client sends. Every unlock path calls this before doing work, and every
 * surface that shows a member something asks `can()` rather than comparing
 * plan names itself.
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

  const paidPlan = planIdFromRecord(subscription?.plan);

  const isSubscribed = Boolean(
    subscription &&
      paidPlan !== "free" &&
      ACTIVE_STATUSES.has(subscription.status) &&
      periodValid,
  );

  const plan: PlanId = isSubscribed ? paidPlan : "free";
  const definition = planById(plan);
  const capabilities = new Set<Capability>(definition.capabilities);

  return {
    canUnlock: isSubscribed || freeQuestsRemaining > 0,
    isSubscribed,
    plan,
    definition,
    tier: definition.tier,
    status: subscription?.status ?? null,
    freeQuestsUsed,
    freeQuestsRemaining,
    freeQuestAllowance: FREE_QUEST_ALLOWANCE,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    inGrace: isSubscribed && subscription?.status === "PAST_DUE",
    reason: isSubscribed ? "subscribed" : freeQuestsRemaining > 0 ? "free_quota" : "quota_exhausted",
    can: (capability) => capabilities.has(capability),
  };
}
