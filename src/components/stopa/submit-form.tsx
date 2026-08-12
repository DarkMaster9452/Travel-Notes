"use client";

import * as React from "react";
import { useActionState } from "react";

import type { SubmitState } from "@/app/(app)/actions";
import { Button, CameraIcon, Spinner } from "@/components/stopa/ui";
import { DIFFICULTY_ORDER } from "@/lib/gamification";
import type { Dictionary } from "@/lib/i18n/dictionaries/sk";
import { cn } from "@/lib/utils";

const COMPARISONS = ["HARDER", "SIMILAR", "EASIER", "FIRST"] as const;

/**
 * Resize in the browser before upload.
 *
 * Phone photos are 4–12 MP; posting one raw would be slow on a mountain
 * signal and would blow the payload limit. Downscaling to 1280 px on the long
 * edge keeps the proof perfectly readable at a fraction of the size.
 */
async function toResizedDataUrl(file: File, maxEdge = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return canvas.toDataURL("image/jpeg", quality);
}

export function SubmitForm({
  action,
  questId,
  questTitle,
  comparableQuests,
  t,
}: {
  action: (state: SubmitState, formData: FormData) => Promise<SubmitState>;
  questId: string;
  questTitle: string;
  comparableQuests: Array<{ id: string; title: string }>;
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(action, undefined);
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const [difficulty, setDifficulty] = React.useState<string>("MODERATE");
  const [comparison, setComparison] = React.useState<string>(
    comparableQuests.length > 0 ? "SIMILAR" : "FIRST",
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formError = state?.errors?.form;

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await toResizedDataUrl(file);
      if (dataUrl.length > 1_500_000) {
        setPhotoError(t.submit.errors.photoTooBig);
        return;
      }
      setPhoto(dataUrl);
    } catch {
      setPhotoError(t.submit.errors.generic);
    }
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="questId" value={questId} />
      <input type="hidden" name="photo" value={photo ?? ""} />
      <input type="hidden" name="difficulty" value={difficulty} />
      <input type="hidden" name="comparison" value={comparison} />

      {formError && (
        <p role="alert" className="rounded-[10px] border-l-2 border-brick bg-brick/15 px-4 py-3 text-sm">
          {t.submit.errors[formError as keyof typeof t.submit.errors] ?? t.submit.errors.generic}
        </p>
      )}

      <section>
        <h2 className="section-label">{t.submit.photo}</h2>
        <p className="mt-2 text-sm text-moss">{t.submit.photoHint}</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={onPick}
          aria-label={t.submit.choosePhoto}
        />

        {photo ? (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              className="aspect-[4/3] w-full rounded-[12px] border border-cream/20 object-cover"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => inputRef.current?.click()}
            >
              {t.submit.changePhoto}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-cream/30 text-cream/70 transition-colors hover:border-cream/60 hover:text-cream"
          >
            <CameraIcon className="size-7" />
            <span className="font-serif text-lg">{t.submit.choosePhoto}</span>
          </button>
        )}

        {photoError && (
          <p role="alert" className="mt-2 text-sm text-amber">
            {photoError}
          </p>
        )}
      </section>

      <section>
        <label htmlFor="caption" className="section-label">
          {t.submit.caption}
        </label>
        <textarea
          id="caption"
          name="caption"
          rows={3}
          maxLength={600}
          placeholder={t.submit.captionPlaceholder}
          className="mt-3 w-full rounded-[12px] border border-cream/20 bg-transparent px-4 py-3 font-serif text-base text-cream placeholder:text-moss/70 focus:border-amber focus:outline-none"
        />
      </section>

      <section>
        <h2 className="section-label">{t.submit.difficulty}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {DIFFICULTY_ORDER.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              aria-pressed={difficulty === level}
              className={cn(
                "flex items-center justify-between rounded-[10px] border px-4 py-3 text-left font-serif transition-colors",
                difficulty === level
                  ? "border-amber bg-amber/15 text-cream"
                  : "border-cream/20 text-cream/80 hover:border-cream/45",
              )}
            >
              {t.difficulty[level]}
              <span className="text-xs tabular-nums text-moss">
                {"▲".repeat(DIFFICULTY_ORDER.length - DIFFICULTY_ORDER.indexOf(level))}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-label">{t.submit.comparison}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMPARISONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setComparison(option)}
              aria-pressed={comparison === option}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                comparison === option
                  ? "border-amber bg-amber/15 text-cream"
                  : "border-cream/20 text-cream/75 hover:border-cream/45",
              )}
            >
              {t.comparison[option]}
            </button>
          ))}
        </div>

        {comparison !== "FIRST" && comparableQuests.length > 0 && (
          <div className="mt-4">
            <label htmlFor="comparedToQuestId" className="text-sm text-moss">
              {t.submit.comparedTo}
            </label>
            <select
              id="comparedToQuestId"
              name="comparedToQuestId"
              className="mt-2 h-11 w-full rounded-[10px] border border-cream/20 bg-forest-card px-3 font-serif text-cream focus:border-amber focus:outline-none"
            >
              {comparableQuests.map((quest) => (
                <option key={quest.id} value={quest.id}>
                  {quest.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <Button type="submit" size="block" disabled={pending || !photo}>
        {pending && <Spinner />}
        {pending ? t.submit.submitting : t.submit.submit}
      </Button>

      <p className="text-center text-xs text-moss">{questTitle}</p>
    </form>
  );
}
