import type { Metadata } from "next";

import { SplitBar } from "@/components/admin/charts";
import { StatGrid } from "@/components/admin/stat-grid";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { RAMP_3, STATUS_COLOR } from "@/lib/admin/palette";
import { getPlanSplit, getRevenueSummary, getStatusSplit } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";
import { PLANS, formatPrice } from "@/lib/config";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing · Admin" };
export const dynamic = "force-dynamic";

/**
 * Billing, from this side of the desk.
 *
 * Recurring revenue is computed at list price and labelled as an estimate
 * everywhere it appears. Stripe knows what was actually charged; this page
 * knows the shape of the book, which is the question an operator is asking
 * when they open it.
 */
export default async function AdminRevenuePage() {
  await requireAdmin();

  const [revenue, planSplit, statusSplit, recent] = await Promise.all([
    getRevenueSummary(),
    getPlanSplit(),
    getStatusSplit(),
    db.subscription.findMany({
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        id: true,
        plan: true,
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Money</Eyebrow>
          <h1>Billing.</h1>
          <p>
            Recurring revenue at list price — before discounts, proration and tax. Stripe is the
            authority on what was charged.
          </p>
        </div>
        <Tag tone="ghost">{`${revenue.live} live`}</Tag>
      </Reveal>

      <Reveal>
        <StatGrid
          items={[
            {
              label: "Est. monthly",
              value: revenue.monthlyCents,
              display: formatPrice(revenue.monthlyCents),
              foot: "At list price",
            },
            {
              label: "Est. yearly",
              value: revenue.yearlyCents,
              display: formatPrice(revenue.yearlyCents),
              foot: "Monthly × 12",
            },
            { label: "Live subscriptions", value: revenue.live },
            { label: "Renewing this week", value: revenue.renewingSoon },
            {
              label: "Cancelling",
              value: revenue.leaving,
              foot: revenue.leaving > 0 ? "Ends at period end" : "Nobody on the way out",
            },
            {
              label: "Past due",
              value: revenue.pastDue,
              foot: revenue.pastDue > 0 ? "Stripe is retrying" : "All payments clean",
            },
          ]}
        />
      </Reveal>

      <div className="chart-grid">
        <Reveal delay={stagger(0)}>
          <SplitBar
            title="Where the revenue sits"
            unitLabel="accounts"
            segments={planSplit.map((segment, index) => ({
              ...segment,
              color: RAMP_3[Math.min(index, RAMP_3.length - 1)],
            }))}
            note={PLANS.filter((plan) => plan.price.monthly > 0)
              .map((plan) => `${plan.name} ${formatPrice(plan.price.monthly)}/mo`)
              .join(" · ")}
          />
        </Reveal>

        <Reveal delay={stagger(1)}>
          <SplitBar
            title="Subscription health"
            unitLabel="subscriptions"
            segments={[
              { ...statusSplit[0], color: STATUS_COLOR.good },
              { ...statusSplit[1], color: STATUS_COLOR.trialing },
              { ...statusSplit[2], color: STATUS_COLOR.alert },
              { ...statusSplit[3], color: STATUS_COLOR.dormant },
            ]}
          />
        </Reveal>
      </div>

      <Reveal delay={stagger(2)} className="mt-5">
        <Panel flush>
          <PanelHead title="Latest billing changes" aside={<Tag tone="ghost">{`${recent.length} shown`}</Tag>} />
          {recent.length === 0 ? (
            <p className="chart-empty">No subscription rows yet.</p>
          ) : (
            <ul>
              {recent.map((row, index) => (
                <Reveal
                  as="li"
                  key={row.id}
                  delay={stagger(index, 8)}
                  className="admin-row border-b border-line px-5 py-4 last:border-b-0"
                >
                  <span className="min-w-[min(100%,14rem)] flex-1">
                    <b className="block text-[15px] font-semibold">{row.user.name}</b>
                    <span className="meta normal-case tracking-[0.06em]">{row.user.email}</span>
                  </span>
                  <Tag tone={row.plan === "ULTRA" ? "pine" : row.plan === "EXPLORER" ? "pine" : "ghost"}>
                    {row.plan}
                  </Tag>
                  <Tag tone={row.status === "PAST_DUE" ? "warm" : "ghost"}>{row.status}</Tag>
                  <span className="meta w-32 shrink-0">
                    {row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : "—"}
                  </span>
                  {row.cancelAtPeriodEnd && <Tag tone="warm">Cancelling</Tag>}
                </Reveal>
              ))}
            </ul>
          )}
        </Panel>
      </Reveal>
    </>
  );
}
