import type { Metadata } from "next";

import { BarSeries, RankBars, TrendArea } from "@/components/admin/charts";
import { StatGrid } from "@/components/admin/stat-grid";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import {
  getAdminOverview,
  getDifficultySplit,
  getQuestSeries,
  getTopLocations,
  getTopRegions,
} from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Quests · Admin" };
export const dynamic = "force-dynamic";

/**
 * What the generator has actually produced.
 *
 * The engine's claim is that it never repeats itself, so the figures that
 * matter here are spread rather than volume: how many distinct places and
 * signatures came out of it, and whether the grades it hands out match the
 * grades people ask for.
 */
export default async function AdminQuestsPage() {
  await requireAdmin();

  const [overview, series, difficulty, regions, locations, aggregate, distinct, recent] =
    await Promise.all([
      getAdminOverview(),
      getQuestSeries(30),
      getDifficultySplit(),
      getTopRegions(6),
      getTopLocations(8),
      db.quest.aggregate({
        _avg: { distance: true, elevationGain: true, duration: true },
      }),
      db.quest.findMany({
        select: { signature: true, location: true },
      }),
      db.quest.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          number: true,
          title: true,
          location: true,
          region: true,
          difficulty: true,
          distance: true,
          elevationGain: true,
          createdAt: true,
        },
      }),
    ]);

  const distinctSignatures = new Set(distinct.map((quest) => quest.signature)).size;
  const distinctLocations = new Set(distinct.map((quest) => quest.location)).size;

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>The engine</Eyebrow>
          <h1>Quests.</h1>
          <p>What has come out of the generator, and how widely it has spread.</p>
        </div>
        <Tag tone="ghost">{`${overview.quests} generated`}</Tag>
      </Reveal>

      <Reveal>
        <StatGrid
          items={[
            { label: "Generated", value: overview.quests, foot: "Excludes showcase quests" },
            {
              label: "Distinct signatures",
              value: distinctSignatures,
              foot:
                overview.quests > 0
                  ? `${Math.round((distinctSignatures / overview.quests) * 100)}% unique`
                  : undefined,
            },
            { label: "Trailheads used", value: distinctLocations },
            {
              label: "Avg. distance",
              value: 0,
              display: `${(aggregate._avg.distance ?? 0).toFixed(1)} km`,
            },
            {
              label: "Avg. ascent",
              value: 0,
              display: `${Math.round(aggregate._avg.elevationGain ?? 0)} m`,
            },
            {
              label: "Logged",
              value: overview.logged,
              foot: `${Math.round(overview.completionRate * 100)}% of issued`,
            },
          ]}
        />
      </Reveal>

      <div className="chart-grid">
        <Reveal delay={stagger(0)}>
          <TrendArea
            title="Issued and logged · 30 days"
            points={series.map((point) => ({
              label: point.label,
              value: point.value,
              part: point.part,
            }))}
            wholeLabel="Issued"
            partLabel="Logged since"
          />
        </Reveal>

        <Reveal delay={stagger(1)}>
          <BarSeries title="Grades handed out" points={difficulty} unitLabel="quests" />
        </Reveal>

        <Reveal delay={stagger(2)}>
          <RankBars title="Busiest regions" rows={regions} unitLabel="quests" />
        </Reveal>

        <Reveal delay={stagger(3)}>
          <RankBars title="Busiest trailheads" rows={locations} unitLabel="quests" />
        </Reveal>
      </div>

      <Reveal delay={stagger(4)} className="mt-5">
        <Panel flush>
          <PanelHead title="Latest generated" aside={<Tag tone="ghost">{`${recent.length} shown`}</Tag>} />
          {recent.length === 0 ? (
            <p className="chart-empty">The generator hasn&apos;t run yet.</p>
          ) : (
            <ul>
              {recent.map((quest, index) => (
                <Reveal
                  as="li"
                  key={quest.id}
                  delay={stagger(index, 8)}
                  className="admin-row border-b border-line px-5 py-4 last:border-b-0"
                >
                  <span className="qc-id w-[92px] shrink-0">
                    {quest.number ? `№ ${String(quest.number).padStart(4, "0")}` : "—"}
                  </span>
                  <span className="min-w-[min(100%,18rem)] flex-1">
                    <b className="block font-serif text-[16px] font-semibold tracking-[-0.02em]">
                      {quest.title}
                    </b>
                    <span className="meta mt-1 block normal-case tracking-[0.06em]">
                      {quest.location} · {quest.region}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4 font-mono text-[11px] text-ink-2">
                    <span>{quest.distance.toFixed(1)} km</span>
                    <span>{Math.round(quest.elevationGain)} m ↑</span>
                  </span>
                  <Tag tone={quest.difficulty === "EXPERT" || quest.difficulty === "HARD" ? "warm" : "ghost"}>
                    {quest.difficulty}
                  </Tag>
                  <span className="meta hidden w-24 shrink-0 md:inline">
                    {formatDate(quest.createdAt)}
                  </span>
                </Reveal>
              ))}
            </ul>
          )}
        </Panel>
      </Reveal>
    </>
  );
}
