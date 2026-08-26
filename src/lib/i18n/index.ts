import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { sk } from "@/lib/i18n/sk";

/**
 * Three languages, no library.
 *
 * Every i18n package worth using is built around locale in the *URL* — a
 * `[locale]` segment or a middleware that negotiates one. Here the locale
 * lives on the account, in `DisplaySettings.language`, there is no middleware
 * in this repo at all, and adding a locale segment would restructure every
 * route and force an edit to the root layout, which also wraps the marketing
 * site. So: a plain typed object, which costs nothing and buys the thing that
 * actually matters at three languages.
 *
 * `en` is the source of truth and `Messages` is its shape, so `sk` and `de`
 * are checked for completeness by the compiler. A missing or misspelled key is
 * a build error, not a string that silently falls back to English in
 * production and is noticed by a customer.
 *
 * Interpolation is typed functions rather than `{placeholder}` strings:
 *
 *     daysGone: (gone: number, total: number) => `${gone} of ${total} days gone`
 *
 * which means TypeScript checks the arguments at every call site and every
 * translation has to accept the same ones. No parser, and no format string
 * that quietly goes stale when the code around it changes.
 */

export type Locale = "en" | "sk" | "de";

export type Messages = typeof en;

/** In the order the picker shows them, English first because it is primary. */
export const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "sk", label: "Slovenčina" },
  { id: "de", label: "Deutsch" },
];

const DICTIONARIES: Record<Locale, Messages> = { en, sk, de };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "sk" || value === "de";
}

/** Anything unrecognised reads English rather than throwing at somebody. */
export function getMessages(locale: string | null | undefined): Messages {
  return isLocale(locale) ? DICTIONARIES[locale] : en;
}

export function asLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : "en";
}
