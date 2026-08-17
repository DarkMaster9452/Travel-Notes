import type { Metadata } from "next";

import { Reveal } from "@/components/app/motion";
import { StatGrid } from "@/components/admin/stat-grid";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";

export const metadata: Metadata = { title: "Locations · Admin" };
export const dynamic = "force-dynamic";

/**
 * Where quests send people.
 *
 * Built from the quests themselves rather than a separate places table: a
 * location exists because a quest points at it, so a second list would only
 * ever be a list that disagreed with this one.
 */
export default async function LocationsPage() {
  await requireAdmin();

  const [grouped, regions, countries] = await Promise.all([
    db.quest.groupBy({
      by: ["location", "region", "country"],
      _count: { _all: true },
      _avg: { distance: true, elevationGain: true },
      orderBy: { _count: { location: "desc" } },
      take: 200,
    }),
    db.quest.findMany({ distinct: ["region"], select: { region: true } }),
    db.quest.findMany({ distinct: ["country"], select: { country: true } }),
  ]);

  const issuedByLocation = new Map<string, number>();
  const issued = await db.questHistory.findMany({
    select: { quest: { select: { location: true } } },
  });
  for (const row of issued) {
    issuedByLocation.set(
      row.quest.location,
      (issuedByLocation.get(row.quest.location) ?? 0) + 1,
    );
  }

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>📍 The map</Eyebrow>
          <h1>Locations.</h1>
          <p>Every place a quest points at, and how often people have been sent there.</p>
        </div>
      </Reveal>

      <Reveal delay={stagger(0)} className="mb-5">
        <StatGrid
          items={[
            { label: "Locations", value: grouped.length },
            { label: "Regions", value: regions.length },
            { label: "Countries", value: countries.length },
            {
              label: "Most used",
              value: 0,
              display: grouped[0]?.location ?? "—",
              foot: grouped[0] ? `${grouped[0]._count._all} quests` : undefined,
            },
          ]}
        />
      </Reveal>

      <Reveal delay={stagger(1)}>
        <Panel flush>
          <PanelHead title="Places" aside={<Tag tone="ghost">{grouped.length}</Tag>} />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Region</th>
                  <th>Country</th>
                  <th className="num">Quests</th>
                  <th className="num">Issued</th>
                  <th className="num">Avg km</th>
                  <th className="num">Avg m ↑</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row) => (
                  <tr key={`${row.location}-${row.region}`}>
                    <td>
                      <b>{row.location}</b>
                    </td>
                    <td>{row.region}</td>
                    <td>{row.country}</td>
                    <td className="num">{row._count._all}</td>
                    <td className="num">{issuedByLocation.get(row.location) ?? 0}</td>
                    <td className="num">{(row._avg.distance ?? 0).toFixed(1)}</td>
                    <td className="num">{Math.round(row._avg.elevationGain ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Reveal>
    </>
  );
}
