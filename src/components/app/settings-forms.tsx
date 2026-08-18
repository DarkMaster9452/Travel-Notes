"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  clearMyDataAction,
  deleteAccountAction,
  updatePreferencesAction,
  updateProfileAction,
  type ProfileState,
} from "@/app/(app)/profile/actions";
import { Modal, useToast } from "@/components/field";
import { DELETE_PHRASE } from "@/lib/config";

/**
 * Settings.
 *
 * Small forms rather than one long one, because they are answerable at
 * different times: your name is a fact, your country is a circumstance. Each
 * saves on its own and says so.
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

export function CountryForm({
  country,
  countries,
  worldwide,
}: {
  /** The stored country name, or "" when nothing is set yet. */
  country: string;
  countries: { code: string; name: string; europe: boolean }[];
  /** Whether this plan reaches past Europe. */
  worldwide: boolean;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(
    updatePreferencesAction,
    undefined,
  );
  useSavedToast(state, "Country saved.");

  const europe = countries.filter((c) => c.europe);
  const rest = countries.filter((c) => !c.europe);

  return (
    <form action={action} className="flex flex-col gap-4 px-5 py-5">
      <div className="field">
        <div className="field-label">
          <b>Where do you set out from?</b>
          <span>Country</span>
        </div>
        <select
          className="input"
          name="country"
          defaultValue={country}
          aria-label="Country"
          required
        >
          <option value="" disabled>
            Pick a country…
          </option>
          <optgroup label="Europe">
            {europe.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </optgroup>
          {worldwide && rest.length > 0 && (
            <optgroup label="Rest of the world">
              {rest.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {state?.errors?.country && <p className="form-error">{state.errors.country}</p>}
        <p className="note">
          A country, not a town or an address — it only sets where quests are measured from.
          {!worldwide && " Outside Europe is Ultra."}
        </p>
      </div>

      <div>
        <SaveButton>Save country</SaveButton>
      </div>
    </form>
  );
}

/**
 * The two irreversible things, both behind the same typed phrase.
 *
 * A dialog you dismiss with one press is a dialog people press through. The
 * phrase has to be typed exactly, and the server checks it too — a
 * confirmation that lives only in the client is one an accidental POST walks
 * straight past.
 */
function DangerDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  action,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  action: (formData: FormData) => Promise<ProfileState>;
}) {
  const [typed, setTyped] = React.useState("");
  const [state, formAction] = useActionState<ProfileState, FormData>(
    async (_prev, formData) => action(formData),
    undefined,
  );

  // Clear the box whenever the dialog reopens, so a previous attempt can't
  // leave it pre-armed.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form action={formAction} className="modal-form">
        <label className="meta" htmlFor="danger-confirm">
          Type {DELETE_PHRASE} to confirm
        </label>
        <input
          id="danger-confirm"
          name="confirm"
          className="input"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder={DELETE_PHRASE}
        />
        {state?.errors?.confirm && <p className="form-error">{state.errors.confirm}</p>}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-danger" disabled={typed.trim() !== DELETE_PHRASE}>
            {confirmLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DangerZone() {
  const [deleting, setDeleting] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14.5px] text-ink-2">
            Erase your quest history, submissions and stickers. The account stays.
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setClearing(true)}>
            Clear my data
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-4">
          <p className="text-[14.5px] text-ink-2">
            Delete the account and everything in it.
          </p>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(true)}>
            Delete account
          </button>
        </div>
      </div>

      <DangerDialog
        open={clearing}
        onClose={() => setClearing(false)}
        title="Erase everything you've done?"
        description="History, submissions, saved quests and every sticker earned from them. Your login stays and your free allowance resets."
        confirmLabel="Erase my data"
        action={clearMyDataAction}
      />

      <DangerDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete your account?"
        description="Your quest history, your stickers and your preferences go with it. This cannot be undone."
        confirmLabel="Delete my account"
        action={deleteAccountAction}
      />
    </>
  );
}
