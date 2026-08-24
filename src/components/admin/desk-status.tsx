import Link from "next/link";

import { IconArrowRight } from "@/components/field";
import { cn } from "@/lib/utils";

/**
 * The state of the review desk, pinned to the foot of the sidebar.
 *
 * The demo panel this sidebar was rebuilt against keeps a card in the same
 * place, and there it is a promotion. That slot is worth more than an advert
 * in a panel with exactly one recurring job: an admin should not have to
 * navigate to the overview to find out that eleven people are waiting on a
 * verdict, so the number that decides how their afternoon goes sits in the
 * chrome instead.
 *
 * It is a live condition, derived per request like every other figure in the
 * panel — never a stored counter — and it says what to do rather than only
 * how bad it is.
 */
export function DeskStatus({
  pending,
  oldestWaitDays,
}: {
  pending: number;
  oldestWaitDays: number | null;
}) {
  // The same thresholds the notice module judges the queue by. The sidebar and
  // the bell must never disagree about what counts as late.
  const tone =
    pending === 0
      ? "clear"
      : (oldestWaitDays ?? 0) >= 4 || pending >= 25
        ? "late"
        : (oldestWaitDays ?? 0) >= 2 || pending >= 10
          ? "aging"
          : "fresh";

  if (pending === 0) {
    return (
      <div className="desk-status is-clear">
        <p className="desk-status-line">
          <span className="desk-status-dot" aria-hidden="true" />
          Queue clear
        </p>
        <p className="desk-status-note">Every submission has a verdict.</p>
      </div>
    );
  }

  return (
    <Link href="/admin/review" className={cn("desk-status", `is-${tone}`)}>
      <p className="desk-status-line">
        <span className="desk-status-dot" aria-hidden="true" />
        {pending} waiting
      </p>
      <p className="desk-status-note">
        {oldestWaitDays === null || oldestWaitDays === 0
          ? "All filed today."
          : `Oldest has waited ${oldestWaitDays} ${oldestWaitDays === 1 ? "day" : "days"}.`}
      </p>
      <p className="desk-status-go">
        Review
        <IconArrowRight width={12} height={12} />
      </p>
    </Link>
  );
}
