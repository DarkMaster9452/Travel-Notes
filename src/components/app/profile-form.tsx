"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { savePublicProfileAction, type PublicProfileState } from "@/app/(app)/profile/public-actions";
import { ToggleRow } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Field, FieldStack, Input, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/toggle";
import { ACCENT_INK, ACCENT_KEYS } from "@/lib/accents";
import { cn } from "@/lib/utils";

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
  showActivityGrid: boolean;
};

/**
 * The public page editor.
 *
 * Publishing is the only privacy control there is, so it sits at the top as a
 * switch with the consequence spelled out beside it rather than buried under
 * the fields it governs. Every section switch below it is a real switch: a
 * section turned off is absent from the page, not blank on it.
 */
export function ProfileForm({ draft }: { draft: ProfileDraft }) {
  const t = useT();
  const words = t.app.settingsPane.profile;
  const id = useId();
  const [state, action, pending] = useActionState<PublicProfileState, FormData>(savePublicProfileAction, undefined);
  const [published, setPublished] = useState(draft.published);
  const [accent, setAccent] = useState(draft.accent);
  const errors = state && !state.ok ? state.errors : {};
  const handle = state?.ok ? state.handle : draft.handle;
  const live = state?.ok ? published : draft.published;

  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-6">
      <Pane
        title={words.heading}
        action={
          live ? (
            <Link
              href={`/people/${handle}`}
              className="inline-flex items-center gap-1 text-body-sm font-medium text-primary underline underline-offset-2"
            >
              {words.see}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : undefined
        }
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 pb-4">
          <label htmlFor={`${id}-published`} className="min-w-0">
            <span className="block text-body-sm font-semibold text-text">{words.published}</span>
            <span className="mt-1 block text-caption text-muted">{words.publishedDetail}</span>
          </label>
          <input type="hidden" name="published" value={published ? "true" : "false"} />
          <Switch id={`${id}-published`} checked={published} onChange={(event) => setPublished(event.target.checked)} />
        </div>

        <FieldStack className="p-5">
          <Field label={words.handle} htmlFor={`${id}-handle`} hint={words.handleHint} error={errors?.handle}>
            <Input
              id={`${id}-handle`}
              name="handle"
              defaultValue={draft.handle}
              maxLength={30}
              required
              aria-invalid={errors?.handle ? true : undefined}
            />
          </Field>
          <Field label={words.displayName} htmlFor={`${id}-name`} optional={t.ui.optional}>
            <Input
              id={`${id}-name`}
              name="displayName"
              defaultValue={draft.displayName}
              maxLength={60}
              placeholder={t.common.displayNamePlaceholder}
            />
          </Field>
          <Field label={words.headline} htmlFor={`${id}-headline`} optional={t.ui.optional}>
            <Input
              id={`${id}-headline`}
              name="headline"
              defaultValue={draft.headline}
              maxLength={90}
              placeholder={t.common.headlinePlaceholder}
            />
          </Field>
          <Field label={words.bio} htmlFor={`${id}-bio`} optional={t.ui.optional}>
            <Textarea id={`${id}-bio`} name="bio" defaultValue={draft.bio} maxLength={600} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Instagram" htmlFor={`${id}-ig`} optional={t.ui.optional}>
              <Input id={`${id}-ig`} name="instagram" defaultValue={draft.instagram} maxLength={120} />
            </Field>
            <Field label="Facebook" htmlFor={`${id}-fb`} optional={t.ui.optional}>
              <Input id={`${id}-fb`} name="facebook" defaultValue={draft.facebook} maxLength={120} />
            </Field>
            <Field label="Strava" htmlFor={`${id}-strava`} optional={t.ui.optional}>
              <Input id={`${id}-strava`} name="strava" defaultValue={draft.strava} maxLength={120} />
            </Field>
          </div>

          {/* Swatches rather than a dropdown: the colour is the one thing on
              this form whose effect is purely visual. Profile colours are a
              domain palette (§1.5), so each swatch reads its own value. */}
          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="text-body-sm font-medium text-text">{words.accent}</legend>
            <p className="text-caption text-subtle">{words.accentHint}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {ACCENT_KEYS.map((key) => (
                <label key={key} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="accent"
                    value={key}
                    checked={accent === key}
                    onChange={() => setAccent(key)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex min-h-10 items-center gap-2 rounded-pill border border-border-strong bg-surface py-1 pl-1 pr-3 text-body-sm font-medium",
                      "peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary-soft-fg",
                      "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                    )}
                  >
                    <span
                      className="grid size-8 place-items-center rounded-pill border border-(--edge) bg-(--wash) text-(--ink)"
                      style={{
                        ["--wash" as string]: ACCENT_INK[key].wash,
                        ["--edge" as string]: ACCENT_INK[key].edge,
                        ["--ink" as string]: ACCENT_INK[key].ink,
                      }}
                      aria-hidden="true"
                    >
                      {accent === key ? <Check className="size-4" /> : null}
                    </span>
                    {words.accents[key] ?? ACCENT_INK[key].label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </FieldStack>
      </Pane>

      <Pane title={words.sections}>
        <ul>
          {(
            [
              ["showStats", t.profile.switches.stats],
              ["showCountry", t.profile.switches.country],
              ["showActivities", t.profile.switches.activities],
              ["showStickers", t.profile.switches.stickers],
              ["showActivityGrid", t.profile.switches.activityGrid],
            ] as const
          ).map(([key, copy]) => (
            <ToggleRow key={key} name={key} label={copy.label} description={copy.detail} defaultOn={draft[key]} />
          ))}
        </ul>
        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p role={errors?.form ? "alert" : undefined} className={cn("text-caption", errors?.form ? "text-danger" : "text-muted")}>
            {errors?.form ?? words.footer}
          </p>
          <Button type="submit" loading={pending} className="shrink-0">
            {state?.ok && !pending ? <Check aria-hidden="true" /> : null}
            {pending ? t.common.saving : state?.ok ? t.common.saved : t.common.save}
          </Button>
        </div>
      </Pane>
    </form>
  );
}
