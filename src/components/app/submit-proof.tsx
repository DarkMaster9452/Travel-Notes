"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { submitFeaturedProofAction, submitProofAction } from "@/app/(app)/actions";
import { IconApproved, Modal, Tag, useToast } from "@/components/field";
import { cn } from "@/lib/utils";

/**
 * Filing proof.
 *
 * Logging a quest is no longer a button that marks it done — it opens this,
 * and an admin decides. What they need to decide with is what the form asks
 * for: an account of the day in your own words, at least one photograph, a
 * Strava link if there is one, and the figures your watch recorded.
 *
 * The written account and at least one photo are both required. A note alone
 * reads as an honest account but is not something an admin can actually look
 * at; a photo is the minimum a reviewer has to judge by, on top of the words.
 */
export function SubmitProofButton({
  questId,
  status,
  featuredPeriod,
  label,
  className,
}: {
  /** The quest being logged. Omitted for a featured quest the server resolves. */
  questId?: string;
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  /**
   * Set on the weekly and monthly pages. A generated featured quest has no id
   * until somebody logs it, so the cadence is posted instead and the server
   * works out which quest that means — and stamps the slot itself, rather
   * than believing a period the form claimed.
   */
  featuredPeriod?: "week" | "month";
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [retreated, setRetreated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (status === "PENDING") {
    return <Tag tone="ghost">Proof filed · waiting on review</Tag>;
  }
  if (status === "APPROVED") {
    return (
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.13em] text-moss-2">
        <IconApproved width={16} height={16} />
        Approved
      </span>
    );
  }

  async function send(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await (featuredPeriod
      ? submitFeaturedProofAction(formData)
      : submitProofAction(formData)
    ).catch(() => null);
    setPending(false);

    if (!result?.ok) {
      setError(result?.message ?? "That didn't send. Try again in a moment.");
      return;
    }
    setOpen(false);
    toast({
      title: "Proof filed.",
      detail: "An admin reads it and it lands in your history once approved.",
    });
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={cn("btn btn-signal", className)}
        onClick={() => setOpen(true)}
      >
        {status === "REJECTED" ? "File proof again" : (label ?? "Log it — file proof")}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="What happened?"
        description="A human reads this. Your account of the day and at least one photo are both required."
        className="max-w-[520px]"
      >
        <form action={send} className="mt-5 flex flex-col gap-5">
          {featuredPeriod ? (
            <input type="hidden" name="period" value={featuredPeriod} />
          ) : (
            <input type="hidden" name="questId" value={questId} />
          )}

          <div className="admin-field">
            <label htmlFor="proof-note">Your account of the day</label>
            <textarea
              id="proof-note"
              name="note"
              className="input"
              rows={4}
              minLength={10}
              maxLength={2000}
              required
              placeholder="Cloud broke at 05:58, about ten minutes after we got up. Chains were greasy but fine."
            />
          </div>

          <div className="admin-field">
            <label htmlFor="proof-photos">Photo links · at least 1 required</label>
            <textarea
              id="proof-photos"
              name="photos"
              className="input"
              rows={2}
              required
              placeholder="https://…&#10;One URL per line"
            />
            <p className="note mt-0">
              One per line. Direct uploads arrive with the storage step — until then, a link.
            </p>
          </div>

          <div className="admin-field">
            <label htmlFor="proof-started">The day you went</label>
            <input
              id="proof-started"
              name="startedAt"
              type="date"
              className="input"
              max={new Date().toISOString().slice(0, 10)}
            />
            <p className="note mt-0">
              Optional — but it decides which week or month the quest counts towards on the
              leaderboard. Left blank, today is assumed.
            </p>
          </div>

          <div className="admin-field">
            <label htmlFor="proof-strava">Strava activity</label>
            <input
              id="proof-strava"
              name="stravaUrl"
              type="url"
              className="input"
              placeholder="https://www.strava.com/activities/…"
            />
          </div>

          <div className="admin-grid">
            <div className="admin-field">
              <label htmlFor="proof-distance">Distance (km)</label>
              <input id="proof-distance" name="distance" type="number" step="0.1" min="0" className="input" />
            </div>
            <div className="admin-field">
              <label htmlFor="proof-elevation">Ascent (m)</label>
              <input id="proof-elevation" name="elevation" type="number" min="0" className="input" />
            </div>
            <div className="admin-field">
              <label htmlFor="proof-moving">Moving time (min)</label>
              <input id="proof-moving" name="movingTime" type="number" min="0" className="input" />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-[10px] border border-dashed border-line bg-white/45 px-4 py-3 text-[14px] text-ink-2">
            <input
              type="checkbox"
              name="retreated"
              value="true"
              checked={retreated}
              onChange={(event) => setRetreated(event.target.checked)}
              className="mt-1"
            />
            <span>
              <b className="block text-ink">I turned back.</b>
              An honest retreat counts. Say why in your account above and it is approved as one.
            </span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-signal" disabled={pending}>
            {pending ? "Sending…" : "File proof"}
          </button>
          <p className="note mt-0 text-center">
            Nothing counts until it is checked. Your photos stay private to the quest.
          </p>
        </form>
      </Modal>
    </>
  );
}
