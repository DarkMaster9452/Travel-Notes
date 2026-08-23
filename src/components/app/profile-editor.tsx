"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  savePublicProfileAction,
  type PublicProfileState,
} from "@/app/(app)/profile/public-actions";
import { Panel, PanelHead, useToast } from "@/components/field";

/**
 * The editor for your own page.
 *
 * Published is the first control on it rather than the last, because it is the
 * only one that matters to anybody but you: everything below is decoration
 * until this is on, and turning it off takes the page away immediately.
 *
 * Every section switch really controls the query, not just the rendering — a
 * profile with figures switched off does not fetch them. That is worth knowing
 * while editing, so the copy says it.
 */
export type ProfileDraft = {
  handle: string;
  published: boolean;
  displayName: string;
  headline: string;
  bio: string;
  instagram: string;
  facebook: string;
  strava: string;
  accent: string;
  showStats: boolean;
  showCountry: boolean;
  showActivities: boolean;
  showStickers: boolean;
};

const ACCENTS = [
  { value: "PINE", label: "Pine" },
  { value: "MOSS", label: "Moss" },
  { value: "STONE", label: "Stone" },
  { value: "WATER", label: "Water" },
  { value: "CLAY", label: "Clay" },
  { value: "DUSK", label: "Dusk" },
  { value: "SIGNAL", label: "Signal" },
];

const SECTIONS = [
  { name: "showStats", label: "Your figures", detail: "Quests logged, kilometres, metres climbed, regions." },
  { name: "showActivities", label: "Your logs", detail: "Approved logs, with whatever photographs you filed." },
  { name: "showStickers", label: "Your stickers", detail: "Only the ones you have actually earned." },
  { name: "showCountry", label: "Your country", detail: "The country you set out from. Never anything finer." },
] as const;

function Save({ published }: { published: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-signal" disabled={pending}>
      {pending ? "Saving…" : published ? "Save and publish" : "Save"}
    </button>
  );
}

export function ProfileEditor({ draft }: { draft: ProfileDraft }) {
  const router = useRouter();
  const toast = useToast();
  const [state, action] = useActionState<PublicProfileState, FormData>(
    savePublicProfileAction,
    undefined,
  );

  const [published, setPublished] = React.useState(draft.published);
  const [handle, setHandle] = React.useState(draft.handle);
  const [bio, setBio] = React.useState(draft.bio);

  // Announce a save once per result, not once per render.
  const announced = React.useRef<PublicProfileState>(undefined);
  React.useEffect(() => {
    if (!state || state === announced.current) return;
    announced.current = state;
    if (state.ok) {
      toast({
        title: state.published ? "Published." : "Saved.",
        detail: state.published
          ? `Anybody signed in can find you at /people/${state.handle}.`
          : "Only you can see it until you publish.",
      });
      router.refresh();
    }
  }, [state, toast, router]);

  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={action} className="flex flex-col gap-5">
      <Panel flush>
        <PanelHead title="Publishing" />
        <div className="flex flex-col gap-4 px-5 py-5">
          <label className="proof-check">
            <input
              type="checkbox"
              name="published"
              value="true"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="mt-1"
            />
            <span>
              <b className="block text-ink">Publish my page.</b>
              Anybody signed in can find it. Turn this off and it is gone again straight away —
              nothing is scheduled and nothing lingers.
            </span>
          </label>

          <div className="admin-field">
            <label htmlFor="handle">Your address</label>
            <div className="handle-field">
              <span>/people/</span>
              <input
                id="handle"
                name="handle"
                className="input"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                maxLength={30}
                required
              />
            </div>
            {errors.handle ? (
              <p className="form-error">{errors.handle}</p>
            ) : (
              <p className="note mt-0">Letters and numbers. Yours alone, and yours to change.</p>
            )}
          </div>

          {draft.published && (
            <p className="note mt-0">
              <Link href={`/people/${draft.handle}`} className="underline">
                See it as everybody else does
              </Link>
            </p>
          )}
        </div>
      </Panel>

      <Panel flush>
        <PanelHead title="Who you are" />
        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="admin-grid">
            <div className="admin-field">
              <label htmlFor="displayName">Name on the page</label>
              <input
                id="displayName"
                name="displayName"
                className="input"
                defaultValue={draft.displayName}
                maxLength={60}
                placeholder="Leave empty to use your account name"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="headline">One line</label>
              <input
                id="headline"
                name="headline"
                className="input"
                defaultValue={draft.headline}
                maxLength={90}
                placeholder="Weekend ridges and cold water."
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="bio">About you</label>
            <textarea
              id="bio"
              name="bio"
              className="input"
              rows={4}
              maxLength={600}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Slow uphill, quick down. Happy to wait, happier with a flask."
            />
            <p className="note mt-0">{600 - bio.length} characters left.</p>
          </div>

          <fieldset className="accent-row">
            <legend className="meta">Your colour</legend>
            {ACCENTS.map((accent) => (
              <label key={accent.value} data-accent={accent.value.toLowerCase()}>
                <input
                  type="radio"
                  name="accent"
                  value={accent.value}
                  defaultChecked={draft.accent === accent.value}
                />
                <span aria-hidden="true" />
                {accent.label}
              </label>
            ))}
          </fieldset>
        </div>
      </Panel>

      <Panel flush>
        <PanelHead title="Elsewhere" />
        <div className="admin-grid px-5 py-5">
          {(["instagram", "facebook", "strava"] as const).map((key) => (
            <div className="admin-field" key={key}>
              <label htmlFor={key}>
                {key === "instagram" ? "Instagram" : key === "facebook" ? "Facebook" : "Strava"}
              </label>
              <input
                id={key}
                name={key}
                className="input"
                defaultValue={draft[key]}
                maxLength={120}
                placeholder="@yourhandle"
              />
            </div>
          ))}
          <p className="note col-span-full mt-0">
            Handles, not links. Paste a whole URL if it is easier — only the handle inside it is
            kept, so a link can never end up pointing somewhere else.
          </p>
        </div>
      </Panel>

      <Panel flush>
        <PanelHead title="What the page shows" />
        <div className="flex flex-col gap-3 px-5 py-5">
          {SECTIONS.map((section) => (
            <label key={section.name} className="proof-check">
              <input
                type="checkbox"
                name={section.name}
                value="true"
                defaultChecked={draft[section.name]}
                className="mt-1"
              />
              <span>
                <b className="block text-ink">{section.label}</b>
                {section.detail}
              </span>
            </label>
          ))}
          <p className="note mt-0">
            Anything switched off is not fetched at all, not merely hidden. Nothing about it leaves
            the database for somebody looking at your page.
          </p>
        </div>
      </Panel>

      {errors.form && <p className="form-error">{errors.form}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Save published={published} />
        <Link href="/profile" className="btn btn-ghost btn-sm">
          Back to settings
        </Link>
      </div>
    </form>
  );
}
