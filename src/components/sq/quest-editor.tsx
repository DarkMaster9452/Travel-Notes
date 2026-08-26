"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { createQuestAction, updateQuestAction, type QuestFormState } from "@/app/admin/actions";
import { SqMap } from "@/components/sq/map";

export type QuestDraft = {
  id?: string;
  title: string;
  subtitle: string;
  objective: string;
  description: string;
  bonus: string;
  safetyNotes: string;
  category: string;
  location: string;
  region: string;
  country: string;
  latitude: string;
  longitude: string;
  distance: string;
  elevationGain: string;
  duration: string;
  difficulty: string;
  published: boolean;
  coverImage: string;
  parkingName: string;
  parkingLat: string;
  parkingLng: string;
  parkingNote: string;
  approachTime: string;
  transitNote: string;
};

export const EMPTY_QUEST: QuestDraft = {
  title: "",
  subtitle: "",
  objective: "",
  description: "",
  bonus: "",
  safetyNotes: "",
  category: "",
  location: "",
  region: "",
  country: "Slovakia",
  latitude: "",
  longitude: "",
  distance: "",
  elevationGain: "",
  duration: "",
  difficulty: "MODERATE",
  published: false,
  coverImage: "",
  parkingName: "",
  parkingLat: "",
  parkingLng: "",
  parkingNote: "",
  approachTime: "",
  transitNote: "",
};

/**
 * Write or edit a quest.
 *
 * Grouped the way a quest is actually written: what it is, where it is, what
 * it costs in legs, and how to get to the start. The map beside the
 * coordinates is live — a trailhead typed one digit wrong is a mistake you can
 * see rather than one somebody drives to.
 */
