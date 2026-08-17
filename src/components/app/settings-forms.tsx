"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  deleteAccountAction,
  updatePreferencesAction,
  updateProfileAction,
  type ProfileState,
} from "@/app/(app)/profile/actions";
import { Modal, Pill, useToast } from "@/components/field";

/**
 * Settings.
 *
 * Two small forms rather than one long one, because they are answerable at
 * different times: your name is a fact, your preferences are a mood. Both save
 * on their own and say so.
 */

function SaveButton({ children = "Save" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

/** Raise a toast the first time a save reports success. */
function useSavedToast(state: ProfileState, message: string) {
  const toast = useToast();
  const seen = React.useRef(false);

  React.useEffect(() => {
    if (!state?.saved) {
      seen.current = false;
      return;
    }
    if (seen.current) return;
    seen.current = true;
    toast({ title: message });
  }, [state, toast, message]);
}

export function NameForm({ name }: { name: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfileAction, undefined);
  useSavedToast(state, "Name saved.");

  return (
    <form action={action} className="flex flex-col gap-3 px-5 py-5">
      <label className="meta" htmlFor="settings-name">
        What we call you
      </label>
      <input
        id="settings-name"
        className="input"
        name="name"
        defaultValue={name}
        maxLength={80}
        required
      />
      {state?.errors?.name && <p className="form-error">{state.errors.name}</p>}
      <p className="note mt-0">
        First names only. Other people never see a surname, an address, or where you live.
      </p>
      <div>
        <SaveButton />
      </div>
    </form>
  );
}

const DIFFICULTIES = [
  { value: "EASY", label: "Easy" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HARD", label: "Hard" },
  { value: "SURPRISE", label: "Surprise me" },
] as const;

const TIMES = [
  { value: "SHORT", label: "A couple of hours" },
  { value: "HALF", label: "Half a day" },
  { value: "LONG", label: "A long day" },
  { value: "FULL", label: "The whole thing" },
  { value: "SURPRISE", label: "Whatever fits" },
] as const;

export function PreferencesForm({
  homeLocation,
  difficulty,
  maxDistance,
  timeAvailable,
}: {
  homeLocation: string;
  difficulty: string;
  maxDistance: number;
  timeAvailable: string;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(
    updatePreferencesAction,
    undefined,
  );
  useSavedToast(state, "Preferences saved.");

  const [chosenDifficulty, setDifficulty] = React.useState(difficulty);
  const [chosenTime, setTime] = React.useState(timeAvailable);
  const [radius, setRadius] = React.useState(maxDistance);

  return (
    <form action={action} className="flex flex-col gap-6 px-5 py-5">
      <input type="hidden" name="difficulty" value={chosenDifficulty} />
      <input type="hidden" name="timeAvailable" value={chosenTime} />

      <div className="field">
        <div className="field-label">
          <b>Where do you set out from?</b>
          <span>Home</span>
        </div>
        <input
          className="input"
          name="homeLocation"
          defaultValue={homeLocation}
          maxLength={80}
          required
        />
        {state?.errors?.homeLocation && <p className="form-error">{state.errors.homeLocation}</p>}
        <p className="note">A town, not an address. It only sets where quests are measured from.</p>
      </div>

      <div className="field">
        <div className="field-label">
          <b>How hard should it be?</b>
          <span>Difficulty</span>
        </div>
        <div className="pills">
          {DIFFICULTIES.map((option) => (
            <Pill
              key={option.value}
              pressed={chosenDifficulty === option.value}
              onClick={() => setDifficulty(option.value)}
            >
              {option.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">
          <b>How long have you got?</b>
          <span>Time</span>
        </div>
        <div className="pills">
          {TIMES.map((option) => (
            <Pill
              key={option.value}
              pressed={chosenTime === option.value}
              onClick={() => setTime(option.value)}
            >
              {option.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">
          <b>How far will you travel?</b>
          <span>{radius} km</span>
        </div>
        <input
          type="range"
          name="maxDistance"
          min={10}
          max={300}
          step={5}
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
          className="w-full accent-pine"
        />
      </div>

      <div>
        <SaveButton>Save preferences</SaveButton>
      </div>
    </form>
  );
}

/**
 * Deleting an account is irreversible, so it asks once — plainly, without
 * trying to talk you out of it.
 */
export function DeleteAccount() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
        <p className="text-[14.5px] text-ink-2">
          Delete the account and everything in it — history, stickers, preferences.
        </p>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => setOpen(true)}>
          Delete account
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete your account?"
        description="Your quest history, your stickers and your preferences go with it. This cannot be undone."
      >
        <form action={deleteAccountAction} className="modal-form">
          <button type="submit" className="btn btn-danger">
            Yes, delete it
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
            Keep my account
          </button>
        </form>
      </Modal>
    </>
  );
}
