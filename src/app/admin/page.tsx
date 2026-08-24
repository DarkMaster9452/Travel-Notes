import type { Metadata } from "next";
import Link from "next/link";

import { RankBars, TrendArea } from "@/components/admin/charts";
import { QueueList, ScopeToggle, TopNotice, Vital } from "@/components/admin/desk";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, IconArrowRight } from "@/components/field";
import { getAdminNotices } from "@/lib/admin/notifications";
import { requireAdmin } from "@/lib/auth/guards";
import {
  RANGES,
  getAdminOverview,
  getDifficultySplit,
  getFiledSeries,
  getQueueVitals,
  getReviewQueue,
  getTopLocations,
  getTopRegions,
  isRangeKey,
  type RangeKey,
} from "@/lib/admin/stats";
import { stagger } from "@/lib/motion";

export const metadata: Metadata = { title: "Overview · Admin" };
export const dynamic = "force-dynamic";

/**
 * The admin overview.
 *
 * One subject: the review queue. Everything above the charts is about who is
 * waiting for a verdict, because that is the only thing in this panel with a
 * person on the other end of it — a submission sitting for four days is
 * somebody who went out, did the thing, filed their proof and has heard
 * nothing back. Accounts, revenue and the catalogue all have their own pages
 * and none of them is urgent in that way.
 *
 * The two panels at the bottom are the only charts left of the six this page
 * used to carry, and they are the two that answer a question the queue raises
 * rather than changing the subject: *is the desk keeping up* (filed against
 * decided, over a window you choose) and *where is the work coming from*.
 *
 * Both controls write a search param instead of holding client state, so the
 * page stays one server render and a chosen view can be linked to.
 */

/** Said in words under the headline figure — "1m" is a control, not a label. */
const RANGE_CAPTION: Record<RangeKey, string> = {
  "1w": "in the last week",
  "1m": "in the last month",
  "6m": "in the last six months",
  "1y": "in the last year",
};

const RANK_VIEWS = {
  regions: { label: "Regions", title: "Busiest regions", unit: "quests" },
  grades: { label: "Grades", title: "Quests by grade", unit: "quests" },
  places: { label: "Trailheads", title: "Most-used trailheads", unit: "quests" },
} as const;

type RankKey = keyof typeof RANK_VIEWS;

