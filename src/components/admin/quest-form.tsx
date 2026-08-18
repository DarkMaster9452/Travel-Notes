"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createQuestAction, type QuestFormState } from "@/app/admin/actions";
import { Panel, PanelHead, useToast } from "@/components/field";

/**
 * Authoring a quest.
 *
 * Quests come from admins and from nowhere else — there is no generator path
 * into this table, so this form is the only way a quest exists. It asks for
 * everything the issued document needs, because a quest missing its objective
 * or its figures is not a quest, it is a note.
 */

const CATEGORIES = ["Hiking", "Nature", "Mountain", "Coastal", "Forest", "Water", "City"];

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <p className="note mt-0">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-signal" disabled={pending}>
      {pending ? "Filing…" : "Create quest"}
    </button>
  );
}

export function QuestForm() {
  const router = useRouter();
  const toast = useToast();
  const [state, action] = useActionState<QuestFormState, FormData>(createQuestAction, undefined);
  const handled = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!state?.ok) return;
    if (handled.current === state.questId) return;
    handled.current = state.questId;
    toast({ title: "Quest created.", detail: "It is published and can be issued." });
    router.push("/admin/quests");
  }, [state, router, toast]);

  const errors = state?.ok === false ? state.errors : {};

  return (
    <form action={action} className="flex flex-col gap-5">
      <Panel flush>
        <PanelHead title="The document" />
        <div className="flex flex-col gap-5 px-5 py-5">
          <Field label="Title" name="title" error={errors.title}>
            <input
              id="title"
              name="title"
              className="input"
              placeholder="Stand on Veľký Rozsutec before the valley wakes up"
              required
            />
          </Field>

          <Field label="Subtitle" name="subtitle" error={errors.subtitle}>
            <input
              id="subtitle"
              name="subtitle"
              className="input"
              placeholder="14 km of ridge and chain, one summit"
              required
            />
          </Field>

          <Field
            label="Objective"
            name="objective"
            error={errors.objective}
            hint="What has to actually happen. Be specific enough that proof can be judged against it."
          >
            <textarea id="objective" name="objective" className="input" rows={3} required />
          </Field>

          <Field label="Description" name="description" error={errors.description}>
            <textarea id="description" name="description" className="input" rows={4} required />
          </Field>

          <Field
            label="Bonus challenge"
            name="bonus"
            error={errors.bonus}
            hint="Optional. Wry, not motivational."
          >
            <input id="bonus" name="bonus" className="input" />
          </Field>

          <Field label="Safety notes" name="safetyNotes" error={errors.safetyNotes} hint="Optional.">
            <input id="safetyNotes" name="safetyNotes" className="input" />
          </Field>

          <Field
            label="Cover photo"
            name="coverImage"
            error={errors.coverImage}
            hint="One image for this quest — a full https:// link. Shown on the quest sheet and in the panel."
          >
            <input
              id="coverImage"
              name="coverImage"
              type="url"
              className="input"
              placeholder="https://…"
            />
          </Field>
        </div>
      </Panel>

      <Panel flush>
        <PanelHead title="Where" />
        <div className="admin-grid px-5 py-5">
          <Field label="Location" name="location" error={errors.location}>
            <input id="location" name="location" className="input" placeholder="Veľký Rozsutec" required />
          </Field>
          <Field label="Region" name="region" error={errors.region}>
            <input id="region" name="region" className="input" placeholder="Malá Fatra" required />
          </Field>
          <Field label="Country" name="country" error={errors.country}>
            <input id="country" name="country" className="input" defaultValue="Slovakia" required />
          </Field>
          <Field label="Latitude" name="latitude" error={errors.latitude}>
            <input id="latitude" name="latitude" type="number" step="0.0001" className="input" defaultValue="49.19" required />
          </Field>
          <Field label="Longitude" name="longitude" error={errors.longitude}>
            <input id="longitude" name="longitude" type="number" step="0.0001" className="input" defaultValue="19.09" required />
          </Field>
          <Field label="Category" name="category" error={errors.category}>
            <select id="category" name="category" className="input" defaultValue="Hiking">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>

      <Panel flush>
        <PanelHead title="The figures" />
        <div className="admin-grid px-5 py-5">
          <Field label="Distance (km)" name="distance" error={errors.distance}>
            <input id="distance" name="distance" type="number" step="0.1" min="0.1" className="input" defaultValue="12" required />
          </Field>
          <Field label="Ascent (m)" name="elevationGain" error={errors.elevationGain}>
            <input id="elevationGain" name="elevationGain" type="number" min="0" className="input" defaultValue="700" required />
          </Field>
          <Field label="Moving time (min)" name="duration" error={errors.duration}>
            <input id="duration" name="duration" type="number" min="10" className="input" defaultValue="240" required />
          </Field>
          <Field label="Difficulty" name="difficulty" error={errors.difficulty}>
            <select id="difficulty" name="difficulty" className="input" defaultValue="MODERATE">
              <option value="EASY">Easy</option>
              <option value="MODERATE">Moderate</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Brutal</option>
            </select>
          </Field>
        </div>
      </Panel>

      {errors.form && <p className="form-error">{errors.form}</p>}

      <div className="flex items-center gap-3">
        <Submit />
        <label className="flex items-center gap-2 text-[14px] text-ink-2">
          <input type="checkbox" name="published" value="true" defaultChecked />
          Publish immediately
        </label>
      </div>
    </form>
  );
}
