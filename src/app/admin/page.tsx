import type { Metadata } from "next";
import Link from "next/link";

import { BarSeries, RankBars, SplitBar, TrendArea } from "@/components/admin/charts";
import { StatGrid } from "@/components/admin/stat-grid";
import { Reveal } from "@/components/app/motion";
import { Eyebrow } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { RAMP_3, STATUS_COLOR } from "@/lib/admin/palette";
import {
  getAdminOverview,
  getDifficultySplit,
  getPlanSplit,
  getQuestSeries,
  getSignupSeries,
  getStatusSplit,
  getTopRegions,
} from "@/lib/admin/stats";
import { stagger } from "@/lib/motion";

export const metadata: Metadata = { title: "Overview · Admin" };
export const dynamic = "force-dynamic";

/**
 * The admin overview.
 *
 * Everything here is a live query — there is no seeded figure and no
 * placeholder chart. Where a number is an estimate it says so on the chart
 * rather than in a footnote nobody reads.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();

  const [overview, signups, questSeries, planSplit, statusSplit, difficulty, regions] =
    await Promise.all([
      getAdminOverview(),
      getSignupSeries(30),
      getQuestSeries(30),
      getPlanSplit(),
      getStatusSplit(),
      getDifficultySplit(),
      getTopRegions(6),
    ]);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Behind the desk</Eyebrow>
          <h1>Overview.</h1>
          <p>Every figure on this page is a live count, taken when you loaded it.</p>
        </div>
        <Link href="/admin/database" className="btn btn-ghost btn-sm">
          Inspect the database
        </Link>
      </Reveal>

      <Reveal>
        <StatGrid
          items={[
            {
              label: "Customers",
              value: overview.customers,
              delta: overview.newThisWeek - overview.newLastWeek,
              deltaLabel: "vs last week",
            },
            {
              label: "Subscribers",
              value: overview.subscribers,
              foot: `${Math.round(overview.conversionRate * 100)}% of accounts`,
            },
            {
              label: "Quests issued",
              value: overview.issued,
              delta: overview.issuedThisWeek - overview.issuedLastWeek,
              deltaLabel: "vs last week",
            },
            {
              label: "Quests logged",
              value: overview.logged,
              foot: `${Math.round(overview.completionRate * 100)}% of issued`,
            },
            { label: "Live sessions", value: overview.liveSessions, foot: "Not yet expired" },
          ]}
        />
      </Reveal>

      <div className="chart-grid">
        <Reveal delay={stagger(0)}>
          <TrendArea
            title="Accounts opened · 30 days"
            points={signups.map((point) => ({
              label: point.label,
              value: point.value,
              part: point.part,
            }))}
            wholeLabel="Signed up"
            partLabel="Now subscribed"
            note="The dark band is the share of that day's cohort paying today, not the day they paid."
          />
        </Reveal>

        <Reveal delay={stagger(1)}>
          <TrendArea
            title="Quests issued · 30 days"
            points={questSeries.map((point) => ({
              label: point.label,
              value: point.value,
              part: point.part,
            }))}
            wholeLabel="Issued"
            partLabel="Logged since"
            note="Logged quests are counted on the day they were issued, so the bands nest."
          />
        </Reveal>

        <Reveal delay={stagger(2)}>
          <SplitBar
            title="Accounts by plan"
            unitLabel="accounts"
            segments={planSplit.map((segment, index) => ({
              ...segment,
              color: RAMP_3[Math.min(index, RAMP_3.length - 1)],
            }))}
          />
        </Reveal>

        <Reveal delay={stagger(3)}>
          <SplitBar
            title="Subscriptions by status"
            unitLabel="subscriptions"
            segments={[
              { ...statusSplit[0], color: STATUS_COLOR.good },
              { ...statusSplit[1], color: STATUS_COLOR.trialing },
              { ...statusSplit[2], color: STATUS_COLOR.alert },
              { ...statusSplit[3], color: STATUS_COLOR.dormant },
            ]}
            note="Past due keeps access while Stripe retries the payment."
          />
        </Reveal>

        <Reveal delay={stagger(4)}>
          <BarSeries title="Quests by grade" points={difficulty} unitLabel="quests" />
        </Reveal>

        <Reveal delay={stagger(5)}>
          <RankBars title="Busiest regions" rows={regions} unitLabel="quests" />
        </Reveal>
      </div>
    </>
  );
}