function isRankKey(value: string | undefined): value is RankKey {
  return value !== undefined && value in RANK_VIEWS;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; rank?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const range: RangeKey = isRangeKey(params.range) ? params.range : "1m";
  const rank: RankKey = isRankKey(params.rank) ? params.rank : "regions";

  const [notices, overview, vitals, queue, filed, regions, grades, places] = await Promise.all([
    getAdminNotices(),
    getAdminOverview(),
    getQueueVitals(),
    getReviewQueue(6),
    getFiledSeries(range),
    getTopRegions(6),
    getDifficultySplit(),
    getTopLocations(6),
  ]);

  const rankRows = rank === "regions" ? regions : rank === "grades" ? grades : places;
  const filedTotal = filed.reduce((sum, point) => sum + point.value, 0);
  const rankTotal = rankRows.reduce((sum, row) => sum + row.value, 0);
  const scope = { range, rank };

  return (
    <>
      <Reveal as="header" className="desk-head">
        <div>
          <Eyebrow>Behind the desk</Eyebrow>
          <h1>The queue.</h1>
        </div>

        <Link href="/admin/review" className="btn btn-primary">
          {vitals.pending > 0 ? `Review ${vitals.pending} waiting` : "Open the review desk"}
          <IconArrowRight width={14} height={14} />
        </Link>
      </Reveal>

      {/* One grid for the whole page. Each block below names the area it
          occupies rather than bringing its own columns, so the four vitals,
          the queue and the two charts all sit on the same column edges. */}
      <div className="desk-grid">
        <Reveal className="desk-area-notice">
          <TopNotice notice={notices[0] ?? null} total={notices.length} />
        </Reveal>

        {/* The queue's vital signs: what is waiting, how long the worst of it
            has waited, how fast verdicts are actually turning around, and
            whether the desk is keeping pace with what comes in. */}
        <Reveal className="desk-area-vitalA">
          <Vital
            figure={{
              label: "Waiting",
              value: vitals.pending,
              late: (vitals.oldestWaitDays ?? 0) >= 4,
              foot:
                vitals.oldestWaitDays === null
                  ? "Queue is clear"
                  : vitals.oldestWaitDays === 0
                    ? "Oldest filed today"
                    : `Oldest waited ${vitals.oldestWaitDays}d`,
            }}
          />
        </Reveal>

        <Reveal className="desk-area-vitalB" delay={stagger(1)}>
          <Vital
            figure={{
              label: "Typical wait",
              value: vitals.medianWaitHours === null ? "—" : `${vitals.medianWaitHours}h`,
              foot:
                vitals.medianWaitHours === null ? "Nothing decided yet" : "Median, last 7 days",
            }}
          />
        </Reveal>

        <Reveal className="desk-area-vitalC" delay={stagger(2)}>
          <Vital
            figure={{
              label: "Decided",
              value: vitals.decidedThisWeek,
              foot: `${vitals.filedThisWeek} filed in the same week`,
            }}
          />
        </Reveal>

        <Reveal className="desk-area-vitalD" delay={stagger(3)}>
          <Vital
            figure={{
              label: "Logged",
              value: overview.logged,
              foot: `${Math.round(overview.completionRate * 100)}% of issued`,
            }}
          />
        </Reveal>

        {/* The hero: the widest box on the grid, and the only one that is a
            list of people rather than a figure. */}
        <Reveal className="desk-area-queue">
          <section className="desk-box" aria-labelledby="queue-heading">
            <header className="desk-box-head">
              <h2 id="queue-heading">Waiting on a verdict</h2>
              <span className="desk-box-aside">
                {vitals.pending === 0
                  ? "Nothing pending"
                  : `${vitals.pending} pending · weekly and monthly first`}
              </span>
            </header>
            <QueueList entries={queue} pending={vitals.pending} />
          </section>
        </Reveal>

        {/* Two charts, sharing the bottom row. One asks whether the desk is
            keeping up; the other asks where the work is coming from. */}
        <Reveal className="desk-area-trend" delay={stagger(1)}>
          <section className="desk-box">
            <header className="desk-box-head">
              <div>
                <h2>Proof filed</h2>
                <p className="desk-figure">
                  <b>{filedTotal}</b>
                  <span>{RANGE_CAPTION[range]}</span>
                </p>
              </div>
              <ScopeToggle
                options={Object.entries(RANGES).map(([key, value]) => ({
                  key,
                  label: value.label,
                }))}
                active={range}
                param="range"
                params={scope}
                label="Range"
              />
            </header>
            <TrendArea
              bare
              title="Proof filed"
              points={filed}
              wholeLabel="Filed"
              partLabel="Decided since"
              note="Decided is nested inside filed, so the gap between the bands is the backlog."
            />
          </section>
        </Reveal>

        <Reveal className="desk-area-rank" delay={stagger(2)}>
          <section className="desk-box">
            <header className="desk-box-head">
              <div>
                <h2>{RANK_VIEWS[rank].title}</h2>
                <p className="desk-figure">
                  <b>{rankTotal}</b>
                  <span>quests across {rankRows.length}</span>
                </p>
              </div>
              <ScopeToggle
                options={Object.entries(RANK_VIEWS).map(([key, value]) => ({
                  key,
                  label: value.label,
                }))}
                active={rank}
                param="rank"
                params={scope}
                label="Breakdown"
              />
            </header>
            <RankBars
              bare
              title={RANK_VIEWS[rank].title}
              rows={rankRows}
              unitLabel={RANK_VIEWS[rank].unit}
            />
          </section>
        </Reveal>
      </div>

    </>
  );
}
