/**
 * Locale configuration.
 *
 * Slovak is the primary language — it is the default for anyone who hasn't
 * chosen otherwise, and the source of truth for the dictionary's shape.
 * English is the secondary translation.
 *
 * Safe to import from client components: no secrets, no server APIs.
 */

export const LOCALES = ["sk", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "sk";

/** Cookie the chosen language is remembered in. */
export const LOCALE_COOKIE = "sq_locale";

export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<Locale, { short: string; full: string }> = {
  sk: { short: "SK", full: "Slovenčina" },
  en: { short: "EN", full: "English" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Pick the best locale from an Accept-Language header. Only used for a
 * visitor's very first request, before they've expressed a preference.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        tag: (tag ?? "").trim().toLowerCase(),
        quality: q ? Number.parseFloat(q.split("=")[1] ?? "1") : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base === "sk" || base === "cs") return "sk"; // Czech readers get Slovak
    if (base === "en") return "en";
  }

  return DEFAULT_LOCALE;
}
