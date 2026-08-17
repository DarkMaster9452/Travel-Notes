"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { submitProofAction } from "@/app/(app)/actions";
import { IconApproved, Modal, Tag, useToast } from "@/components/field";

/**
 * Filing proof.
 *
 * Logging a quest is no longer a button that marks it done — it opens this,
 * and an admin decides. What they need to decide with is what the form asks
 * for: an account of the day in your own words, whatever photographs you took,
 * a Strava link if there is one, and the figures your watch recorded.
 *
 * The written account is the only required field. Photographs and figures are
 * better evidence, but somebody who went up a hill without a phone still went
 * up the hill, and a form that refuses them would be telling them otherwise.
 */
export function SubmitProofButton({
  questId,
  status,
}: {
  questId: string;
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
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
    const result = await submitProofAction(formData).catch(() => null);
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
      <button type="button" className="btn btn-signal" onClick={() => setOpen(true)}>
        {status === "REJECTED" ? "File proof again" : "Log it — file proof"}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="What happened?"
        description="A human reads this. Photos and figures help, but your account of the day is the part that matters."
        className="max-w-[520px]"
      >
        <form action={send} className="mt-5 flex flex-col gap-5">
          <input type="hidden" name="questId" value={questId} />

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
            <label htmlFor="proof-photos">Photo links</label>
            <textarea
              id="proof-photos"
              name="photos"
              className="input"
              rows={2}
              placeholder="One URL per line"
            />
            <p className="note mt-0">
              One per line. Direct uploads arrive with the storage step — until then, a link.
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
