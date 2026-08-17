"use client";

import * as React from "react";

import { CheckoutButton } from "@/components/app/billing-actions";
import { CountUp } from "@/components/app/motion";
import { IconCheck, IconCross } from "@/components/field";
import { type BillingInterval, type PlanDefinition, type PlanId } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The plan board.
 *
 * A client component because the billing interval is a real choice and the
 * price should move when it is made — a number that animates from €11 to €7.83
 * is the difference between reading a discount and seeing one. Everything it
 * decides is cosmetic; what the account is actually entitled to is settled on
 * the server, and checkout is refused there if this component is ever wrong.
 */
export function PlanBoard({
  plans,
  currentPlan,
  stripeReady,
  ultraReady,
}: {
  plans: PlanDefinition[];
  currentPlan: PlanId;
  stripeReady: boolean;
  ultraReady: boolean;
}) {
  const [interval, setInterval] = React.useState<BillingInterval>("monthly");
  const current = plans.find((plan) => plan.id === currentPlan);
  const currentTier = current?.tier ?? 0;

  return (
    <>
      <IntervalToggle value={interval} onChange={setInterval} />

      <div className="plans equal mt-6">
        {plans.map((plan, index) => {
          const owned = plan.id === currentPlan;
          const beneath = plan.tier < currentTier;
          const monthly =
            interval === "yearly" ? Math.round(plan.price.yearly / 12) : plan.price.monthly;
          const unavailable = plan.id === "ultra" && !ultraReady;

          return (
            <div
              key={plan.id}
              className={cn(
                "plan rise-in",
                plan.id === "explorer" && "feature",
                owned && "plan-owned",
              )}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {owned ? (
                <span className="plan-flag plan-flag-owned">Your plan</span>
              ) : (
                plan.badge && <span className="plan-flag">{plan.badge}</span>
              )}

              <span className="plan-name">{plan.name}</span>

              <div className="plan-price">
                <b>
                  {plan.price.monthly === 0 ? (
                    "€0"
                  ) : (
                    <>
                      €
                      <CountUp
                        value={monthly / 100}
                        duration={520}
                        format={(value) =>
                          value % 1 === 0 ? String(Math.round(value)) : value.toFixed(2)
                        }
                      />
                    </>
                  )}
                </b>
                <span>{plan.price.monthly === 0 ? "/ forever" : "/ month"}</span>
              </div>

              <p className="plan-desc">{plan.description}</p>

              <ul>
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={feature}
                    className="tick-in"
                    style={{ animationDelay: `${index * 90 + featureIndex * 55}ms` }}
                  >
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

              <PlanAction
                plan={plan}
                owned={owned}
                beneath={beneath}
                interval={interval}
                enabled={stripeReady && !unavailable}
                upgrade={plan.tier > currentTier && currentTier > 0}
              />

              <p className="plan-note">
                {owned
                  ? plan.id === "free"
                    ? "Free forever · no card"
                    : "Billed via Stripe · cancel anytime"
                  : unavailable
                    ? "Not sold on this deployment yet"
                    : beneath
                      ? "Included in what you already have"
                      : stripeReady
                        ? interval === "yearly"
                          ? "Billed yearly via Stripe · cancel anytime"
                          : "Billed via Stripe · cancel anytime"
                        : "Checkout is not configured yet"}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function PlanAction({
  plan,
  owned,
  beneath,
  interval,
  enabled,
  upgrade,
}: {
  plan: PlanDefinition;
  owned: boolean;
  beneath: boolean;
  interval: BillingInterval;
  enabled: boolean;
  upgrade: boolean;
}) {
  if (owned) {
    return (
      <button type="button" className="btn btn-ghost plan-current" disabled>
        <IconCheck />
        This is yours
      </button>
    );
  }

  if (beneath || plan.id === "free") {
    return (
      <button type="button" className="btn btn-ghost" disabled>
        {beneath ? "Already included" : "Free tier"}
      </button>
    );
  }

  return (
    <CheckoutButton
      plan={plan.id === "ultra" ? "ultra" : "explorer"}
      interval={interval}
      enabled={enabled}
      label={upgrade ? `Move up to ${plan.name}` : plan.id === "ultra" ? "Go Ultra" : "Start with Explorer"}
      className={plan.id === "explorer" ? "btn btn-signal" : "btn btn-primary"}
    />
  );
}

/** Monthly / yearly, with the saving stated rather than implied. */
function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}) {
  return (
    <div className="interval-toggle" role="group" aria-label="Billing interval">
      <button
        type="button"
        aria-pressed={value === "monthly"}
        onClick={() => onChange("monthly")}
      >
        Monthly
      </button>
      <button type="button" aria-pressed={value === "yearly"} onClick={() => onChange("yearly")}>
        Yearly
        <em>2 months free</em>
      </button>
    </div>
  );
}
