"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { useT } from "@/components/sq/i18n";
import { Glyph, StravaMark } from "@/components/sq/icons";
import { useToast } from "@/components/sq/toast";

export type ProofAsk = {
  distance: number;
  elevationGain: number;
  duration: number;
};

export type ProofDraft = {
  note: string;
  photos: string[];
  stravaUrl: string;
  distance: string;
  elevation: string;
  movingTime: string;
  retreated: boolean;
  startedAt: string;
};

/**
 * The proof form.
 *
 * Three claims and the evidence for them, in the order a reader will read
 * them: what happened, what it looked like, what the watch said. The figures
 * are optional throughout — plenty of people walk without one — and every
 * cell says what the quest asked for beside the box, because the reader on the
 * other side is going to compare exactly those two numbers.
 *
 * Nothing is submitted twice: the button swaps to a spinner and then to a
 * check mark, and the form is inert between those two states.
 */
export function SqProofForm({
  questId,
  ask,
  draft,
  scoreFull,
  scoreRetreat,
  stravaConnected,
  submit,
  importStrava,
}: {
  questId: string;
  ask: ProofAsk;
  draft: ProofDraft;
  scoreFull: number;
  scoreRetreat: number;
  stravaConnected: boolean;
  submit: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  importStrava: (
    url: string,
  ) => Promise<{ ok: boolean; message?: string; distance?: number; elevation?: number; movingTime?: number }>;
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();

  const [note, setNote] = useState(draft.note);
  const [photos, setPhotos] = useState<string[]>(draft.photos);
  const [strava, setStrava] = useState(draft.stravaUrl);
  const [distance, setDistance] = useState(draft.distance);
  const [elevation, setElevation] = useState(draft.elevation);
  const [movingTime, setMovingTime] = useState(draft.movingTime);
  const [retreated, setRetreated] = useState(draft.retreated);
  const [startedAt, setStartedAt] = useState(draft.startedAt);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const points = retreated ? scoreRetreat : scoreFull;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, 4 - photos.length)) {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const result = (await response.json()) as { ok: boolean; url?: string; message?: string };
      if (result.ok && result.url) added.push(result.url);
      else toast(result.message ?? t.proof.uploadFailed, "stamp");
    }
    setPhotos((current) => [...current, ...added].slice(0, 4));
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (note.trim().length < 10) next.note = t.proof.tellUs;
    if (strava && !/^https?:\/\//.test(strava)) next.strava = t.proof.stravaBadLink;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state !== "idle" || !validate()) return;

    const data = new FormData();
    data.set("questId", questId);
    data.set("note", note);
    data.set("photos", photos.join("\n"));
    data.set("stravaUrl", strava);
    if (distance) data.set("distance", distance);
    if (elevation) data.set("elevation", elevation);
    if (movingTime) data.set("movingTime", movingTime);
    if (startedAt) data.set("startedAt", startedAt);
    if (retreated) data.set("retreated", "true");

    setState("saving");
    startTransition(() => {
      void submit(data).then((result) => {
        if (!result.ok) {
          setState("idle");
          setErrors({ form: result.message ?? t.proof.failed });
          return;
        }
        setState("done");
        toast(retreated ? t.proof.retreatFiled : t.proof.filed);
        window.setTimeout(() => router.push("/submissions"), 700);
      });
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="sq-grid sq-grid-fit"
      style={{ alignItems: "start" }}
      aria-busy={state === "saving"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section className="sq-card" style={{ overflow: "hidden" }}>
          <SectionHead title={t.proof.whatHappened} note={t.proof.required} />
          <div style={{ padding: "18px 22px 20px" }}>
            <textarea
              className="sq-textarea"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.proof.notePlaceholder}
              style={{ minHeight: 132, background: "var(--paper-2)" }}
            />
            {errors.note ? <p className="sq-error">{errors.note}</p> : null}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginTop: 10,
              }}
            >
              <span className="sq-mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--ink-3)" }}>
                {note.trim().length} characters · no maximum
              </span>
              <span className="sq-mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--ink-3)" }}>
                Conditions and hazards help the next person
              </span>
            </div>
          </div>
        </section>

        <section className="sq-card" style={{ overflow: "hidden" }}>
          <SectionHead title={t.proof.photographs} note={t.proof.upToFour} />
          <div
            style={{
              padding: "18px 22px 20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(132px,1fr))",
              gap: 10,
            }}
          >
            {photos.map((photo, index) => (
              <span
                key={photo}
                style={{
                  position: "relative",
                  height: 120,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--paper-3)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- uploads live on the blob host */}
                <img
                  src={photo}
                  alt={`Photograph ${index + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  aria-label={t.proof.removePhoto}
                  onClick={() => setPhotos((current) => current.filter((entry) => entry !== photo))}
                  className="sq-btn sq-btn-ghost sq-btn-sm"
                  style={{ position: "absolute", top: 6, right: 6, padding: "4px 8px" }}
                >
                  <Glyph name="cross" size={12} />
                </button>
              </span>
            ))}

            {photos.length < 4 ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                style={{
                  height: 120,
                  borderRadius: 10,
                  border: "1px dashed var(--line)",
                  background: "var(--paper-2)",
                  color: "var(--ink-2)",
                  display: "grid",
                  placeItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 12.5,
                }}
              >
                <Glyph name="camera" size={20} />
                {uploading ? t.proof.uploading : t.proof.addPhoto}
              </button>
            ) : null}

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => void upload(event.target.files)}
            />
          </div>
          <p style={{ padding: "0 22px 20px", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)" }}>
            A photograph with the ground in it beats a summit selfie. Location data is stripped on
            upload, and nothing here is published unless you publish your page.
          </p>
        </section>

        <section className="sq-card" style={{ overflow: "hidden" }}>
          <SectionHead title={t.proof.yourFigures} note={t.proof.optional} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
              gap: 1,
              background: "var(--line-2)",
            }}
          >
            <FigureCell
              label={t.proof.distance}
              unit="km"
              value={distance}
              onChange={setDistance}
              asked={`asked ${ask.distance.toFixed(1)}`}
            />
            <FigureCell
              label={t.proof.ascent}
              unit="m"
              value={elevation}
              onChange={setElevation}
              asked={`asked ${Math.round(ask.elevationGain)}`}
            />
            <FigureCell
              label={t.proof.movingTime}
              unit="min"
              value={movingTime}
              onChange={setMovingTime}
              asked={`asked ${ask.duration}`}
            />
          </div>

          <div style={{ padding: "15px 22px", borderTop: "1px solid var(--line-2)" }}>
            <label className="sq-field">
              <span className="sq-label">The day you went</span>
              <input
                className="sq-input"
                type="date"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </label>
            <p className="sq-hint" style={{ marginTop: 7 }}>
              The board counts a quest into the window it was walked in, not the one it was written
              up in.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "15px 22px",
              borderTop: "1px solid var(--line-2)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--signal)" }}>
              <StravaMark size={13} />
              {stravaConnected ? t.proof.stravaConnected : t.proof.strava}
            </span>
            <span style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 220 }}>
              <input
                className="sq-input"
                value={strava}
                onChange={(event) => setStrava(event.target.value)}
                placeholder="https://www.strava.com/activities/…"
              />
              <button
                type="button"
                className="sq-btn sq-btn-ghost sq-btn-sm"
                disabled={!strava}
                onClick={() => {
                  startTransition(() => {
                    void importStrava(strava).then((result) => {
                      if (!result.ok) {
                        toast(result.message ?? t.proof.stravaUnreadable, "stamp");
                        return;
                      }
                      if (result.distance != null) setDistance(result.distance.toFixed(1));
                      if (result.elevation != null) setElevation(String(Math.round(result.elevation)));
                      if (result.movingTime != null) setMovingTime(String(Math.round(result.movingTime)));
                      toast(t.proof.stravaRead);
                    });
                  });
                }}
              >
                Use its figures
              </button>
            </span>
            {errors.strava ? <p className="sq-error">{errors.strava}</p> : null}
          </div>
        </section>

        <section
          className="sq-card"
          style={{
            borderColor: "var(--signal)",
            padding: "20px 22px",
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: 18,
            alignItems: "center",
          }}
        >
          <span>
            <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>I turned back</b>
            <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
              File it as an honest retreat. It scores half, and it is worth more than nothing — say
              where you got to and why you stopped.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={retreated}
            aria-label={t.proof.retreat}
            className="sq-switch"
            onClick={() => setRetreated((value) => !value)}
          >
            <i />
          </button>
        </section>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section className="sq-slab" style={{ padding: "22px 24px" }}>
          <span className="sq-kicker">If this is approved</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, margin: "14px 0 16px" }}>
            <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 40, lineHeight: 0.9 }}>
              {points}
            </b>
            <span style={{ fontSize: 13, paddingBottom: 6, color: "var(--forest-ink-3)" }}>points</span>
          </div>

          {errors.form ? (
            <p className="sq-error" style={{ color: "#f6cdb9", marginBottom: 12 }}>
              {errors.form}
            </p>
          ) : null}

          <button
            type="submit"
            className="sq-btn sq-btn-block"
            style={{ background: "var(--signal)", color: "#fff" }}
            disabled={state !== "idle"}
          >
            {state === "idle" ? (
              retreated ? t.proof.fileRetreat : t.proof.file
            ) : state === "saving" ? (
              <Spinner label={t.common.filing} />
            ) : (
              <Glyph name="check" size={18} strokeWidth={2.4} />
            )}
          </button>
          <p
            className="sq-kicker-sm"
            style={{ marginTop: 12, textAlign: "center", color: "var(--forest-ink-2)" }}
          >
            You can edit it until somebody reads it
          </p>
        </section>

        <section className="sq-tinted" style={{ padding: "20px 22px" }}>
          <h3 className="sq-h2" style={{ fontSize: 17, marginBottom: 12 }}>
            {t.proof.readerLooksFor}
          </h3>
          <ol>
            {[
              t.proof.whatHappenedHint,
              t.proof.photographsHint,
              t.proof.figuresHint,
              t.proof.retreatHint,
            ].map((line) => (
              <li
                key={line}
                style={{
                  display: "flex",
                  gap: 11,
                  alignItems: "flex-start",
                  padding: "10px 0",
                  borderTop: "1px solid var(--line-2)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "var(--moss)", flex: "0 0 15px", marginTop: 2 }}>
                  <Glyph name="check" size={15} strokeWidth={2} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="sq-card" style={{ borderColor: "var(--line)", padding: "20px 22px", boxShadow: "none" }}>
          <h3 className="sq-h2" style={{ fontSize: 17, marginBottom: 10 }}>
            A decline is not a door closing
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
            If it comes back you keep the photographs and the note, you get the reason in the
            reader&rsquo;s own words, and you can file again inside the same window.
          </p>
        </section>
      </div>
    </form>
  );
}

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "15px 22px",
        borderBottom: "1px solid var(--line-2)",
      }}
    >
      <h2 className="sq-h2" style={{ fontSize: 19 }}>
        {title}
      </h2>
      <span className="sq-kicker-sm" style={{ letterSpacing: "0.07em" }}>
        {note}
      </span>
    </div>
  );
}

function FigureCell({
  label,
  unit,
  value,
  onChange,
  asked,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  asked: string;
}) {
  return (
    <div style={{ background: "var(--card)", padding: "15px 18px" }}>
      <label className="sq-label" style={{ display: "block", marginBottom: 8 }}>
        {label}
      </label>
      <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <input
          className="sq-input"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="—"
          style={{
            border: 0,
            background: "transparent",
            padding: 0,
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: 22,
          }}
        />
        <span className="sq-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {unit}
        </span>
      </span>
      <p className="sq-mono" style={{ marginTop: 7, fontSize: 10, letterSpacing: "0.05em", color: "var(--moss)" }}>
        {asked}
      </p>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span
      aria-label={label}
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        display: "inline-block",
        animation: "sq-spin 700ms linear infinite",
      }}
    />
  );
}
