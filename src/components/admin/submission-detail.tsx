"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { reviewSubmissionAction } from "@/app/admin/actions";
import { Avatar, IconStrava, Modal, Tag, useToast } from "@/components/field";
import { formatDate } from "@/lib/utils";

export type SubmissionRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string;
  photos: string[];
  stravaUrl: string | null;
  distance: number | null;
  elevation: number | null;
  movingTime: number | null;
  retreated: boolean;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  author: { name: string; email: string; id: string };
  quest: {
    id: string;
    title: string;
    location: string;
    region: string;
    difficulty: string;
    distance: number;
    elevationGain: number;
    duration: number;
  };
};

const STATUS_TONE = { PENDING: "ghost", APPROVED: "pine", REJECTED: "warm" } as const;
const STATUS_LABEL = { PENDING: "In review", APPROVED: "Approved", REJECTED: "Declined" } as const;

/** How far a claimed figure may sit from the quest's before it is worth a look. */
const FLAG_RATIO = 0.3;

function Diff({ label, claimed, target, unit }: {
  label: string;
  claimed: number | null;
  target: number;
  unit: string;
}) {
  if (claimed == null) {
    return (
      <div className="sub-figure">
        <dt>{label}</dt>
        <dd>
          <span className="muted">not given</span>
          <em>{target}{unit} asked</em>
        </dd>
      </div>
    );
  }
  const off = target > 0 ? Math.abs(claimed - target) / target : 0;
  return (
    <div className={off > FLAG_RATIO ? "sub-figure flagged" : "sub-figure"}>
      <dt>{label}</dt>
      <dd>
        {claimed}{unit}
        <em>
          {target}{unit} asked
          {off > FLAG_RATIO && ` · ${Math.round(off * 100)}% out`}
        </em>
      </dd>
    </div>
  );
}

/**
 * One submission, in full, with the verdict attached.
 *
 * The table it opens from can say a submission exists; it cannot show what
 * somebody actually wrote, the photographs they attached, or how their
 * figures compare to what the quest asked for — and those are the only things
 * a verdict should be based on. So deciding lives here, behind the evidence,
 * rather than as a button on a row.
 *
 * A decided submission can be decided again. Reviewers are people, the deck
 * moves fast, and an approval pressed by mistake otherwise stands forever as
 * a quest in somebody's history they never did. Reversing asks for a
 * confirmation, because it changes a record rather than making one.
 */
export function SubmissionDetail({
  submission,
  onClose,
}: {
  submission: SubmissionRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState<"approve" | "decline" | null>(null);

  // Reset the form whenever a different submission is opened, so a note
  // typed for one person can't be filed against the next.
  const [lastId, setLastId] = React.useState(submission?.id ?? null);
  if ((submission?.id ?? null) !== lastId) {
    setLastId(submission?.id ?? null);
    setNote("");
    setConfirming(null);
  }

  if (!submission) return null;

  const decided = submission.status !== "PENDING";

  async function decide(approve: boolean) {
    if (!submission) return;
    setPending(true);
    const result = await reviewSubmissionAction({
      submissionId: submission.id,
      approve,
      note: note.trim() || undefined,
    }).catch(() => null);
    setPending(false);
    setConfirming(null);

    if (!result?.ok) {
      toast({
        title: "Not saved.",
        detail: result?.message ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }
    toast({ title: approve ? "Approved." : "Declined.", detail: result.message });
    onClose();
    router.refresh();
  }

  function press(approve: boolean) {
    // A first verdict is the reviewer's job and needs no ceremony. Changing
    // one already recorded rewrites somebody's history, so it asks.
    if (decided) setConfirming(approve ? "approve" : "decline");
    else void decide(approve);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={submission.quest.title}
      description={`${submission.quest.location} · ${submission.quest.region}`}
      className="sub-sheet"
    >
      <div className="sub-body">
        <div className="sub-person">
          <Avatar name={submission.author.name} className="size-9 rounded-[11px] text-[12px]" />
          <div>
            <b>{submission.author.name}</b>
            <span>{submission.author.email}</span>
          </div>
          <Tag tone={STATUS_TONE[submission.status]}>{STATUS_LABEL[submission.status]}</Tag>
        </div>

        <p className="sub-note">{submission.note}</p>

        {submission.photos.length > 0 && (
          <div className="sub-photos">
            {submission.photos.map((photo) => (
              <a key={photo} href={photo} target="_blank" rel="noreferrer noopener">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote host, admin-only */}
                <img src={photo} alt="" loading="lazy" />
              </a>
            ))}
          </div>
        )}

        <dl className="sub-figures">
          <Diff label="Distance" claimed={submission.distance} target={submission.quest.distance} unit=" km" />
          <Diff label="Ascent" claimed={submission.elevation} target={submission.quest.elevationGain} unit=" m" />
          <Diff label="Moving" claimed={submission.movingTime} target={submission.quest.duration} unit=" min" />
        </dl>

        <div className="sub-extras">
          {submission.stravaUrl && (
            <a href={submission.stravaUrl} target="_blank" rel="noreferrer noopener">
              <IconStrava />
              Strava activity
            </a>
          )}
          {submission.retreated && <span className="sub-retreat">Turned back on purpose</span>}
          <span className="meta">Filed {formatDate(submission.createdAt)}</span>
        </div>

        {decided && (
          <div className="sub-verdict">
            <p>
              <b>{STATUS_LABEL[submission.status]}</b>
              {submission.reviewedBy && ` by ${submission.reviewedBy}`}
              {submission.reviewedAt && ` on ${formatDate(submission.reviewedAt)}`}.
            </p>
            {submission.reviewNote && <blockquote>{submission.reviewNote}</blockquote>}
          </div>
        )}

        <div className="sub-decide">
          <label className="meta" htmlFor="review-note">
            Note to them {decided ? "(replaces the old one)" : "(shown on a decline)"}
          </label>
          <textarea
            id="review-note"
            className="input"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What was missing, or why this is fine."
          />

          {confirming ? (
            <div className="sub-confirm">
              <p>
                This is already <b>{STATUS_LABEL[submission.status].toLowerCase()}</b>. Change it to{" "}
                <b>{confirming === "approve" ? "approved" : "declined"}</b>?
                {confirming === "approve"
                  ? " The quest will count in their history."
                  : " The quest will be taken back out of their history."}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={pending}
                  onClick={() => decide(confirming === "approve")}
                >
                  {pending ? "Saving…" : "Yes, change it"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirming(null)}
                  disabled={pending}
                >
                  Leave it
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={pending || submission.status === "APPROVED"}
                onClick={() => press(true)}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={pending || submission.status === "REJECTED"}
                onClick={() => press(false)}
              >
                Decline
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
