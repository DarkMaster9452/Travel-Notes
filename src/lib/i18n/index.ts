import { cache } from "react";
import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { sk, type Dictionary } from "@/lib/i18n/dictionaries/sk";

export type { Dictionary };
export { fill } from "@/lib/i18n/format";
export type { Locale };

const DICTIONARIES: Record<Locale, Dictionary> = { sk, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * The active locale for this request.
 *
 * Slovak is the product's primary language, so it is the default for everyone;
 * only an explicit choice, remembered in a cookie, switches to English. We
 * deliberately do *not* sniff Accept-Language — a Slovak app opening in English
 * for a visitor whose phone is set to English would be the wrong first
 * impression.
 *
 * Deduped per request so a page and its layouts agree without repeating work.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
});

/** Convenience: locale + dictionary in one call. */
export const getTranslations = cache(async () => {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
});

