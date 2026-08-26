import type { Metadata } from "next";
import Link from "next/link";

import { SqMap, type MapPoint } from "@/components/sq/map";
import { EmptyState, PageHeader, StatGrid, StatTile } from "@/components/sq/ui";
import { requireRank } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const metadata: Metadata = { title: "Locations · Admin" };
export const dynamic = "force-dynamic";

/**
 * Where the quests point.
 *
 * Built from the quests themselves rather than from a separate places table:
 * a location exists because a quest points at it, so a second list would only
 * ever be a list that disagreed with this one. The consequence is that
 * "editing a trailhead" means editing the quests standing at it, which is what
 * the row leads to.
 */
export default async function AdminLocationsPage() {
  await requireRank("WRITER");

  const [grouped, issued] = await Promise.all([
    db.quest.groupBy({
      by: ["location", "region", "country"],
      _count: { _all: true },
      _avg: { distance: true, elevationGain: true, latitude: true, longitude: true },
      orderBy: { _count: { location: "desc" } },
      take: 200,
    }),
    db.questHistory.findMany({ select: { quest: { select: { location: true } } } }),
  ]);

  const issuedByLocation = new Map<string, number>();
  for (const row of issued) {
    issuedByLocation.set(row.quest.location, (issuedByLocation.get(row.quest.location) ?? 0) + 1);
  }

  const places = grouped
    .filter((row) => row._avg.latitude != null && row._avg.longitude != null)
    .map((row) => ({
      slug: slugify(row.location),
      location: row.location,
      region: row.region,
      country: row.country,
      quests: row._count._all,
      issued: issuedByLocation.get(row.location) ?? 0,
      lat: row._avg.latitude as number,
      lng: row._avg.longitude as number,
      distance: row._avg.distance ?? 0,
      ascent: row._avg.elevationGain ?? 0,
    }));

  const points: MapPoint[] = places.map((place) => ({
    lat: place.lat,
    lng: place.lng,
    label: `${place.location} · ${place.quests} ${place.quests === 1 ? "quest" : "quests"}`,
    kind: "stop",
    href: `/admin/locations/${place.slug}`,
  }));

  const regions = new Set(places.map((place) => place.region));
  const countries = new Set(places.map((place) => place.country));

  return (
    <>
      <PageHeader
        kicker="The map"
        title="Locations"
        lede="Every place a quest points at, and how often people have been sent there. Built from the quests themselves — a second list would only ever disagree with this one."
      />

      <StatGrid>
        <StatTile label="Trailheads" count={places.length} countId="locs-places" index={0} />
        <StatTile label="Regions" count={regions.size} countId="locs-regions" index={1} />
        <StatTile label="Countries" count={countries.size} countId="locs-countries" index={2} />
        <StatTile
          label="Times sent"
          count={[...issuedByLocation.values()].reduce((sum, value) => sum + value, 0)}
          countId="locs-issued"
          index={3}
        />
      </StatGrid>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Where the quests point
          </h2>
          <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
            {places.length} plotted · click a pin
          </span>
        </div>
        <SqMap points={points} height={440} drawRoute={false} style={{ borderRadius: 0, border: 0 }} />
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Every trailhead
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Most used first
          </span>
        </div>

        {places.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyState
              glyph="marker"
              title="Nothing is plotted yet"
              body="A trailhead appears here as soon as a quest points at it."
              action={
                <Link href="/admin/quests/new" className="sq-btn sq-btn-primary sq-btn-sm">
                  Write a quest
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="sq-stagger">
            {places.map((place, index) => (
              <li key={place.slug} style={{ ["--i" as string]: index }}>
                <Link
                  href={`/admin/locations/${place.slug}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) auto auto auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "13px 22px",
                    borderTop: "1px solid var(--line-2)",
                    color: "var(--color-text)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>
                      {place.location}
                    </b>
                    <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                      {place.region} · {place.country}
                    </span>
                  </span>
                  <span className="sq-mono" style={{ fontSize: 11, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                    {place.distance.toFixed(1)} km avg · {Math.round(place.ascent)} m avg
                  </span>
                  <span className="sq-mono" style={{ fontSize: 11, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                    {place.quests} {place.quests === 1 ? "quest" : "quests"}
                  </span>
                  <span className="sq-mono" style={{ fontSize: 11, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                    sent {place.issued}×
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
