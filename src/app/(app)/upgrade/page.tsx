import type { Metadata } from "next";

import { BillingActions } from "@/components/app/billing-actions";
import { Reveal } from "@/components/app/motion";
import { PlanBoard } from "@/components/app/plan-board";
import { PlanChip } from "@/components/app/plan-mark";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { CAPABILITY_COPY, PLANS } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled, isUltraEnabled } from "@/lib/env";
import { stagger } from "@/lib/motion";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Plans" };
export const dynamic = "force-dynamic";

/**
 * Plans and billing, on the same card language as the landing page's pricing
 * table — Explorer raised on the dark forest surface, orange reserved for the
 * flags and nothing else.
 *
 * A subscriber is no longer bounced off this page to their settings. This is
 * where what they hold is written down in full, with the renewal date and the
 * way out — and it is also the only place Ultra is sold, which cannot happen on
 * a page members are redirected away from.
 */
export default async function UpgradePage() {
  const user = await requireClient();
  const entitlement = await getEntitlement(user.id);
  const held = entitlement.definition.capabilities;

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>{entitlement.isSubscribed ? "Your membership" : "Plans"}</Eyebrow>
          <h1>{entitlement.isSubscribed ? "What you hold." : "Subscribe to stop deciding."}</h1>
          <p>
            {entitlement.isSubscribed
              ? entitlement.cancelAtPeriodEnd && entitlement.currentPeriodEnd
                ? `Your plan stops on ${formatDate(entitlement.currentPeriodEnd)}. Until then nothing changes.`
                : entitlement.currentPeriodEnd
                  ? `Renews ${formatDate(entitlement.currentPeriodEnd)}. Cancel any time and keep the rest of the period.`
                  : "Everything below is live on this account right now."
              : entitlement.freeQuestsRemaining > 0
                ? `${entitlement.freeQuestsRemaining} free quest${
                    entitlement.freeQuestsRemaining === 1 ? "" : "s"
                  } left. After that this is the way on.`
                : "All three free quests are used. This is the way on."}
          </p>
        </div>
        <PlanChip plan={entitlement.plan} />
      </Reveal>

      {entitlement.isSubscribed && (
        <Reveal className="mb-6">
          <Panel flush className="member-panel">
            <PanelHead
              title={`${entitlement.definition.name} · live on this account`}
              aside={
                entitlement.inGrace ? (
                  <Tag tone="warm">Payment retrying</Tag>
                ) : (
                  <Tag>Active</Tag>
                )
              }
            />
            <ul className="held-grid">
              {held.map((capability, index) => (
                <li
                  key={capability}
                  className="tick-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span className="held-tick" aria-hidden="true" />
                  <div>
                    <b>{CAPABILITY_COPY[capability].title}</b>
                    <span>{CAPABILITY_COPY[capability].detail}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-dashed border-line px-5 py-4">
              <BillingActions enabled={isStripeEnabled()} />
            </div>
          </Panel>
        </Reveal>
      )}

      <Reveal delay={stagger(1)}>
        <PlanBoard
          plans={PLANS}
          currentPlan={entitlement.plan}
          stripeReady={isStripeEnabled()}
          ultraReady={isUltraEnabled()}
        />
      </Reveal>

      <Reveal delay={stagger(2)}>
        <p className="note text-center">
          Cancel any time, from the footer of any quest you&apos;ve ever been sent.
        </p>
      </Reveal>
    </>
  );
}
