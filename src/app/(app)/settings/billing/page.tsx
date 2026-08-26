import type { Metadata } from "next";
import Link from "next/link";

import { SqCheckoutButton, SqPortalButton } from "@/components/sq/plan-actions";
import { Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { Glyph, LockGlyph } from "@/components/sq/icons";
import { SqPaidChip } from "@/components/sq/locked";
import {
  ALL_CAPABILITIES,
  CAPABILITY_COPY,
  formatPrice,
  lowestPlanWith,
  PLANS,
} from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled, isUltraEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Plan & billing" };
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * What this account is on, and what else there is.
 *
 * The current plan is stated as a fact — name, price, renewal date — and the
 * tiers below it are the offer. Both read from the same `PLANS` definition and
 * the same entitlement, so the card can never advertise a capability the
 * account would then be refused.
 */
export default async function BillingSettingsPage() {
  const user = await requireClient();

  const [entitlement, subscription, address] = await Promise.all([
    getEntitlement(user.id),
    db.subscription.findUnique({ where: { userId: user.id } }),
    db.shippingAddress.findUnique({ where: { userId: user.id } }),
  ]);

  const current = entitlement.definition;
  const held = ALL_CAPABILITIES.filter((capability) => entitlement.can(capability));
  const yearly = subscription?.stripePriceId?.includes("yearly") ?? false;

  return (
    <>
      <section className="sq-card sq-pad">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span className="sq-kicker">Current plan</span>
            <h2 style={{ margin: "10px 0 6px", fontSize: 28, lineHeight: 1.1 }}>
              {current.name}
              {entitlement.isSubscribed ? (yearly ? ", yearly" : ", monthly") : ""}
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
              {entitlement.isSubscribed
                ? `${formatPrice(current.price[yearly ? "yearly" : "monthly"])} ${yearly ? "a year" : "a month"}${
                    entitlement.currentPeriodEnd
                      ? ` · ${entitlement.cancelAtPeriodEnd ? "ends" : "renews"} ${DATE.format(entitlement.currentPeriodEnd)}`
                      : ""
                  }`
                : `${entitlement.freeQuestsRemaining} of ${entitlement.freeQuestAllowance} free quests left`}
            </p>
            {entitlement.inGrace ? (
              <p style={{ marginTop: 10 }}>
                <Tag tone="stamp" small>
                  Payment retrying · access holds
                </Tag>
              </p>
            ) : null}
          </div>

          {entitlement.isSubscribed && isStripeEnabled() ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!yearly ? (
                <SqCheckoutButton
                  plan={entitlement.plan === "ultra" ? "ultra" : "explorer"}
                  interval="yearly"
                  label="Switch to yearly"
                  variant="ghost"
                />
              ) : null}
              <SqPortalButton />
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 1,
            background: "var(--line-2)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {[
            { k: "Stickers", v: String(current.capabilities.length > 0 ? stickersFor(current.id) : 6) },
            { k: "Quests", v: entitlement.isSubscribed ? "Unlimited" : `${entitlement.freeQuestsRemaining} left` },
            { k: "Reach", v: current.capabilities.includes("worldwide") ? "Worldwide" : current.capabilities.includes("europe") ? "Europe" : "Home country" },
            { k: "Post", v: current.capabilities.includes("mail") ? "Monthly envelope" : "Screen only" },
          ].map((fact) => (
            <div key={fact.k} style={{ background: "var(--paper-2)", padding: "13px 15px" }}>
              <p className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
                {fact.k}
              </p>
              <b style={{ display: "block", marginTop: 5, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19 }}>
                {fact.v}
              </b>
            </div>
          ))}
        </div>
      </section>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            What your plan includes
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            {held.length} of {ALL_CAPABILITIES.length}
          </span>
        </div>
        <ul>
          {ALL_CAPABILITIES.map((capability) => {
            const yours = entitlement.can(capability);
            const from = lowestPlanWith(capability);
            return (
              <li
                key={capability}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr) auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "13px 24px",
                  borderTop: "1px solid var(--line-2)",
                  opacity: yours ? 1 : 0.72,
                }}
              >
                <span style={{ color: yours ? "var(--moss)" : "var(--ink-3)" }}>
                  {yours ? <Glyph name="check" size={16} strokeWidth={2.4} /> : <LockGlyph size={14} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
                    {CAPABILITY_COPY[capability].title}
                  </b>
                  <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>
                    {CAPABILITY_COPY[capability].detail}
                  </span>
                </span>
                {yours ? (
                  <span className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
                    Yours
                  </span>
                ) : from ? (
                  <SqPaidChip plan={from} />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            The plans
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            {isStripeEnabled() ? "Cancel any time" : "Billing not configured here"}
          </span>
        </div>
        <ul>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === entitlement.plan;
            const buyable =
              isStripeEnabled() &&
              !isCurrent &&
              (plan.id === "explorer" || (plan.id === "ultra" && isUltraEnabled()));

            return (
              <li
                key={plan.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 18,
                  alignItems: "center",
                  padding: "16px 24px",
                  borderTop: "1px solid var(--line-2)",
                  background: isCurrent ? "var(--paper-2)" : "transparent",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, fontWeight: 600 }}>
                    {plan.name}
                    {plan.badge ? (
                      <span className="sq-tag sq-tag-xs" style={{ fontSize: 9 }}>
                        {plan.badge}
                      </span>
                    ) : null}
                    {isCurrent ? (
                      <span className="sq-tag sq-tag-green sq-tag-xs" style={{ fontSize: 9 }}>
                        Yours
                      </span>
                    ) : null}
                  </b>
                  <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
                    {plan.description}
                  </span>
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="sq-mono" style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                    {plan.price.monthly === 0 ? "Free" : `${formatPrice(plan.price.monthly)}/mo`}
                  </span>
                  {buyable ? (
                    <SqCheckoutButton
                      plan={plan.id === "ultra" ? "ultra" : "explorer"}
                      interval="monthly"
                      label={plan.tier > entitlement.tier ? "Upgrade" : "Switch"}
                      variant={plan.tier > entitlement.tier ? "primary" : "ghost"}
                    />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sq-tinted sq-pad-sm">
        <div className="sq-section-head" style={{ marginBottom: 14 }}>
          <h3 className="sq-h2" style={{ fontSize: 19 }}>
            Where the envelope goes
          </h3>
          <Link href="/settings/address" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
            Edit address →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            {address?.line1 ? (
              <>
                {address.recipient ?? user.name}
                <br />
                {address.line1}
                <br />
                {address.line2 ? (
                  <>
                    {address.line2}
                    <br />
                  </>
                ) : null}
                {[address.postcode, address.city].filter(Boolean).join(" ")}
                <br />
                {address.country}
              </>
            ) : (
              <span style={{ color: "var(--ink-3)" }}>No address on file — the envelope has nowhere to go.</span>
            )}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
            Quest cards and stickers post on the 2nd of each month. An address changed after the
            28th applies to the envelope after next.
          </p>
        </div>
      </section>
    </>
  );
}

function stickersFor(plan: string): number {
  return plan === "ultra" ? 30 : plan === "explorer" ? 10 : 6;
}
