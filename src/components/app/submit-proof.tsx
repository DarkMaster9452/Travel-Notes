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
 * for: an account of the day in your own words, at least one photograph, a
 * Strava link if there is one, and the figures your watch recorded.
 *
 * The written account and at least one photo are both required. A note alone
 * reads as an honest account but is not something an admin can actually look
 * at; a photo is the minimum a reviewer has to judge by, on top of the words.
 *
 * Half the form is the same every time — who you go with, what you carry,
 * where your Strava lives — so that half is filled in from the account and
 * saved back to it when the box is ticked. The figures are not: they are
 * measurements of one particular day, and a form that arrived with last
 * week's distance already in the box would be inviting somebody to file it.
 * What the account remembers about those is shown *beside* the field, as
 * something to check yourself against.
 */
export type LogDefaults = {
  stravaProfile: string | null;
  usualStart: string | null;
  partySize: number | null;
  gear: string | null;
  pace: number | null;
  lastDistance: number | null;
  lastElevation: number | null;
  lastMovingTime: number | null;
};

export function SubmitProofButton({
  questId,
  status,
  defaults,
  label,
  className,
}: {
  questId: string;
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  /** What this account has saved. Absent for an account that has saved none. */
  defaults?: LogDefaults | null;
  /** Overrides the button text where the surrounding page has said it already. */
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [retreated, setRetreated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Somebody who has saved once meant it; the box stays ticked so an edit to
  // the details below is not silently discarded on the next log.
  const hasSaved = Boolean(
    defaults &&
      (defaults.stravaProfile || defaults.usualStart || defaults.partySize || defaults.gear || defaults.pace),
  );
  const [saveDetails, setSaveDetails] = React.useState(hasSaved);

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
      <button
        type="button"
        className={className ?? "btn btn-signal"}
        onClick={() => setOpen(true)}
      >
        {label ?? (status === "REJECTED" ? "File proof again" : "Log it — file proof")}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="What happened?"
        description="A human reads this. Your account of the day and at least one photo are both required."
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
              {defaults?.lastDistance != null && (
                <p className="note mt-0">Last time: {defaults.lastDistance.toFixed(1)} km</p>
              )}
            </div>
            <div className="admin-field">
              <label htmlFor="proof-elevation">Ascent (m)</label>
              <input id="proof-elevation" name="elevation" type="number" min="0" className="input" />
              {defaults?.lastElevation != null && (
                <p className="note mt-0">Last time: {defaults.lastElevation} m</p>
              )}
            </div>
            <div className="admin-field">
              <label htmlFor="proof-moving">Moving time (min)</label>
              <input id="proof-moving" name="movingTime" type="number" min="0" className="input" />
              {defaults?.lastMovingTime != null && (
                <p className="note mt-0">Last time: {defaults.lastMovingTime} min</p>
              )}
            </div>
          </div>

          {/* The half that is the same every time. Open by default when the
              account has nothing saved yet, folded away once it has — after
              the first log this is a section you scroll past, not one you
              fill in. */}
          <details className="log-details" open={!hasSaved}>
            <summary>
              About you
              <span>{hasSaved ? "Saved to your account" : "Saved once, reused every time"}</span>
            </summary>

            <div className="log-details-body">
              <div className="admin-grid">
                <div className="admin-field">
                  <label htmlFor="proof-start">Usual start</label>
                  <input
                    id="proof-start"
                    name="usualStart"
                    type="time"
                    className="input"
                    defaultValue={defaults?.usualStart ?? ""}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="proof-party">People, including you</label>
                  <input
                    id="proof-party"
                    name="partySize"
                    type="number"
                    min="1"
                    max="40"
                    className="input"
                    defaultValue={defaults?.partySize ?? ""}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="proof-pace">Pace (min/km)</label>
                  <input
                    id="proof-pace"
                    name="pace"
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    defaultValue={defaults?.pace ?? ""}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label htmlFor="proof-gear">What you carry</label>
                <input
                  id="proof-gear"
                  name="gear"
                  type="text"
                  maxLength={300}
                  className="input"
                  placeholder="Trail shoes, poles, two litres."
                  defaultValue={defaults?.gear ?? ""}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="proof-profile">Your Strava profile</label>
                <input
                  id="proof-profile"
                  name="stravaProfile"
                  type="url"
                  className="input"
                  placeholder="https://www.strava.com/athletes/…"
                  defaultValue={defaults?.stravaProfile ?? ""}
                />
              </div>
            </div>
          </details>

          <label className="proof-check">
            <input
              type="checkbox"
              name="saveDetails"
              value="true"
              checked={saveDetails}
              onChange={(event) => setSaveDetails(event.target.checked)}
              className="mt-1"
            />
            <span>
              <b className="block text-ink">Save these details to my account.</b>
              The part about you is filled in next time, and your figures are remembered so the
              next form can show you what you did last.
            </span>
          </label>

          <label className="proof-check">
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
