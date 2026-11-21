"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { useT } from "@/components/i18n";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { capabilityCopy, planCopy, type Capability, type PlanId } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * A feature this plan does not include.
 *
 * Locked in place rather than hidden, deliberately. A capability somebody
 * cannot see is a capability they will never buy, and a product that quietly
 * removes rows depending on who is looking is a product nobody can reason
 * about. So the feature stays exactly where it lives, dimmed, with the plan
 * that unlocks it named on top of it.
 *
 * This is presentation only. Every capability is re-checked server-side by
 * `getEntitlement().can()` before anything happens — the lock is the sign on
 * the door, not the door.
 */
export function Locked({
  capability,
  plan,
  children,
  className,
}: {
  capability: Capability;
  /** The lowest plan that includes it. */
  plan: PlanId;
  children: ReactNode;
  className?: string;
}) {
  const t = useT();
  const copy = capabilityCopy(t, capability);
  const name = planCopy(t, plan).name;

  return (
    <div className={cn("relative isolate overflow-hidden rounded-card", className)}>
      <div className="pointer-events-none select-none opacity-30" aria-hidden="true" inert>
        {children}
      </div>

      <div className="absolute inset-0 z-sticky grid place-items-center bg-bg/60 p-4">
        <div className="flex max-w-form flex-col items-center gap-2 rounded-card border border-border bg-surface p-5 text-center shadow-2">
          <Badge tone="primary" icon={Lock}>
            {name}
          </Badge>
          <b className="text-h4 font-semibold text-text">{copy.title}</b>
          <p className="text-body-sm text-muted">{copy.detail}</p>
          <ButtonLink href="/settings/billing" size="sm" className="mt-1">
            {t.locked.unlockWith(name)}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/**
 * The same idea at the size of a chip, for a row in a list: a mark that says
 * this line is not yours yet, where covering the row would cost more than it
 * explains.
 */
export function PaidChip({ plan }: { plan: PlanId }) {
  const t = useT();
  const name = planCopy(t, plan).name;
  return (
    <Badge tone="primary" icon={Lock} title={t.locked.paidFeature(name)}>
      {name}
    </Badge>
  );
}
