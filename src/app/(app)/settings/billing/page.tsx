import type { Metadata } from "next";
import { Check, Clock, Lock, Mail } from "lucide-react";
import Link from "next/link";

import { PaidChip } from "@/components/app/locked";
import { CheckoutButton, CheckoutListener, PortalButton } from "@/components/app/plan-actions";
import { Pane } from "@/components/app/pane";
import { Badge, PlanBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { type } from "@/components/ui/typography";
import { stickerAllowance } from "@/lib/achievements";
import { requireClient } from "@/lib/auth/guards";
import { reconcileSubscription } from "@/lib/billing";
import { ALL_CAPABILITIES, capabilityCopy, lowestPlanWith, planCopy, PLANS } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { envelopeCopy, getEnvelopeStatus } from "@/lib/envelope";
import { isPaddleEnabled, isUltraEnabled } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { intervalForPriceId } from "@/lib/paddle";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.settings.items.billing };
}
export const dynamic = "force-dynamic";

/**
 * What this account is on, and what else there is.
 *
 * The current plan is stated as a fact — name, price, renewal date — and the
 * tiers below it are the offer. Both read from the same `PLANS` definition and
 * the same entitlement, so the page can never advertise a capability the
 * account would then be refused.
 */
export default async function BillingSettingsPage() {
  const user = await requireClient();
  // Before reading anything, make sure our idea of this account matches
  // Paddle's. Normally a no-op; when it is not, it is because a purchase went
  // through and never reached us, and this is where that would be most obvious.
  await reconcileSubscription(user.id, user.email);

  const [entitlement, subscription, address, envelope, reader] = await Promise.all([
    getEntitlement(user.id),
    db.subscription.findUnique({ where: { userId: user.id } }),
    db.shippingAddress.findUnique({ where: { userId: user.id } }),
    getEnvelopeStatus(user.id, user.name),
    getReader(user.id),
  ]);
  const { t, locale } = reader;
  const words = t.billing;

  const current = entitlement.definition;
  const currentCopy = planCopy(t, entitlement.plan);
  const held = ALL_CAPABILITIES.filter((capability) => entitlement.can(capability));
  const yearly = intervalForPriceId(subscription?.paddlePriceId) === "yearly";
  const paddle = isPaddleEnabled();
  const envelopeWords = envelopeCopy(t, envelope.reason);

  const facts = [
    { label: words.facts.stickers, value: String(stickerAllowance(entitlement.plan)) },
    {
      label: words.facts.quests,
      value: entitlement.isSubscribed
        ? words.facts.unlimited
        : words.facts.questsLeft(entitlement.freeQuestsRemaining),
    },
    {
      label: words.facts.reach,
      value: current.capabilities.includes("worldwide")
        ? words.facts.worldwide
        : current.capabilities.includes("europe")
          ? words.facts.europe
          : words.facts.homeCountry,
    },
    {
      label: words.facts.post,
      value: current.capabilities.includes("mail") ? words.facts.envelope : words.facts.screenOnly,
    },
  ];

  return (
    <>
      {/* Completing a purchase is the page's business, not any one button's. */}
      <CheckoutListener />

      {/* --- the plan this account is on ------------------------------------ */}
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-overline font-semibold uppercase text-subtle">{words.currentPlan}</p>
            <h2 className={cn(type.h2, "mt-2")}>
              {currentCopy.name}
              {entitlement.isSubscribed ? (yearly ? words.yearly : words.monthly) : ""}
            </h2>
            <p className="mt-1 text-body-sm text-muted">
              {entitlement.isSubscribed
                ? [
                    yearly
                      ? words.aYear(formatMoney(locale, current.price.yearly))
                      : words.aMonth(formatMoney(locale, current.price.monthly)),
                    entitlement.currentPeriodEnd
                      ? (entitlement.cancelAtPeriodEnd ? words.ends : words.renews)(
                          formatDate(locale, entitlement.currentPeriodEnd, "dayMonth"),
                        )
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : words.freeLeft(entitlement.freeQuestsRemaining, entitlement.freeQuestAllowance)}
            </p>
            {entitlement.inGrace ? (
              <Badge tone="warning" icon={Clock} className="mt-3">
                {words.retrying}
              </Badge>
            ) : null}
          </div>
          {entitlement.isSubscribed && paddle ? (
            <div className="flex flex-wrap gap-2">
              {!yearly ? (
                <CheckoutButton
                  plan={entitlement.plan === "ultra" ? "ultra" : "explorer"}
                  interval="yearly"
                  label={words.switchToYearly}
                  variant="secondary"
                />
              ) : null}
              <PortalButton label={words.managePayment} />
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-control bg-border sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse bg-surface-sunken px-3 py-3">
              <dt className="text-caption text-muted">{fact.label}</dt>
              <dd className="text-body font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* --- what the plan includes ----------------------------------------- */}
      <Pane title={words.includesHeading} note={t.common.ofTotal(held.length, ALL_CAPABILITIES.length)}>
        <ul className="divide-y divide-border border-t border-border">
          {ALL_CAPABILITIES.map((capability) => {
            const yours = entitlement.can(capability);
            const from = lowestPlanWith(capability);
            const copy = capabilityCopy(t, capability);
            return (
              <li key={capability} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-pill",
                    yours ? "bg-success-soft text-success" : "bg-surface-sunken text-subtle",
                  )}
                >
                  {yours ? <Check className="size-4" aria-hidden="true" /> : <Lock className="size-3.5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <b className={cn("block text-body-sm font-semibold", !yours && "text-muted")}>{copy.title}</b>
                  <span className="text-caption text-muted">{copy.detail}</span>
                </span>
                {yours ? (
                  <Badge tone="success" size="sm">
                    {t.common.yours}
                  </Badge>
                ) : from ? (
                  <PaidChip plan={from} />
                ) : null}
              </li>
            );
          })}
        </ul>
      </Pane>

      {/* --- the plans ------------------------------------------------------ */}
      <Pane title={words.plansHeading} note={paddle ? words.cancelAnyTime : words.notConfigured}>
        <ul className="divide-y divide-border border-t border-border">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === entitlement.plan;
            const buyable =
              paddle && !isCurrent && (plan.id === "explorer" || (plan.id === "ultra" && isUltraEnabled()));
            const copy = planCopy(t, plan.id);
            return (
              <li
                key={plan.id}
                className={cn(
                  "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                  isCurrent && "bg-primary-soft/40",
                )}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <PlanBadge plan={plan.id}>{copy.name}</PlanBadge>
                    {copy.badge ? <Badge tone="outline" size="sm">{copy.badge}</Badge> : null}
                    {isCurrent ? (
                      <Badge tone="success" size="sm" icon={Check}>
                        {t.common.yours}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="mt-2 block text-caption text-muted">{copy.description}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-body-sm font-semibold tabular-nums">
                    {plan.price.monthly === 0
                      ? t.common.free
                      : `${formatMoney(locale, plan.price.monthly)} ${t.landing.pricing.perMonth}`}
                  </span>
                  {buyable ? (
                    <CheckoutButton
                      plan={plan.id === "ultra" ? "ultra" : "explorer"}
                      interval="monthly"
                      label={plan.tier > entitlement.tier ? words.upgrade : words.switch}
                      variant={plan.tier > entitlement.tier ? "primary" : "secondary"}
                    />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </Pane>

      {/* --- where the envelope goes ----------------------------------------
          One place decides whether post actually goes out — `lib/envelope` —
          so this card, the sticker sheet and the address form agree. */}
      <Pane
        title={words.envelopeHeading}
        action={
          <Link href="/settings/address" className="text-body-sm font-medium text-primary underline underline-offset-2">
            {(envelope.posts ? words.editAddress : words.addAddress).replace(" →", "")}
          </Link>
        }
        padded
      >
        <Alert
          tone={envelope.posts ? "success" : envelope.reason === "no_address" ? "warning" : "info"}
          title={envelopeWords.title}
          className="w-full"
        >
          {envelopeWords.detail}
        </Alert>
        <p className="flex items-start gap-3 text-body-sm">
          <Mail className="mt-0.5 size-5 shrink-0 text-subtle" aria-hidden="true" />
          {envelope.posts ? (
            <span>
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
            </span>
          ) : (
            <span className="text-muted">{address ? words.partialAddress : words.noAddress}</span>
          )}
        </p>
      </Pane>
    </>
  );
}
