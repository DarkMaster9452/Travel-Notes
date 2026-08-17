"use client";

import Link from "next/link";
import * as React from "react";

import { planById, type PlanId } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The membership mark.
 *
 * A subscription is invisible by nature — the thing you bought is the *absence*
 * of a wall — so the product has to say so out loud, permanently, in the one
 * place that is on every screen. This sits in the app bar from the moment
 * checkout returns and never comes back off while the plan is live.
 *
 * It stamps itself in on mount rather than simply being there: the first time
 * you see it, right after paying, it should read as something that just
 * happened to your account.
 */
export function PlanMark({
  plan,
  className,
  href = "/upgrade",
}: {
  plan: Exclude<PlanId, "free">;
  className?: string;
  href?: string;
}) {
  const definition = planById(plan);
  // Ultra says "Ultra", not "Ultra Explorer": the bar is 66px of chrome, and
  // the full name belongs on the plan card where there is room to sell it.
  const label = plan === "ultra" ? "Ultra" : definition.name;

  return (
    <Link
      href={href}
      className={cn("plan-mark stamp-in", `plan-mark-${plan}`, className)}
      title={`${definition.name} — ${definition.kicker}`}
    >
      <span className="plan-mark-dot" aria-hidden="true" />
      {label}
    </Link>
  );
}

/**
 * The same mark, for places that are not the bar and are not links — a panel
 * header, a card corner, the top of the sticker sheet.
 */
export function PlanChip({
  plan,
  className,
}: {
  plan: PlanId;
  className?: string;
}) {
  const definition = planById(plan);

  return (
    <span className={cn("plan-mark", `plan-mark-${plan}`, "plan-mark-static", className)}>
      {plan !== "free" && <span className="plan-mark-dot" aria-hidden="true" />}
      {definition.name}
    </span>
  );
}
