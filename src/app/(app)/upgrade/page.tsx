import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/app/billing-actions";
import { Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { Eyebrow, IconCheck, IconCross } from "@/components/field";
import { requireUser } from "@/lib/auth/guards";
import { PLANS, formatPrice } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Plans" };
export const dynamic = "force-dynamic";

/**
 * The plans, on the same card language as the landing page's pricing table —
 * Explorer raised on the dark forest surface, orange reserved for the "Most
 * taken" flag and nothing else.
 */
export default async function UpgradePage() {
  const user = await requireUser();
  const entitlement = await getEntitlement(user.id);

  if (entitlement.isSubscribed) redirect("/profile");

  const stripeReady = isStripeEnabled();

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Plans</Eyebrow>
          <h1>Subscribe to stop deciding.</h1>
          <p>
            {entitlement.freeQuestsRemaining > 0
              ? `You have ${entitlement.freeQuestsRemaining} free quest${
                  entitlement.freeQuestsRemaining === 1 ? "" : "s"
                } left. After that this is the way on.`
              : "All three free quests are used. This is the way on."}
          </p>
        </div>
      </Reveal>

      <div className="plans equal">
        {PLANS.map((plan, index) => {
          const featured = plan.id === "explorer";
          const isCurrent = plan.id === "free";

          return (
            <Reveal key={plan.id} delay={stagger(index)} className={featured ? "plan feature" : "plan"}>
              {plan.badge && <span className="plan-flag">{plan.badge}</span>}
              <span className="plan-name">{plan.name}</span>
              <div className="plan-price">
                <b>{plan.price.monthly === 0 ? "€0" : formatPrice(plan.price.monthly)}</b>
                <span>{plan.price.monthly === 0 ? "/ forever" : "/ month"}</span>
              </div>
              <p className="plan-desc">{plan.description}</p>

              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <IconCheck />
                    {feature}
                  </li>
                ))}
                {plan.missing?.map((feature) => (
                  <li key={feature} style={{ opacity: 0.5 }}>
                    <IconCross />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button type="button" className="btn btn-ghost" disabled>
                  <IconCross />
                  Your current plan
                </button>
              ) : (
                <CheckoutButton
                  enabled={stripeReady}
                  label={plan.id === "ultra" ? "Go Ultra" : "Start with Explorer"}
                  className={featured ? "btn btn-signal" : "btn btn-primary"}
                />
              )}

              <p className="plan-note">
                {isCurrent
                  ? "Free forever · no card"
                  : stripeReady
                    ? "Billed via Stripe · cancel anytime"
                    : "Checkout is not configured yet"}
              </p>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={stagger(3)}>
        <p className="note text-center">
          Cancel any time, from the footer of any quest you&apos;ve ever been sent.
        </p>
      </Reveal>
    </>
  );
}
