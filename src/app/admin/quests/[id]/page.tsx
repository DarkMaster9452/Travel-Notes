import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SqQuestEditor } from "@/components/sq/quest-editor";
import { SqQuestDangerZone } from "@/components/sq/quest-danger";
import { PageHeader, Tag } from "@/components/sq/ui";
import { requireRank } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quest = await db.quest.findUnique({ where: { id }, select: { title: true } });
  return { title: `${quest?.title ?? "Quest"} · Admin` };
}

/**
 * Edit one quest.
 *
 * The same editor the new-quest page uses, on the same schema, so the two
 * cannot drift into accepting different things. Deleting is refused once
 * anybody holds it — the action says why, and unpublishing is the answer.
 */
export default async function EditQuestPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRank("WRITER");
  const { id } = await params;

  const quest = await db.quest.findUnique({
    where: { id },
    include: { _count: { select: { history: true, submissions: true, schedules: true } } },
  });
  if (!quest) notFound();

  return (
    <>
      <PageHeader
        kicker={quest.number ? `Quest № ${String(quest.number).padStart(4, "0")}` : "Quest"}
        title={quest.title}
        lede={`${quest.location} · ${quest.region} · issued to ${quest._count.history}, filed against ${quest._count.submissions} times`}
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Tag tone={quest.published ? "green" : "stamp"} small>
              {quest.published ? "PUBLISHED" : "DRAFT"}
            </Tag>
            {quest._count.schedules > 0 ? <Tag small>BOOKED {quest._count.schedules}×</Tag> : null}
          </div>
        }
      />

      <SqQuestEditor
        draft={{
          id: quest.id,
          title: quest.title,
          subtitle: quest.subtitle,
          objective: quest.objective,
          description: quest.description,
          bonus: quest.bonus ?? "",
          safetyNotes: quest.safetyNotes ?? "",
          category: quest.category ?? "",
          location: quest.location,
          region: quest.region,
          country: quest.country,
          latitude: String(quest.latitude),
          longitude: String(quest.longitude),
          distance: String(quest.distance),
          elevationGain: String(quest.elevationGain),
          duration: String(quest.duration),
          difficulty: quest.difficulty,
          published: quest.published,
          coverImage: quest.coverImage,
          parkingName: quest.parkingName ?? "",
          parkingLat: quest.parkingLat != null ? String(quest.parkingLat) : "",
          parkingLng: quest.parkingLng != null ? String(quest.parkingLng) : "",
          parkingNote: quest.parkingNote ?? "",
          approachTime: quest.approachTime != null ? String(quest.approachTime) : "",
          transitNote: quest.transitNote ?? "",
        }}
      />

      <div style={{ marginTop: 16 }}>
        <SqQuestDangerZone questId={quest.id} issued={quest._count.history} published={quest.published} />
      </div>
    </>
  );
}