export function SqQuestEditor({ draft }: { draft: QuestDraft }) {
  const router = useRouter();
  const editing = Boolean(draft.id);

  const [state, action, pending] = useActionState<QuestFormState, FormData>(
    editing ? updateQuestAction : createQuestAction,
    undefined,
  );

  const [lat, setLat] = useState(draft.latitude);
  const [lng, setLng] = useState(draft.longitude);
  const [published, setPublished] = useState(draft.published);

  useEffect(() => {
    if (state?.ok && !editing) router.push(`/admin/quests/${state.questId}`);
  }, [state, editing, router]);

  const errors = state && !state.ok ? state.errors : {};
  const point = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && lat !== "" && lng !== "";

  return (
    <form action={action} className="sq-grid sq-grid-fit" style={{ alignItems: "start" }}>
      {draft.id ? <input type="hidden" name="questId" value={draft.id} /> : null}
      <input type="hidden" name="published" value={published ? "true" : "false"} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel title="What it is">
          <Field label="Title" name="title" defaultValue={draft.title} error={errors?.title} required />
          <Field label="One line under it" name="subtitle" defaultValue={draft.subtitle} error={errors?.subtitle} required />
          <Field
            label="Objective"
            name="objective"
            defaultValue={draft.objective}
            error={errors?.objective}
            textarea
            required
          />
          <Field
            label="The day, described"
            name="description"
            defaultValue={draft.description}
            error={errors?.description}
            textarea
            required
          />
          <Field label="Bonus challenge" name="bonus" defaultValue={draft.bonus} error={errors?.bonus} textarea />
          <Field
            label="Safety notes"
            name="safetyNotes"
            defaultValue={draft.safetyNotes}
            error={errors?.safetyNotes}
            textarea
          />
          <Field label="Category" name="category" defaultValue={draft.category} error={errors?.category} />
        </Panel>

        <Panel title="Getting there">
          <Field label="Car park" name="parkingName" defaultValue={draft.parkingName} error={errors?.parkingName} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Car park latitude" name="parkingLat" defaultValue={draft.parkingLat} error={errors?.parkingLat} />
            <Field label="Car park longitude" name="parkingLng" defaultValue={draft.parkingLng} error={errors?.parkingLng} />
          </div>
          <Field label="Note about parking" name="parkingNote" defaultValue={draft.parkingNote} error={errors?.parkingNote} />
          <Field
            label="Minutes from the car to the start"
            name="approachTime"
            defaultValue={draft.approachTime}
            error={errors?.approachTime}
          />
          <Field
            label="Without a car"
            name="transitNote"
            defaultValue={draft.transitNote}
            error={errors?.transitNote}
            textarea
          />
        </Panel>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel title="Where it is">
          <Field label="Trailhead" name="location" defaultValue={draft.location} error={errors?.location} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Region" name="region" defaultValue={draft.region} error={errors?.region} required />
            <Field label="Country" name="country" defaultValue={draft.country} error={errors?.country} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label className="sq-field">
              <span className="sq-label">Latitude</span>
              <input className="sq-input" name="latitude" value={lat} onChange={(event) => setLat(event.target.value)} required />
              {errors?.latitude ? <span className="sq-error">{errors.latitude}</span> : null}
            </label>
            <label className="sq-field">
              <span className="sq-label">Longitude</span>
              <input className="sq-input" name="longitude" value={lng} onChange={(event) => setLng(event.target.value)} required />
              {errors?.longitude ? <span className="sq-error">{errors.longitude}</span> : null}
            </label>
          </div>

          {point ? (
            <SqMap
              points={[{ lat: Number(lat), lng: Number(lng), label: draft.title || "Start", kind: "summit" }]}
              height={200}
              drawRoute={false}
            />
          ) : (
            <p className="sq-hint">Type coordinates and the map will show what you have written.</p>
          )}
        </Panel>

        <Panel title="What it costs in legs">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 14 }}>
            <Field label="Distance, km" name="distance" defaultValue={draft.distance} error={errors?.distance} required />
            <Field
              label="Ascent, m"
              name="elevationGain"
              defaultValue={draft.elevationGain}
              error={errors?.elevationGain}
              required
            />
            <Field
              label="Moving, minutes"
              name="duration"
              defaultValue={draft.duration}
              error={errors?.duration}
              required
            />
          </div>
          <label className="sq-field">
            <span className="sq-label">Grade</span>
            <select className="sq-select" name="difficulty" defaultValue={draft.difficulty}>
              <option value="EASY">Easy</option>
              <option value="MODERATE">Moderate</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Expert</option>
            </select>
          </label>
          <Field label="Cover image URL" name="coverImage" defaultValue={draft.coverImage} error={errors?.coverImage} />
        </Panel>

        <section className="sq-card" style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto",
              gap: 18,
              alignItems: "center",
              padding: "16px 22px",
            }}
          >
            <span>
              <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>Published</b>
              <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
                Only a published quest can be booked into a slot or filed against.
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={published}
              aria-label="Published"
              className="sq-switch"
              onClick={() => setPublished((value) => !value)}
            >
              <i />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: "14px 22px",
              borderTop: "1px solid var(--line-2)",
              background: "var(--paper-2)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12.5, color: errors?.form ? "var(--signal)" : "var(--ink-2)" }}>
              {errors?.form ?? (state?.ok ? "Saved." : "The signature is recomputed on every write.")}
            </span>
            <span style={{ display: "flex", gap: 10 }}>
              <Link href="/admin/quests" className="sq-btn sq-btn-ghost sq-btn-sm">
                Back
              </Link>
              <button type="submit" className="sq-btn sq-btn-primary sq-btn-sm" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save the quest" : "Write it"}
              </button>
            </span>
          </div>
        </section>
      </div>
    </form>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: "18px 22px", display: "grid", gap: 14 }}>{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  textarea,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="sq-field">
      <span className="sq-label">{label}</span>
      {textarea ? (
        <textarea className="sq-textarea" name={name} defaultValue={defaultValue} required={required} />
      ) : (
        <input className="sq-input" name={name} defaultValue={defaultValue} required={required} />
      )}
      {error ? <span className="sq-error">{error}</span> : null}
    </label>
  );
}
