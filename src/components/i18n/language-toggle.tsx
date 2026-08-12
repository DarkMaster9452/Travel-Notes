"use client";

import * as React from "react";

import { setLocaleAction } from "@/app/locale-actions";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * SK / EN switch.
 *
 * Built as a segmented control rather than a dropdown: with exactly two
 * languages a dropdown hides half the choice behind a click, and the flat
 * two-cell block matches the hairline-and-uppercase language of the rest of
 * the interface.
 */
export function LanguageToggle({
  current,
  tone = "dark",
  className,
}: {
  current: Locale;
  tone?: "dark" | "light";
  className?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  // Optimistic: the label flips immediately and is dropped once the server
  // sends the new locale back, so no effect is needed to resynchronise.
  const [optimistic, setOptimistic] = React.useState<Locale | null>(null);
  const shown = pending && optimistic ? optimistic : current;

  const select = (locale: Locale) => {
    if (locale === shown || pending) return;
    setOptimistic(locale);
    startTransition(async () => {
      await setLocaleAction(locale);
    });
  };

  return (
    <div
      className={cn(
        "inline-flex border",
        tone === "light" ? "border-paper/35" : "border-ink/25",
        pending && "opacity-60",
        className,
      )}
      role="group"
      aria-label={tone === "light" ? "Language" : "Jazyk / Language"}
    >
      {LOCALES.map((locale) => {
        const active = shown === locale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => select(locale)}
            aria-pressed={active}
            lang={locale}
            className={cn(
              "px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] transition-colors",
              active
                ? tone === "light"
                  ? "bg-paper text-ink"
                  : "bg-ink text-paper"
                : tone === "light"
                  ? "text-paper/60 hover:text-paper"
                  : "text-stone hover:text-ink",
            )}
          >
            {LOCALE_LABELS[locale].short}
          </button>
        );
      })}
    </div>
  );
}
