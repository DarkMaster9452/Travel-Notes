import type { Metadata } from "next";
import Link from "next/link";

import { SqCheckoutEmbed, SqPortalButton } from "@/components/sq/plan-actions";
import { Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { Glyph, LockGlyph } from "@/components/sq/icons";
import { SqPaidChip } from "@/components/sq/locked";
import {
  ALL_CAPABILITIES,
  capabilityCopy,
  lowestPlanWith,
  planCopy,
  PLANS,
} from "@/lib/config";
import { db } from "@/lib/db";
import { reconcileSubscription } from "@/lib/billing";
import { getEntitlement } from "@/lib/entitlements";
import { envelopeCopy, getEnvelopeStatus } from "@/lib/envelope";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { isStripeEnabled, isUltraEnabled } from "@/lib/env";
import { intervalForPriceId } from "@/lib/stripe";

export const metadata: Metadata = { title: "Plan & billing" };
export const dynamic = "force-dynamic";

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

  // Before reading anything, make sure our idea of this account matches
  // Stripe's. Normally a no-op that returns on the first query; when it is not,
  // it is because a purchase went through and never reached us, and this is
  // the screen where that would be most obvious and most upsetting.
  await reconcileSubscription(user.id, user.email);

  const [entitlement, subscription, address, envelope, t, locale] = await Promise.all([
    getEntitlement(user.id),
    db.subscription.findUnique({ where: { userId: user.id } }),
    db.shippingAddress.findUnique({ where: { userId: user.id } }),
    getEnvelopeStatus(user.id, user.name),
    getT(user.id),
    getLocale(user.id),
  ]);

  const current = entitlement.definition;
  const currentCopy = planCopy(t, entitlement.plan);
  const held = ALL_CAPABILITIES.filter((capability) => entitlement.can(capability));
  const yearly = intervalForPriceId(subscription?.stripePriceId) === "yearly";

  return (
    <>
      <section className="sq-card sq-pad">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span className="sq-kicker">{t.billing.currentPlan}</span>
            <h2 style={{ margin: "10px 0 6px", fontSize: 28, lineHeight: 1.1 }}>
              {currentCopy.name}
              {entitlement.isSubscribed ? (yearly ? t.billing.yearly : t.billing.monthly) : ""}
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
              {entitlement.isSubscribed
                ? [
                    yearly
                      ? t.billing.aYear(formatMoney(locale, current.price.yearly))
                      : t.billing.aMonth(formatMoney(locale, current.price.monthly)),
                    entitlement.currentPeriodEnd
                      ? (entitlement.cancelAtPeriodEnd ? t.billing.ends : t.billing.renews)(
                          formatDate(locale, entitlement.currentPeriodEnd, "dayMonth"),
                        )
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : t.billing.freeLeft(
                    entitlement.freeQuestsRemaining,
                    entitlement.freeQuestAllowance,
                  )}
            </p>
            {entitlement.inGrace ? (
              <p style={{ marginTop: 10 }}>
                <Tag tone="stamp" small>
                  {t.billing.retrying}
                </Tag>
              </p>
            ) : null}
          </div>

          {entitlement.isSubscribed && isStripeEnabled() ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!yearly ? (
                <SqCheckoutEmbed
                  plan={entitlement.plan === "ultra" ? "ultra" : "explorer"}
                  interval="yearly"
                  label={t.billing.switchToYearly}
                  variant="ghost"
                />
              ) : null}
              <SqPortalButton label={t.billing.managePayment} />
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
            {
              k: t.billing.facts.stickers,
              v: String(current.capabilities.length > 0 ? stickersFor(current.id) : 6),
            },
            {
              k: t.billing.facts.quests,
              v: entitlement.isSubscribed
                ? t.billing.facts.unlimited
                : t.billing.facts.questsLeft(entitlement.freeQuestsRemaining),
            },
            {
              k: t.billing.facts.reach,
              v: current.capabilities.includes("worldwide")
                ? t.billing.facts.worldwide
                : current.capabilities.includes("europe")
                  ? t.billing.facts.europe
                  : t.billing.facts.homeCountry,
            },
            {
              k: t.billing.facts.post,
              v: current.capabilities.includes("mail")
                ? t.billing.facts.envelope
                : t.billing.facts.screenOnly,
            },
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
            {t.billing.includesHeading}
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
                    {capabilityCopy(t, capability).title}
                  </b>
                  <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>
                    {capabilityCopy(t, capability).detail}
                  </span>
                </span>
                {yours ? (
                  <span className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
                    {t.common.yours}
                  </span>
                ) : from ? (
                  <SqPaidChip plan={from} capability={capability} />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            {t.billing.plansHeading}
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            {isStripeEnabled() ? t.billing.cancelAnyTime : t.billing.notConfigured}
          </span>
        </div>
        <ul>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === entitlement.plan;
            const buyable =
              isStripeEnabled() &&
              !isCurrent &&
              (plan.id === "explorer" || (plan.id === "ultra" && isUltraEnabled()));
            const copy = planCopy(t, plan.id);

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
                    {copy.name}
                    {copy.badge ? (
                      <span className="sq-tag sq-tag-xs" style={{ fontSize: 9 }}>
                        {copy.badge}
                      </span>
                    ) : null}
                    {isCurrent ? (
                      <span className="sq-tag sq-tag-green sq-tag-xs" style={{ fontSize: 9 }}>
                        {t.common.yours}
                      </span>
                    ) : null}
                  </b>
                  <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
                    {copy.description}
                  </span>
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="sq-mono" style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                    {plan.price.monthly === 0
                      ? t.common.free
                      : `${formatMoney(locale, plan.price.monthly)}${t.common.perMonth}`}
                  </span>
                  {buyable ? (
                    <SqCheckoutEmbed
                      plan={plan.id === "ultra" ? "ultra" : "explorer"}
                      interval="monthly"
                      label={plan.tier > entitlement.tier ? t.billing.upgrade : t.billing.switch}
                      variant={plan.tier > entitlement.tier ? "primary" : "ghost"}
                    />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* One place decides whether post actually goes out — `lib/envelope` — so
          this card, the sticker sheet and the address form cannot each reach
          their own conclusion about somebody's envelope. */}
      <section className="sq-tinted sq-pad-sm">
        <div className="sq-section-head" style={{ marginBottom: 14 }}>
          <h3 className="sq-h2" style={{ fontSize: 19 }}>
            {t.billing.envelopeHeading}
          </h3>
          <Link href="/settings/address" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
            {envelope.posts ? t.billing.editAddress : t.billing.addAddress}
          </Link>
        </div>

        <p style={{ marginBottom: 14 }}>
          <Tag tone={envelope.posts ? "green" : envelope.reason === "no_address" ? "stamp" : "plain"} small>
            {envelopeCopy(t, envelope.reason).title}
          </Tag>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            {envelope.posts ? (
              <>
                {envelope.address.recipient}
                <br />
                {envelope.address.line1}
                <br />
                {envelope.address.line2 ? (
                  <>
                    {envelope.address.line2}
                    <br />
                  </>
                ) : null}
                {[envelope.address.postcode, envelope.address.city].filter(Boolean).join(" ")}
                <br />
                {envelope.address.country}
              </>
            ) : (
              <span style={{ color: "var(--ink-3)" }}>
                {address ? t.billing.partialAddress : t.billing.noAddress}
              </span>
            )}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
            {envelopeCopy(t, envelope.reason).detail}
          </p>
        </div>
      </section>
    </>
  );
}

function stickersFor(plan: string): number {
  return plan === "ultra" ? 30 : plan === "explorer" ? 10 : 6;
}
