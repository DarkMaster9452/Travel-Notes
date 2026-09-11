"use client";

import * as React from "react";

import { useT } from "@/components/sq/i18n";
import { LockGlyph } from "@/components/sq/icons";
import { SqCheckoutEmbed } from "@/components/sq/plan-actions";
import {
  formatPrice,
  planCopy,
  PLANS,
  capabilityCopy,
  type BillingInterval,
  type Capability,
  type PlanId,
} from "@/lib/config";

/**
 * The plans, a scroll away rather than a page away.
 *
 * Every locked feature in the signed-in app used to send someone to
 * `/settings/billing` and hope they came back. This is the same offer —
 * literally the same `PLANS` data the billing page and the landing page
 * already read, so the sheet can never show a price either of those would
 * disagree with — surfaced without leaving whatever they were looking at.
 * `/settings/billing` still exists for invoices, the portal and cancelling;
 * this is the fast path from "I can't have this" to "now I can".
 */

type Trigger = { capability?: Capability; plan?: PlanId };

type PlanSheetContextValue = {
  openPlanSheet: (capability?: Capability, plan?: PlanId) => void;
  closePlanSheet: () => void;
};

const PlanSheetContext = React.createContext<PlanSheetContextValue | null>(null);

/**
 * Opens the plan sheet from anywhere under the signed-in layout.
 *
 * The same provider-and-context shape the landing page's auth dialog uses
 * (`useAuthModal`/`AuthModalProvider`) — a locked feature calls this rather
 * than every call site having to hold its own sheet state.
 */
export function usePlanSheet(): PlanSheetContextValue {
  const context = React.useContext(PlanSheetContext);
  if (!context) {
    throw new Error("usePlanSheet must be used inside <PlanSheetProvider>");
  }
  return context;
}

export function PlanSheetProvider({
  billingEnabled,
  ultraEnabled,
  children,
}: {
  /** Whether this deployment can sell at all — `isStripeEnabled()`, read
   *  server-side and handed down, since the check itself is server-only. */
  billingEnabled: boolean;
  ultraEnabled: boolean;
  children: React.ReactNode;
}) {
  const [trigger, setTrigger] = React.useState<Trigger | null>(null);

  const openPlanSheet = React.useCallback((capability?: Capability, plan?: PlanId) => {
    setTrigger({ capability, plan });
  }, []);
  const closePlanSheet = React.useCallback(() => setTrigger(null), []);
  const value = React.useMemo(
    () => ({ openPlanSheet, closePlanSheet }),
    [openPlanSheet, closePlanSheet],
  );

  return (
    <PlanSheetContext.Provider value={value}>
      {children}
      {trigger ? (
        <SqPlanSheet
          capability={trigger.capability}
          billingEnabled={billingEnabled}
          ultraEnabled={ultraEnabled}
          onClose={closePlanSheet}
        />
      ) : null}
    </PlanSheetContext.Provider>
  );
}

function SqPlanSheet({
  capability,
  billingEnabled,
  ultraEnabled,
  onClose,
}: {
  capability?: Capability;
  billingEnabled: boolean;
  ultraEnabled: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [interval, setInterval] = React.useState<BillingInterval>("monthly");

  // Mounted closed and flipped open a frame later, so the slide is a real
  // transition rather than starting already at its end state.
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const highlighted = capability ? capabilityCopy(t, capability) : null;

  return (
    <div
      className="sq-plan-sheet-backdrop"
      data-shown={shown ? "1" : "0"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="sq-plan-sheet"
        data-shown={shown ? "1" : "0"}
        role="dialog"
        aria-modal="true"
        aria-label={t.billing.plansHeading}
      >
        <div className="sq-plan-sheet-head">
          {highlighted ? (
            <div className="sq-plan-sheet-trigger">
              <LockGlyph size={14} />
              <span>
                <b>{highlighted.title}</b>
                <p>{highlighted.detail}</p>
              </span>
            </div>
          ) : (
            <h2 className="sq-h2" style={{ fontSize: 20 }}>
              {t.billing.plansHeading}
            </h2>
          )}
          <button type="button" className="sq-btn sq-btn-ghost sq-btn-sm" onClick={onClose}>
            {t.common.close}
          </button>
        </div>

        {billingEnabled ? (
          <div className="sq-seg sq-plan-sheet-toggle">
            <button
              type="button"
              className="sq-seg-opt"
              data-on={interval === "monthly" ? "1" : "0"}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className="sq-seg-opt"
              data-on={interval === "yearly" ? "1" : "0"}
              onClick={() => setInterval("yearly")}
            >
              Yearly
            </button>
          </div>
        ) : null}

        <div className="sq-plan-sheet-body">
          {PLANS.map((plan) => {
            const copy = planCopy(t, plan.id);
            const price = plan.price[interval];
            const buyable =
              billingEnabled &&
              plan.id !== "free" &&
              (plan.id === "explorer" || ultraEnabled);

            return (
              <div
                key={plan.id}
                className="sq-plan-sheet-card"
                data-highlight={plan.highlight ? "1" : "0"}
              >
                <div className="sq-plan-sheet-card-head">
                  <b>{copy.name}</b>
                  {copy.badge ? <span className="sq-tag sq-tag-gold sq-tag-xs">{copy.badge}</span> : null}
                </div>
                <p className="sq-mono sq-plan-sheet-price">
                  {formatPrice(price)}
                  {price > 0 ? (interval === "yearly" ? t.common.perYear : t.common.perMonth) : ""}
                </p>
                <p className="sq-plan-sheet-desc">{copy.description}</p>
                <ul className="sq-plan-sheet-features">
                  {copy.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.id === "free" ? null : buyable ? (
                  <SqCheckoutEmbed
                    plan={plan.id}
                    interval={interval}
                    label={t.locked.unlockWith(copy.name)}
                    variant={plan.highlight ? "primary" : "ghost"}
                    onSuccess={onClose}
                  />
                ) : (
                  <p className="sq-hint">{t.billing.notConfigured}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
