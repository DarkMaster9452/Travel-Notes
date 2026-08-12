"use client";

import * as React from "react";
import { useActionState } from "react";

import type { ProfileState } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { PLACES } from "@/lib/geo";
import { ONBOARDING_INTERESTS, STYLE_LABEL, TIME_LABEL, TRANSPORT_LABEL } from "@/lib/quest/taxonomy";
import { cn } from "@/lib/utils";

export type PreferencesValues = {
  homeLocation: string;
  maxDistance: number;
  preferredDistance: number;
  interests: string[];
  difficulty: string;
  timeAvailable: string;
  transport: string;
  questStyle: string;
};

const DIFFICULTIES = ["EASY", "MODERATE", "HARD", "SURPRISE"] as const;
const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  HARD: "Hard",
  SURPRISE: "Surprise me",
};

export function PreferencesForm({
  action,
  initial,
}: {
  action: (state: ProfileState, formData: FormData) => Promise<ProfileState>;
  initial: PreferencesValues;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(action, undefined);
  const [interests, setInterests] = React.useState<string[]>(initial.interests);
  const [maxDistance, setMaxDistance] = React.useState(initial.maxDistance);
  const [preferredDistance, setPreferredDistance] = React.useState(initial.preferredDistance);

  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="space-y-10">
      {state?.saved && (
        <p role="status" className="border-l-2 border-moss bg-moss/8 px-4 py-3 text-sm">
          Preferences saved. Your next quest will use them.
        </p>
      )}
      {errors.form && (
        <p role="alert" className="border-l-2 border-ember bg-ember/8 px-4 py-3 text-sm">
          {errors.form}
        </p>
      )}

      <Field label="Home base" htmlFor="homeLocation" error={errors.homeLocation}>
        <Input
          id="homeLocation"
          name="homeLocation"
          defaultValue={initial.homeLocation}
          list="profile-places"
          required
        />
        <datalist id="profile-places">
          {PLACES.map((place) => (
            <option key={place.name} value={place.name} />
          ))}
        </datalist>
      </Field>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <Label htmlFor="maxDistance">Travel radius · {maxDistance} km</Label>
          <input
            id="maxDistance"
            name="maxDistance"
            type="range"
            min={5}
            max={200}
            step={5}
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="mt-4 h-1 w-full cursor-pointer appearance-none bg-ink/20 accent-ember"
          />
        </div>

        <div>
          <Label htmlFor="preferredDistance">Route length · {preferredDistance} km</Label>
          <input
            id="preferredDistance"
            name="preferredDistance"
            type="range"
            min={3}
            max={30}
            step={1}
            value={preferredDistance}
            onChange={(e) => setPreferredDistance(Number(e.target.value))}
            className="mt-4 h-1 w-full cursor-pointer appearance-none bg-ink/20 accent-ember"
          />
        </div>
      </div>

      <fieldset>
        <legend className="kicker text-stone">What you&apos;re after</legend>
        {errors.interests && (
          <p role="alert" className="mt-2 text-xs text-ember">
            {errors.interests}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {ONBOARDING_INTERESTS.map((interest) => {
            const selected = interests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setInterests((prev) =>
                    prev.includes(interest.id)
                      ? prev.filter((i) => i !== interest.id)
                      : [...prev, interest.id],
                  )
                }
                className={cn(
                  "border px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase transition-colors",
                  selected
                    ? "border-ember bg-ember text-paper"
                    : "border-ink/25 text-stone hover:border-ink hover:text-ink",
                )}
              >
                <span aria-hidden="true" className="mr-2">
                  {interest.emoji}
                </span>
                {interest.label}
              </button>
            );
          })}
        </div>
        {interests.map((interest) => (
          <input key={interest} type="hidden" name="interests" value={interest} />
        ))}
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2">
        <SelectField
          label="Difficulty"
          name="difficulty"
          defaultValue={initial.difficulty}
          options={DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value]! }))}
        />
        <SelectField
          label="Time available"
          name="timeAvailable"
          defaultValue={initial.timeAvailable}
          options={Object.entries(TIME_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="Transport"
          name="transport"
          defaultValue={initial.transport}
          options={Object.entries(TRANSPORT_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="Quest style"
          name="questStyle"
          defaultValue={initial.questStyle}
          options={Object.entries(STYLE_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Saving" : "Save preferences"}
      </Button>
    </form>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full border-b border-ink/25 bg-transparent px-0 text-base focus:border-ember focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
