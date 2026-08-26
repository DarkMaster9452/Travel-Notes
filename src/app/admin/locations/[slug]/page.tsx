import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SqTrailheadEditor } from "@/components/sq/trailhead-editor";
import { PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { requireRank } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} · Locations · Admin` };
}

/**
 * One trailhead.
 *
 * There is no places table, so "editing a trailhead" is editing the quests
 * standing at it — renaming it renames it on all of them, and moving the pin
 * moves the ones that share its coordinates. That is stated on the page,
 * because a rename that silently touched forty rows would be a surprise.
 */
export default async function TrailheadPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRank("WRITER");
  const { slug } = await params;

  // The slug is derived, not stored, so the match happens in memory over the
  // distinct locations rather than as a query we cannot index.
  const locations = await db.quest.findMany({
    distinct: ["location"],
    select: { location: true },
    take: 500,
  });
  const location = locations.find((row) => slugify(row.location) === slug)?.location;
  if (!location) notFound();

  const quests = await db.quest.findMany({
    where: { location },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      title: true,
      region: true,
      country: true,
      difficulty: true,
      distance: true,
      elevationGain: true,
      latitude: true,
      longitude: true,
      published: true,
      parkingName: true,
      parkingLat: true,
      parkingLng: true,
      _count: { select: { history: true } },
    },
  });

  const issued = quests.reduce((sum, quest) => sum + quest._count.history, 0);
  const first = quests[0];

  return (
    <>
      <PageHeader
        kicker="Trailhead"
        title={location}
        lede={`${first.region} · ${first.country}. Every quest that starts here, and the pin they share.`}
        right={
          <Link href="/admin/locations" className="sq-btn sq-btn-ghost">
            Back to the map
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Quests here" count={quests.length} index={0} />
        <StatTile label="Times sent" count={issued} index={1} />
        <StatTile label="Published" count={quests.filter((quest) => quest.published).length} index={2} />
      </StatGrid>

      <div style={{ marginTop: 16 }}>
        <SqTrailheadEditor
          location={location}
          quests={quests.map((quest) => ({
            id: quest.id,
            title: quest.title,
            latitude: quest.latitude,
            longitude: quest.longitude,
            parkingName: quest.parkingName,
            parkingLat: quest.parkingLat,
            parkingLng: quest.parkingLng,
          }))}
        />
      </div>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Quests from here
          </h2>
        </div>
        <ul className="sq-stagger">
          {quests.map((quest, index) => (
            <li key={quest.id} style={{ ["--i" as string]: index }}>
              <Link
                href={`/admin/quests/${quest.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr) auto auto auto",
                  gap: 16,
                  alignItems: "center",
                  padding: "13px 22px",
                  borderTop: "1px solid var(--line-2)",
                  color: "var(--color-text)",
                }}
              >
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {quest.number ? `№ ${String(quest.number).padStart(4, "0")}` : "—"}
                </span>
                <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16, minWidth: 0 }}>
                  {quest.title}
                </b>
                <span className="sq-mono" style={{ fontSize: 11, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                  {quest.distance.toFixed(1)} km · {quest.elevationGain} m
                </span>
                <Tag tone={quest.difficulty === "HARD" || quest.difficulty === "EXPERT" ? "stamp" : "green"} small>
                  {quest.difficulty}
                </Tag>
                {quest.published ? <span /> : <Tag tone="stamp" small>DRAFT</Tag>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
