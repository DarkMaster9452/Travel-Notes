import type { Metadata } from "next";
import Link from "next/link";

import { SqColumnChart, SqSplitBar, SqStackedBars } from "@/components/sq/charts";
import { SqSystemsSummary, SqSystemTile } from "@/components/sq/systems";
import { PageHeader, StatGrid, StatTile } from "@/components/sq/ui";
import { getAdminNotices } from "@/lib/admin/notifications";
import { readSystems } from "@/lib/admin/systems";
import {
  getAdminOverview,
  getDifficultySplit,
  getPlanSplit,
  getQuestSeries,
  getRevenueSummary,
  getSignupSeries,
} from "@/lib/admin/stats";
import { getReviewQueue } from "@/lib/admin/review-queue";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/config";

export const metadata: Metadata = { title: "Overview · Admin" };
export const dynamic = "force-dynamic";

const TONE_COLOUR: Record<string, string> = {
  critical: "var(--signal)",
  warning: "var(--signal-2)",
  info: "var(--sage)",
  clear: "var(--moss)",
};

/**
 * The panel's front page.
 *
 * Ordered by what would stop you reading the rest of it. Whether the product
 * is working at all comes first, then what needs a decision inside it, then
 * the figures, then the shape of the month. Every figure is a live count taken
 * when the page loaded and every system was probed then too — nothing here is
 * cached or rolled up, and the page says so.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();

  const [overview, notices, queue, signups, quests, plans, grades, revenue, systems] = await Promise.all([
    getAdminOverview(),
    getAdminNotices(),
    getReviewQueue(100),
    getSignupSeries(30),
    getQuestSeries(30),
    getPlanSplit(),
    getDifficultySplit(),
    getRevenueSummary(),
    readSystems(),
  ]);

  const open = notices.filter((notice) => notice.tone !== "clear");
  const oldest = queue.cards[0]?.filedAt ? daysSince(queue.cards[0].filedAt) : null;

  return (
    <>
      <PageHeader
        kicker="Behind the desk"
        title="Overview"
        lede="Every figure on this page is a live count, and every system above was checked seconds ago."
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/admin/systems" className="sq-btn sq-btn-ghost">
              Systems
            </Link>
            <Link href="/admin/database" className="sq-btn sq-btn-ghost">
              Inspect the database
            </Link>
            <Link href="/admin/review" className="sq-btn sq-btn-primary" style={{ background: "var(--pine)" }}>
              Open the review deck
            </Link>
          </div>
        }
      />

      <section className="sq-card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="sq-section-head sq-rule-head">
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <h2 className="sq-h2" style={{ fontSize: 19 }}>
              Systems
            </h2>
            <SqSystemsSummary systems={systems} />
          </div>
          <Link href="/admin/systems" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
            Every system in full &rarr;
          </Link>
        </div>
        <div
          className="sq-stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(232px,1fr))",
            gap: 12,
            padding: 18,
          }}
        >
          {systems.map((system, index) => (
            <div key={system.id} style={{ ["--i" as string]: index, display: "flex" }}>
              <SqSystemTile system={system} />
            </div>
          ))}
        </div>
      </section>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Needs attention
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10.5, letterSpacing: "0.08em" }}>
            {open.length} open
          </span>
        </div>
        <ul className="sq-stagger">
          {notices.map((notice, index) => (
            <li
              key={notice.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 22px",
                borderTop: "1px solid var(--line-2)",
                ["--i" as string]: index,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  flex: "0 0 7px",
                  background: TONE_COLOUR[notice.tone] ?? "var(--sage)",
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 14.5 }}>{notice.title}</b>
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{notice.detail}</span>
              </span>
              <span
                className="sq-kicker-sm"
                style={{ fontSize: 10, color: TONE_COLOUR[notice.tone] ?? "var(--ink-3)" }}
              >
                {notice.tone}
              </span>
              <Link href={notice.href} style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                {notice.action} →
              </Link>
            </li>
          ))}
          {notices.length === 0 ? (
            <li style={{ padding: "14px 22px", fontSize: 13, color: "var(--ink-3)" }}>
              Nothing is asking for a decision.
            </li>
          ) : null}
        </ul>
      </section>

      <div style={{ marginTop: 16 }}>
        <StatGrid>
          <StatTile
            label="Accounts"
            count={overview.customers}
            countId="admin-customers"
            note={`${overview.newThisWeek} opened this week`}
            index={0}
          />
          <StatTile
            label="Subscribers"
            count={overview.subscribers}
            countId="admin-subs"
            note={`${Math.round(overview.conversionRate * 100)}% of accounts`}
            index={1}
          />
          <StatTile
            label="Quests issued"
            count={overview.issued}
            countId="admin-issued"
            note={`${Math.round(overview.completionRate * 100)}% logged`}
            index={2}
          />
          <StatTile label="In the catalogue" count={overview.quests} countId="admin-quests" index={3} />
          <StatTile
            label="Live sessions"
            count={overview.liveSessions}
            countId="admin-sessions"
            index={4}
          />
        </StatGrid>
      </div>

      <section
        className="sq-grid"
        style={{ marginTop: 16, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", alignItems: "start" }}
      >
        <article className="sq-slab" style={{ padding: "22px 24px" }}>
          <span className="sq-kicker">Review queue</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, margin: "14px 0 6px" }}>
            <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 42, lineHeight: 0.9 }}>
              {queue.total}
            </b>
            <span style={{ fontSize: 13, paddingBottom: 6, color: "var(--forest-ink-3)" }}>
              waiting on a reader
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--forest-ink-3)", marginBottom: 18 }}>
            {oldest === null
              ? "Nothing is waiting."
              : `Oldest filed ${oldest === 0 ? "today" : `${oldest} ${oldest === 1 ? "day" : "days"} ago`} · ${queue.cadenced} carry a featured stamp`}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link
              href="/admin/review"
              className="sq-btn sq-btn-block"
              style={{ background: "var(--signal)", color: "#fff" }}
            >
              Start reading
            </Link>
            <Link
              href="/admin/schedule"
              className="sq-btn sq-btn-block"
              style={{ border: "1px solid rgba(255,255,255,0.24)", color: "var(--forest-ink)" }}
            >
              Book next week&rsquo;s quest
            </Link>
            <Link
              href="/admin/quests"
              className="sq-btn sq-btn-block"
              style={{ border: "1px solid rgba(255,255,255,0.24)", color: "var(--forest-ink)" }}
            >
              Publish a draft
            </Link>
          </div>
        </article>

        <div className="sq-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
          <Trend
            title="Accounts opened"
            wholeLabel="Opened"
            partLabel="Now paying"
            series={signups}
            note="The dark band is the share of that day's signups that now hold a live subscription."
          />
          <Trend
            title="Quests issued"
            wholeLabel="Issued"
            partLabel="Logged"
            series={quests}
            note="Logged means proof was filed against it, not that the proof was approved."
          />
        </div>
      </section>

      <section
        className="sq-grid"
        style={{ marginTop: 16, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", alignItems: "start" }}
      >
        <article className="sq-tinted sq-pad-sm">
          <h3 className="sq-h2" style={{ fontSize: 18, marginBottom: 16 }}>
            Accounts by plan
          </h3>
          <SqSplitBar
            parts={plans.map((plan, index) => ({
              label: plan.label,
              value: plan.value,
              colour: ["var(--color-accent-300)", "var(--moss)", "var(--pine)"][index] ?? "var(--sage)",
            }))}
          />
        </article>

        <article className="sq-card sq-pad-sm">
          <h3 className="sq-h2" style={{ fontSize: 18, marginBottom: 18 }}>
            Quests by grade
          </h3>
          <SqColumnChart
            columns={grades.map((grade, index) => ({
              label: grade.label,
              value: grade.value,
              colour: ["var(--color-accent-300)", "var(--color-accent-400)", "var(--moss)", "var(--pine)"][index],
            }))}
          />
        </article>

        <article className="sq-card sq-pad-sm" style={{ borderColor: "var(--line)", boxShadow: "none" }}>
          <div className="sq-section-head" style={{ marginBottom: 14 }}>
            <h3 className="sq-h2" style={{ fontSize: 18 }}>
              Recurring revenue
            </h3>
            <Link href="/admin/revenue" style={{ fontSize: 12.5 }}>
              Revenue in full →
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 16 }}>
            <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 34, lineHeight: 0.9 }}>
              {formatPrice(revenue.monthlyCents)}
            </b>
            <span className="sq-mono" style={{ fontSize: 12, paddingBottom: 5, color: "var(--ink-3)" }}>
              list price · {revenue.paying} paying{revenue.demo > 0 ? `, ${revenue.demo} demo` : ""}
            </span>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line-2)" }}>
              <span>Renewing this week</span>
              <b className="sq-mono" style={{ fontWeight: 500 }}>
                {revenue.renewingSoon}
              </b>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line-2)" }}>
              <span>Cancelling at period end</span>
              <b className="sq-mono" style={{ fontWeight: 500 }}>
                {revenue.leaving}
              </b>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line-2)" }}>
              <span>Payment failed, retrying</span>
              <b className="sq-mono" style={{ fontWeight: 500, color: "var(--signal)" }}>
                {revenue.pastDue}
              </b>
            </li>
          </ul>
        </article>
      </section>
    </>
  );
}

function Trend({
  title,
  wholeLabel,
  partLabel,
  series,
  note,
}: {
  title: string;
  wholeLabel: string;
  partLabel: string;
  series: { value: number; part: number }[];
  note: string;
}) {
  const max = Math.max(1, ...series.map((point) => point.value));
  const bars = series.map((point) => ({
    whole: Math.max(0, ((point.value - point.part) / max) * 100),
    part: (point.part / max) * 100,
  }));

  return (
    <article className="sq-card sq-pad-sm">
      <h3 className="sq-h2" style={{ fontSize: 16, marginBottom: 10 }}>
        {title}
      </h3>
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        <Legend colour="var(--sage)" label={wholeLabel} />
        <Legend colour="var(--pine)" label={partLabel} />
      </div>
      <SqStackedBars bars={bars} />
      <p style={{ marginTop: 11, fontSize: 11.5, lineHeight: 1.5, color: "var(--ink-3)" }}>{note}</p>
    </article>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span
      className="sq-mono"
      style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 5, color: "var(--ink-2)" }}
    >
      <i style={{ width: 8, height: 8, borderRadius: 2, background: colour, display: "block" }} />
      {label}
    </span>
  );
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
