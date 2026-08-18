import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { PlanChip } from "@/components/app/plan-mark";
import {
  EmptyState,
  Eyebrow,
  IconArrowRight,
  IconClock,
  IconStrava,
  Panel,
  PanelHead,
  Tag,
} from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { stagger } from "@/lib/motion";
import { formatDate, formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Submissions" };
export const dynamic = "force-dynamic";

/**
 * What you filed, and what came back.
 *
 * Filing proof used to be the end of the road on this side of the product:
 * the form closed and the only way to learn the verdict was to notice a
 * quest had quietly moved into history. This is the other half — every
 * submission, its state, and, when it was declined, the reason in the
 * reviewer's own words so re-filing is something you can act on rather than
 * guess at.
 */

const STATUS: Record<
  "PENDING" | "APPROVED" | "REJECTED",
  { label: string; tone: "pine" | "warm" | "ghost"; line: string }
> = {
  PENDING: {
    label: "In review",
    tone: "ghost",
    line: "Filed and waiting. Somebody reads every one of these by hand.",
  },
  APPROVED: {
    label: "Approved",
    tone: "pine",
    line: "Checked and counted. It's in your history.",
  },
  REJECTED: {
    label: "Declined",
    tone: "warm",
    line: "Not accepted as filed. You can file again on the quest page.",
  },
};

export default async function SubmissionsPage() {
  const user = await requireClient();

  const entitlement = await getEntitlement(user.id);

  const submissions = await db.submission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      note: true,
      photos: true,
      stravaUrl: true,
      distance: true,
      elevation: true,
      movingTime: true,
      retreated: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      quest: { select: { id: true, title: true, location: true, region: true } },
    },
  });

  const counts = {
    pending: submissions.filter((s) => s.status === "PENDING").length,
    approved: submissions.filter((s) => s.status === "APPROVED").length,
    rejected: submissions.filter((s) => s.status === "REJECTED").length,
  };

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Filed</Eyebrow>
          <h1>Your submissions.</h1>
          <p>
            {submissions.length === 0
              ? "Nothing filed yet. Proof goes in from the quest page."
              : `${submissions.length} filed · ${counts.approved} approved · ${counts.pending} waiting`}
          </p>
        </div>
        <PlanChip plan={entitlement.plan} />
      </Reveal>

      {submissions.length === 0 ? (
        <Reveal>
          <EmptyState icon={<IconClock />} title="Nothing filed yet.">
            When you finish a quest you file what happened — a written account, at least one
            photo, and your figures if a watch recorded them. It shows up here until somebody
            has read it.
          </EmptyState>
        </Reveal>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((submission, index) => {
            const status = STATUS[submission.status];
            return (
              <Reveal key={submission.id} delay={stagger(index, 8)}>
                <Panel flush>
                  <PanelHead
                    title={submission.quest.title}
                    aside={<Tag tone={status.tone}>{status.label}</Tag>}
                  />

                  <div className="submission-card">
                    <p className="submission-where">
                      {submission.quest.location} · {submission.quest.region}
                    </p>

                    <p className="submission-note">{submission.note}</p>

                    <div className="submission-facts">
                      {submission.distance != null && <span>{submission.distance.toFixed(1)} km</span>}
                      {submission.elevation != null && <span>{submission.elevation} m ↑</span>}
                      {submission.movingTime != null && <span>{submission.movingTime} min</span>}
                      {submission.photos.length > 0 && (
                        <span>
                          {submission.photos.length} photo
                          {submission.photos.length === 1 ? "" : "s"}
                        </span>
                      )}
                      {submission.stravaUrl && (
                        <a href={submission.stravaUrl} target="_blank" rel="noreferrer noopener">
                          <IconStrava />
                          Strava
                        </a>
                      )}
                      {submission.retreated && <span className="text-signal">Turned back</span>}
                    </div>

                    {/* The verdict, in the reviewer's words. A decline without
                        its reason is just a closed door. */}
                    <div className="submission-verdict">
                      <p>
                        <b>{status.line}</b>
                        {submission.reviewedAt && (
                          <span> Reviewed {formatDate(submission.reviewedAt)}.</span>
                        )}
                      </p>
                      {submission.status === "REJECTED" && submission.reviewNote && (
                        <blockquote>{submission.reviewNote}</blockquote>
                      )}
                    </div>

                    <div className="submission-foot">
                      <span className="meta">Filed {formatRelativeDate(submission.createdAt)}</span>
                      <Link href={`/quests/${submission.quest.id}`} className="btn btn-ghost btn-sm">
                        {submission.status === "REJECTED" ? "File again" : "Open the quest"}
                        <IconArrowRight />
                      </Link>
                    </div>
                  </div>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      )}
    </>
  );
}
