"use client";

import { Check, ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/toggle";
import { formatNumber } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

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

const MAX_PHOTOS = 4;

/**
 * The proof form (design/DESIGN-SYSTEM.md §12: one 640 px column, a submit
 * that stays in reach on a phone).
 *
 * Three claims and the evidence for them, in the order a reader will read
 * them: what happened, what it looked like, what the watch said. The figures
 * are optional throughout — plenty of people walk without one — and every
 * field says what the quest asked for under the box, because the reader on the
 * other side is going to compare exactly those two numbers. They are entered
 * in kilometres, metres and minutes, which is how they are stored.
 *
 * Nothing is submitted twice: the button swaps to a spinner and then to a
 * check mark, and the form is inert between those two states.
 */
export function ProofForm({
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
  const { t, locale } = useI18n();
  const words = t.app.proofForm;
  const id = useId();
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
  const [importing, startImport] = useTransition();
  const [, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const points = retreated ? scoreRetreat : scoreFull;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
      const body = new FormData();
      body.set("file", file);
      try {
        const response = await fetch("/api/uploads", { method: "POST", body });
        const result = (await response.json()) as { ok: boolean; url?: string; message?: string };
        if (result.ok && result.url) added.push(result.url);
        else toast(result.message ?? t.proof.uploadFailed, "error");
      } catch {
        toast(t.proof.uploadFailed, "error");
      }
    }
    setPhotos((current) => [...current, ...added].slice(0, MAX_PHOTOS));
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (note.trim().length < 10) next.note = t.proof.tellUs;
    // The server refuses a proof with no photograph; say so here, in the
    // reader's language, before the round trip.
    if (photos.length === 0) next.photos = words.photoRequired;
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
    <form onSubmit={onSubmit} aria-busy={state === "saving"} className="flex flex-col gap-4 lg:gap-6" noValidate>
      {/* --- what happened ---------------------------------------------------- */}
      <Card>
        <CardHeader title={t.proof.whatHappened} note={t.proof.whatHappenedHint} action={<Tag>{t.proof.required}</Tag>} />
        <Field
          label={t.proof.whatHappened}
          htmlFor={`${id}-note`}
          error={errors.note}
          hint={`${words.characters(note.trim().length)}. ${words.noteHint}`}
          className="[&>label]:sr-only"
        >
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.proof.notePlaceholder}
            aria-invalid={errors.note ? true : undefined}
            className="min-h-32"
          />
        </Field>
      </Card>

      {/* --- photographs ------------------------------------------------------ */}
      <Card>
        <CardHeader title={t.proof.photographs} note={t.proof.photographsHint} action={<Tag>{words.photoLimit}</Tag>} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo} className="relative aspect-square overflow-hidden rounded-control bg-surface-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploads live on the blob host */}
              <img src={photo} alt={words.photoAlt(index + 1)} className="size-full object-cover" />
              <button
                type="button"
                aria-label={t.proof.removePhoto}
                onClick={() => setPhotos((current) => current.filter((entry) => entry !== photo))}
                className="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-pill bg-surface/90 text-text shadow-1 transition-colors duration-fast hover:bg-surface"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}

          {photos.length < MAX_PHOTOS ? (
            <li>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border-strong bg-surface-sunken p-2 text-center text-caption font-medium text-muted transition-colors duration-fast hover:border-muted hover:text-text disabled:cursor-wait disabled:opacity-50"
              >
                <ImagePlus className="size-6" aria-hidden="true" />
                {uploading ? t.proof.uploading : t.proof.addPhoto}
              </button>
            </li>
          ) : null}
        </ul>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => void upload(event.target.files)}
        />
        {errors.photos ? <FieldError className="mt-3">{errors.photos}</FieldError> : null}
        <p className="mt-4 text-caption text-subtle">{words.photoNote}</p>
      </Card>

      {/* --- figures ---------------------------------------------------------- */}
      <Card>
        <CardHeader title={t.proof.yourFigures} note={t.proof.figuresHint} action={<Tag>{t.proof.optional}</Tag>} />
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Figure
              id={`${id}-distance`}
              label={t.proof.distance}
              unit="km"
              value={distance}
              onChange={setDistance}
              asked={words.asked(`${formatNumber(locale, Math.round(ask.distance * 10) / 10)} km`)}
            />
            <Figure
              id={`${id}-elevation`}
              label={t.proof.ascent}
              unit="m"
              value={elevation}
              onChange={setElevation}
              asked={words.asked(`${formatNumber(locale, Math.round(ask.elevationGain))} m`)}
            />
            <Figure
              id={`${id}-moving`}
              label={t.proof.movingTime}
              unit="min"
              value={movingTime}
              onChange={setMovingTime}
              asked={words.asked(`${ask.duration} min`)}
            />
          </div>

          <Field label={words.day} htmlFor={`${id}-day`} hint={words.dayHint} className="sm:max-w-form">
            <Input id={`${id}-day`} type="date" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} />
          </Field>

          <Field
            label={stravaConnected ? t.proof.stravaConnected : t.proof.strava}
            htmlFor={`${id}-strava`}
            error={errors.strava}
            hint={words.stravaLink}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`${id}-strava`}
                type="url"
                inputMode="url"
                value={strava}
                onChange={(event) => setStrava(event.target.value)}
                placeholder="https://www.strava.com/activities/…"
                aria-invalid={errors.strava ? true : undefined}
              />
              <Button
                variant="secondary"
                className="shrink-0"
                disabled={!strava}
                loading={importing}
                onClick={() => {
                  startImport(async () => {
                    const result = await importStrava(strava);
                    if (!result.ok) {
                      toast(result.message ?? t.proof.stravaUnreadable, "error");
                      return;
                    }
                    if (result.distance != null) setDistance(result.distance.toFixed(1));
                    if (result.elevation != null) setElevation(String(Math.round(result.elevation)));
                    if (result.movingTime != null) setMovingTime(String(Math.round(result.movingTime)));
                    toast(t.proof.stravaRead);
                  });
                }}
              >
                {words.useFigures}
              </Button>
            </div>
          </Field>
        </div>
      </Card>

      {/* --- an honest retreat ------------------------------------------------ */}
      <Card className="flex items-center justify-between gap-4">
        <label htmlFor={`${id}-retreat`} className="min-w-0">
          <span className="block text-body-sm font-semibold text-text">{words.turnedBack}</span>
          <span className="mt-1 block text-caption text-muted">{words.turnedBackBody}</span>
        </label>
        <Switch
          id={`${id}-retreat`}
          checked={retreated}
          aria-label={t.proof.retreat}
          onChange={(event) => setRetreated(event.target.checked)}
        />
      </Card>

      {errors.form ? (
        <Alert tone="danger" role="alert" title={errors.form} />
      ) : null}

      {/* --- what it is worth, and the one action ------------------------------
          Sticks above the tab bar on a phone, so filing never needs a scroll;
          from lg up it simply ends the form. */}
      <div className="sticky bottom-20 z-sticky lg:static">
        <Card className="flex flex-col gap-3 shadow-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-baseline gap-2">
            <span className="text-body-sm text-muted">{t.proof.ifApproved}</span>
            <b className="font-display text-h2 font-bold tabular-nums text-primary">{points}</b>
            <span className="text-body-sm text-muted">{t.common.points}</span>
          </p>
          <Button type="submit" size="lg" loading={state === "saving"} disabled={state !== "idle"} className="shrink-0">
            {state === "done" ? <Check aria-hidden="true" /> : null}
            {state === "saving" ? t.common.filing : retreated ? t.proof.fileRetreat : t.proof.file}
          </Button>
        </Card>
      </div>
      <p className="text-center text-caption text-subtle">{words.editable}</p>
    </form>
  );
}

/** "Required", "Optional", "Up to four": the quiet word beside a section's title. */
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-overline font-semibold uppercase text-subtle">{children}</span>;
}

function Figure({
  id,
  label,
  unit,
  value,
  onChange,
  asked,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  asked: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={asked}>
      <span className="relative block">
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn("pr-12 font-semibold tabular-nums")}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-caption text-subtle">
          {unit}
        </span>
      </span>
    </Field>
  );
}

