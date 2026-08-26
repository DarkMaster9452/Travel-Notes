import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { LockGlyph } from "@/components/sq/icons";
import { CAPABILITY_COPY, planById, type Capability, type PlanId } from "@/lib/config";

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
export function SqLocked({
  capability,
  /** The lowest plan that includes it. */
  plan,
  children,
  /** Shrink the overlay for small surfaces like a single row. */
  compact,
  style,
}: {
  capability: Capability;
  plan: PlanId;
  children: ReactNode;
  compact?: boolean;
  style?: CSSProperties;
}) {
  const copy = CAPABILITY_COPY[capability];
  const definition = planById(plan);

  return (
    <div className="sq-locked" data-compact={compact ? "1" : "0"} style={style}>
      <div className="sq-locked-under" aria-hidden="true">
        {children}
      </div>

      <div className="sq-locked-over">
        <span className="sq-locked-badge">
          <LockGlyph size={compact ? 12 : 14} />
          {definition.name}
        </span>
        {compact ? null : (
          <>
            <b className="sq-locked-title">{copy.title}</b>
            <p className="sq-locked-detail">{copy.detail}</p>
          </>
        )}
        <Link href="/settings/billing" className="sq-btn sq-btn-primary sq-btn-sm">
          {compact ? "Unlock" : `Unlock with ${definition.name}`}
        </Link>
      </div>
    </div>
  );
}

/**
 * The same idea at the size of a chip, for a row in a list.
 *
 * No overlay and no dimming — just a mark that says this line is not yours
 * yet, for places where covering the row would cost more than it explains.
 */
export function SqPaidChip({ plan }: { plan: PlanId }) {
  const definition = planById(plan);
  return (
    <span className="sq-tag sq-tag-gold sq-tag-xs" title={`Part of ${definition.name}`}>
      <LockGlyph size={10} />
      {definition.name}
    </span>
  );
}
