import type { Metadata } from "next";

import { cancelPlanAction } from "@/app/(app)/actions";
import { pausePlanAction, resumePlanAction } from "@/app/(app)/settings/actions";
import { SqConfirmButton } from "@/components/sq/forms";
import { Tag } from "@/components/sq/ui";
import { getT } from "@/lib/i18n/server";
import { requireClient } from "@/lib/auth/guards";
import { REFUND_WINDOW_DAYS } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Pause or cancel" };
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * Leaving, in the two shapes people actually mean by it.
 *
 * A pause is "not this month"; a cancel is "not any more". Both are stated
 * with what survives them, because the fear in either case is the same one —
 * that the stickers and the board history go with it. They do not.
 */
export default async function CancelSettingsPage() {
  const user = await requireClient();
  const t = await getT(user.id);

  const [entitlement, subscription] = await Promise.all([
    getEntitlement(user.id),
    db.subscription.findUnique({ where: { userId: user.id }, select: { status: true } }),
  ]);

  const paused = subscription?.status === "PAUSED";

  return (
    <>
      <section className="sq-card sq-pad">
        <div className="sq-section-head" style={{ marginBottom: 10 }}>
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Pause a month
          </h2>
          {paused ? <Tag tone="stamp" small>Paused</Tag> : null}
        </div>
        <p style={{ maxWidth: "58ch", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 16 }}>
          A pause holds your board history and everything you have earned for up to three months.
          Billing stops; nothing else changes. The quests simply do not arrive while it is paused.
        </p>

        {!entitlement.isSubscribed && !paused ? (
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
            There is no live subscription to pause.
          </p>
        ) : paused ? (
          <SqConfirmButton
            action={resumePlanAction}
            label={t.panes.cancel.resume}
            confirmLabel="Resume now"
          />
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <SqConfirmButton
              action={() => pausePlanAction(1)}
              label={t.panes.cancel.pauseMonth}
              confirmLabel="Pause one month"
            />
            <SqConfirmButton
              action={() => pausePlanAction(3)}
              label={t.panes.cancel.pauseThreeShort}
              confirmLabel="Pause three months"
            />
          </div>
        )}
      </section>

      <section className="sq-card sq-pad" style={{ borderColor: "var(--signal)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 10 }}>
          Cancel
        </h2>
        <p style={{ maxWidth: "58ch", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 16 }}>
          Cancelling keeps everything you have already earned — the stickers are yours, and so is
          your place on every board that has already sealed. Access runs to the end of the period
          you have paid for
          {entitlement.currentPeriodEnd ? `, which is ${DATE.format(entitlement.currentPeriodEnd)}` : ""}.
          A full refund is available inside {REFUND_WINDOW_DAYS} days of a payment.
        </p>

        {entitlement.cancelAtPeriodEnd ? (
          <Tag tone="stamp" small>
            Already cancelling at the end of this period
          </Tag>
        ) : entitlement.isSubscribed ? (
          <SqConfirmButton
            action={async () => {
              const result = await cancelPlanAction();
              return { ok: result.ok, message: result.message };
            }}
            label={t.panes.cancel.cancelPlan}
            confirmLabel="Yes, cancel it"
            tone="stamp"
          />
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>There is nothing to cancel.</p>
        )}
      </section>
    </>
  );
}
