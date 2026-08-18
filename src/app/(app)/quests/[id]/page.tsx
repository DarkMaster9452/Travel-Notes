import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmitProofButton } from "@/components/app/submit-proof";
import { Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { QuestSheet } from "@/components/app/quest-sheet";
import { Eyebrow, IconShield, Panel, PanelHead, QuestArt, Tag } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getQuestForUser } from "@/lib/quest/service";
import { formatDate, titleCase } from "@/lib/utils";
import { toQuestSummary } from "@/types/quest";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const user = await requireClient();
  const { id } = await params;
  const record = await getQuestForUser(id, user.id);
  return { title: record?.quest.title ?? "Quest" };
}

/**
 * One quest, in full.
 *
 * Ownership is decided in `getQuestForUser`: a quest that is not this
 * account's and is not showcase content comes back as null and renders as
 * not-found, so another account's id reveals nothing.
 */
export default async function QuestPage({ params }: Params) {
  const user = await requireClient();
  const { id } = await params;

  const record = await getQuestForUser(id, user.id);
  if (!record) notFound();

  // What the reader sees on the button depends on where their proof sits.
  const submission = await db.submission.findUnique({
    where: { userId_questId: { userId: user.id, questId: id } },
    select: { status: true, reviewNote: true },
  });
  const proofStatus = submission?.status ?? "NONE";

  const quest = toQuestSummary(record.quest, {
    generatedAt: record.generatedAt,
    completed: record.isCompleted,
  });

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>{record.isCompleted ? "Logged" : "Issued to you"}</Eyebrow>
          <h1>{quest.title}</h1>
          <p>{quest.subtitle}</p>
        </div>
        {record.owned && <SubmitProofButton questId={quest.id} status={proofStatus} />}
      </Reveal>

      {/* The one photograph an admin attached to this quest. Optional by
          design — a quest without one is still a quest, and a broken image
          box would be worse than no image at all.

          Where there is no photograph the quest's own mark takes the space.
          Not as a substitute: it is generated from the id and says nothing
          about the place, which is exactly why it is safe to show where a
          picture of somewhere real would be a claim we cannot make. */}
      <Reveal className="mb-5">
        {record.quest.coverImage ? (
          // An arbitrary remote host an admin pasted, not a build-time known
          // domain, so `next/image` has nothing to optimise it against.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.quest.coverImage}
            alt=""
            className="quest-cover"
            loading="lazy"
          />
        ) : (
          <QuestArt
            seed={quest.id}
            tags={[...quest.terrain, ...quest.features]}
            variant="band"
          />
        )}
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Reveal delay={stagger(0)}>
          <QuestSheet
            quest={quest}
            issuedAt={`Issued ${formatDate(record.generatedAt)}`}
            seal={record.isCompleted ? "LOGGED" : "ISSUED"}
          />
        </Reveal>

        <div className="flex flex-col gap-5">
          <Reveal delay={stagger(1)}>
            <Panel flush>
              <PanelHead title="The day" />
              <div className="px-5 py-5">
                <p className="text-[15.5px] leading-[1.6] text-ink-2">{record.quest.description}</p>
                {record.quest.bonus && (
                  <div className="qc-bonus mt-4">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
                      <path
                        d="M8.5 1.5l2 4.4 4.8.6-3.5 3.3.9 4.7-4.2-2.3-4.2 2.3.9-4.7L1.7 6.5l4.8-.6 2-4.4z"
                        stroke="#C4481B"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p>
                      <b>Bonus challenge</b>
                      {record.quest.bonus}
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          </Reveal>

          {quest.terrain.length > 0 && (
            <Reveal delay={stagger(2)}>
              <Panel flush>
                <PanelHead title="Ground" />
                <div className="flex flex-wrap gap-2 px-5 py-5">
                  {[...quest.terrain, ...quest.features].map((tag) => (
                    <Tag key={tag} tone="ghost">
                      {titleCase(tag)}
                    </Tag>
                  ))}
                </div>
              </Panel>
            </Reveal>
          )}

          <Reveal delay={stagger(3)}>
            <div className="safety mt-0">
              <IconShield />
              <p>
                {record.quest.safetyNotes ??
                  "Routes are publicly documented and marked, but a map, a weather check and your own judgement are still yours to bring."}
              </p>
            </div>
          </Reveal>

          {proofStatus === "REJECTED" && (
            <Reveal delay={stagger(3)}>
              <div className="safety mt-0" style={{ borderColor: "rgba(196,72,27,.4)" }}>
                <IconShield />
                <p>
                  <b>Proof declined.</b>{" "}
                  {submission?.reviewNote ??
                    "Usually a missing photo rather than a suspicion — file it again with more to go on."}{" "}
                  <Link href="/submissions" className="underline">
                    All your submissions
                  </Link>
                </p>
              </div>
            </Reveal>
          )}

          {record.isCompleted && record.completedAt && (
            <Reveal delay={stagger(4)}>
              <p className="note text-center">
                Logged {formatDate(record.completedAt)} · retired from your pool ·{" "}
                <Link href="/history" className="underline">
                  your history
                </Link>
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </>
  );
}
