"use client";

import * as React from "react";
import { useActionState } from "react";

import { updateCosmeticsAction, type ProfileState } from "@/app/(app)/profile/actions";
import { Icon, IconCheck } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/primitives";
import {
  ACCENTS,
  AVATAR_STYLES,
  BANNERS,
  accentOf,
  avatarStyleOf,
  bannerOf,
} from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

/**
 * Cosmetic customisation, with the preview wired to local state so a choice is
 * visible before it is saved. Everything is re-validated against the same
 * preset lists on the server.
 */
export function CosmeticsForm({
  name,
  initialAccent,
  initialAvatarStyle,
  initialBanner,
  initialTitle,
  earnedTitles,
}: {
  name: string;
  initialAccent: string;
  initialAvatarStyle: string;
  initialBanner: string;
  initialTitle: string | null;
  earnedTitles: string[];
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateCosmeticsAction,
    undefined,
  );

  const [accent, setAccent] = React.useState(initialAccent);
  const [avatarStyle, setAvatarStyle] = React.useState(initialAvatarStyle);
  const [banner, setBanner] = React.useState(initialBanner);
  const [title, setTitle] = React.useState(initialTitle ?? "");

  const accentPreset = accentOf(accent);
  const avatarPreset = avatarStyleOf(avatarStyle);
  const bannerPreset = bannerOf(banner);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="accentColor" value={accent} />
      <input type="hidden" name="avatarStyle" value={avatarStyle} />
      <input type="hidden" name="bannerStyle" value={banner} />
      <input type="hidden" name="explorerTitle" value={title} />

      {/* Live preview */}
      <div className="overflow-hidden rounded-xl border border-line">
        <div className={cn("h-24", bannerPreset.className)} />
        <div className="flex items-end gap-4 px-5 pb-5">
          <span
            aria-hidden="true"
            className={cn(
              "-mt-8 flex size-16 items-center justify-center rounded-full ring-4 ring-card",
              accentPreset.bg,
              "text-paper",
            )}
          >
            {avatarPreset.icon ? (
              <Icon name={avatarPreset.icon} size={28} />
            ) : (
              <span className="font-display text-2xl font-extrabold">{initial}</span>
            )}
          </span>
          <div className="pb-1">
            <p className="font-display text-xl font-extrabold">{name}</p>
            <p className={cn("text-sm font-medium", accentPreset.text)}>
              {title || "No title selected"}
            </p>
          </div>
        </div>
      </div>

      <Field label="Accent colour" error={state?.errors?.accentColor}>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setAccent(option.id)}
              aria-pressed={accent === option.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                accent === option.id
                  ? "border-ink bg-ink/5 font-medium text-ink"
                  : "border-line text-muted hover:border-ink/40",
              )}
            >
              <span aria-hidden="true" className={cn("size-4 rounded-full", option.swatch)} />
              {option.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Avatar" error={state?.errors?.avatarStyle}>
        <div className="flex flex-wrap gap-2">
          {AVATAR_STYLES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setAvatarStyle(option.id)}
              aria-pressed={avatarStyle === option.id}
              className={cn(
                "flex size-14 items-center justify-center rounded-full border-2 transition-colors",
                avatarStyle === option.id
                  ? cn("border-ink", accentPreset.bg, "text-paper")
                  : "border-line text-muted hover:border-ink/40",
              )}
              title={option.label}
            >
              {option.icon ? (
                <Icon name={option.icon} size={22} />
              ) : (
                <span className="font-display text-lg font-extrabold">{initial}</span>
              )}
              <span className="sr-only">{option.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Profile banner" error={state?.errors?.bannerStyle}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BANNERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setBanner(option.id)}
              aria-pressed={banner === option.id}
              className={cn(
                "relative h-14 overflow-hidden rounded-lg border-2 transition-colors",
                option.className,
                banner === option.id ? "border-ink" : "border-transparent hover:border-ink/30",
              )}
            >
              {banner === option.id && (
                <span className="absolute right-1.5 top-1.5 text-paper" aria-hidden="true">
                  <IconCheck size={16} />
                </span>
              )}
              <span className="sr-only">{option.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Explorer title"
        hint={
          earnedTitles.length > 0
            ? "Earned from achievements."
            : "Finish a quest to earn your first title."
        }
        error={state?.errors?.explorerTitle}
      >
        <div className="flex flex-wrap gap-2">
          <TitleChip active={title === ""} onClick={() => setTitle("")}>
            None
          </TitleChip>
          {earnedTitles.map((earned) => (
            <TitleChip key={earned} active={title === earned} onClick={() => setTitle(earned)}>
              {earned}
            </TitleChip>
          ))}
        </div>
      </Field>

      <div className="flex items-center gap-4 border-t border-line pt-6">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-lg bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-moss disabled:pointer-events-none disabled:opacity-45"
        >
          {pending && <Spinner />}
          {pending ? "Saving" : "Save changes"}
        </button>
        {state?.saved && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-moss">
            <IconCheck size={16} /> Saved
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted">
        {label}
      </legend>
      <div className="mt-3">{children}</div>
      {hint && !error && <p className="mt-2 text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs text-ember">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function TitleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm transition-colors",
        active
          ? "border-ink bg-ink/5 font-medium text-ink"
          : "border-line text-muted hover:border-ink/40",
      )}
    >
      {children}
    </button>
  );
}
