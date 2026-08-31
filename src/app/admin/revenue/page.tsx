import type { Metadata } from "next";

import { SqSplitBar } from "@/components/sq/charts";
import { PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { getPlanSplit, getRevenueSummary, getStatusSplit } from "@/lib/admin/stats";
import { requireRank } from "@/lib/auth/guards";
import { formatPrice, PLANS } from "@/lib/config";
import { db } from "@/lib/db";
import { isStripeEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Revenue · Admin" };
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * The shape of the book, not the books.
 *
 * Every figure here is list price: we store the plan but not the billing
 * interval, and Stripe is the authority on what anybody was actually charged
 * after discounts, proration and tax. That is said on the page rather than
 * left for somebody to discover when the numbers do not reconcile.
 */
export default async function AdminRevenuePage() {
  await requireRank("ADMIN");

  const [revenue, plans, statuses, renewing] = await Promise.all([
    getRevenueSummary(),
    getPlanSplit(),
    getStatusSplit(),
    db.subscription.findMany({
      where: { currentPeriodEnd: { gte: new Date() } },
      orderBy: { currentPeriodEnd: "asc" },
      take: 12,
      select: {
        plan: true,
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        kicker="The money"
        title="Revenue"
        lede="Recurring revenue at list price — before discounts, proration and tax. Stripe is the authority on what was charged."
        right={
          isStripeEnabled() ? null : (
            <Tag tone="stamp" small>
              Stripe not configured here
            </Tag>
          )
        }
      />

      <StatGrid>
        <StatTile
          label="Monthly, at list"
          value={formatPrice(revenue.monthlyCents)}
          note={
            `${revenue.live} live subscriptions`
          }
          index={0}
        />
        <StatTile label="Yearly, at list" value={formatPrice(revenue.yearlyCents)} index={1} />
        <StatTile label="Renewing this week" count={revenue.renewingSoon} index={2} />
        <StatTile
          label="Cancelling at period end"
          count={revenue.leaving}
          note={revenue.leaving > 0 ? "Access runs to the end of what they paid for" : undefined}
          index={3}
        />
        <StatTile
          label="Payment retrying"
          count={revenue.pastDue}
          note={revenue.pastDue > 0 ? "Access holds while Stripe retries" : undefined}
          index={4}
        />
      </StatGrid>

      <section className="sq-grid sq-grid-fit-md" style={{ marginTop: 16, alignItems: "start" }}>
        <article className="sq-tinted sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 16 }}>
            Accounts by plan
          </h2>
          <SqSplitBar
            parts={plans.map((plan, index) => ({
              label: plan.label,
              value: plan.value,
              colour: ["var(--color-accent-300)", "var(--moss)", "var(--pine)"][index] ?? "var(--sage)",
            }))}
          />
        </article>

        <article className="sq-card sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 16 }}>
            Billing health
          </h2>
          <SqSplitBar
            parts={statuses.map((status) => ({
              label: status.label,
              value: status.value,
              colour:
                status.key === "active"
                  ? "var(--moss)"
                  : status.key === "trialing"
                    ? "var(--sage)"
                    : status.key === "past_due"
                      ? "var(--signal)"
                      : "var(--color-neutral-400)",
            }))}
          />
        </article>

        <article className="sq-card sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 16 }}>
            What each tier is worth
          </h2>
          <ul style={{ display: "flex", flexDirection: "column" }}>
            {PLANS.filter((plan) => plan.price.monthly > 0).map((plan) => {
              const holders = plans.find((entry) => entry.key === plan.id)?.value ?? 0;
              return (
                <li
                  key={plan.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 0",
                    borderTop: "1px solid var(--line-2)",
                    fontSize: 13,
                  }}
                >
                  <span>
                    {plan.name} · {formatPrice(plan.price.monthly)}/mo
                  </span>
                  <b className="sq-mono" style={{ fontWeight: 500 }}>
                    {holders} · {formatPrice(holders * plan.price.monthly)}
                  </b>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Next renewals
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Soonest first
          </span>
        </div>
        {renewing.length === 0 ? (
          <p style={{ padding: "16px 22px", fontSize: 13, color: "var(--ink-3)" }}>
            Nothing renews from here.
          </p>
        ) : (
          <ul className="sq-stagger">
            {renewing.map((row, index) => (
              <li
                key={row.user.email}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto auto auto",
                  gap: 16,
                  alignItems: "center",
                  padding: "13px 22px",
                  borderTop: "1px solid var(--line-2)",
                  ["--i" as string]: index,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{row.user.name}</b>
                  <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                    {row.user.email}
                  </span>
                </span>
                <Tag small>{row.plan}</Tag>
                {row.cancelAtPeriodEnd ? (
                  <Tag tone="stamp" small>
                    LEAVING
                  </Tag>
                ) : row.status === "PAST_DUE" ? (
                  <Tag tone="stamp" small>
                    RETRYING
                  </Tag>
                ) : (
                  <span />
                )}
                <span className="sq-mono" style={{ fontSize: 11, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                  {row.currentPeriodEnd ? DATE.format(row.currentPeriodEnd) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
