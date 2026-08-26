import type { Locale } from "@/lib/i18n";

/**
 * Dates, numbers and money in the reader's language.
 *
 * Everything in this app used to build its formatters as module-scope
 * constants — `const DATE = new Intl.DateTimeFormat("en-GB", …)` at the top of
 * forty-odd files. That is evaluated once at import, which is exactly why it
 * cannot take a per-request locale: by the time a request knows who is asking,
 * the formatter has existed for minutes.
 *
 * So these are functions. Constructing an `Intl.DateTimeFormat` is genuinely
 * expensive — enough that doing it per row of a table shows up — so each one
 * is built once per (locale, shape) pair and kept.
 */

/** BCP-47 tags. `en` means en-GB here: metric, day-first, this is a UK product. */
const TAGS: Record<Locale, string> = {
  en: "en-GB",
  sk: "sk-SK",
  de: "de-DE",
};

export function tagFor(locale: Locale): string {
  return TAGS[locale] ?? TAGS.en;
}

export type DateShape = "day" | "dayMonth" | "full" | "monthYear" | "month" | "weekday" | "time";

const DATE_SHAPES: Record<DateShape, Intl.DateTimeFormatOptions> = {
  /** "26 Aug 2026" */
  day: { day: "numeric", month: "short", year: "numeric" },
  /** "26 August" */
  dayMonth: { day: "numeric", month: "long" },
  /** "Wednesday 26 August 2026" */
  full: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  /** "August 2026" */
  monthYear: { month: "long", year: "numeric" },
  /** "Aug" */
  month: { month: "short" },
  /** "Wednesday" */
  weekday: { weekday: "long" },
  /** "06:00" */
  time: { hour: "2-digit", minute: "2-digit" },
};

const dateCache = new Map<string, Intl.DateTimeFormat>();
const numberCache = new Map<string, Intl.NumberFormat>();
const pluralCache = new Map<string, Intl.PluralRules>();

export function dateFormatter(locale: Locale, shape: DateShape): Intl.DateTimeFormat {
  const key = `${locale}:${shape}`;
  let found = dateCache.get(key);
  if (!found) {
    found = new Intl.DateTimeFormat(tagFor(locale), DATE_SHAPES[shape]);
    dateCache.set(key, found);
  }
  return found;
}

export function formatDate(locale: Locale, value: Date | string, shape: DateShape = "day"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter(locale, shape).format(date);
}

export function formatNumber(locale: Locale, value: number): string {
  let found = numberCache.get(locale);
  if (!found) {
    found = new Intl.NumberFormat(tagFor(locale));
    numberCache.set(locale, found);
  }
  return found.format(value);
}

/**
 * Money, in euros, written the way the reader writes money.
 *
 * The currency does not change with the language — the price is in euros
 * wherever you are reading from — but `€11.00` and `11,00 €` are the same
 * amount and only one of them looks like a price to any given reader.
 */
export function formatMoney(locale: Locale, cents: number): string {
  const key = `${locale}:eur`;
  let found = numberCache.get(key);
  if (!found) {
    found = new Intl.NumberFormat(tagFor(locale), {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    });
    numberCache.set(key, found);
  }
  return found.format(cents / 100);
}

/**
 * The plural forms a language actually has.
 *
 * English has two, German has two, and Slovak has three — one quest, dva/tri/
 * štyri questy, päť questov. `pluralise()` in `lib/utils` appends an "s", which
 * is right for exactly one of the three languages this app now speaks.
 *
 * `Intl.PluralRules` is in the platform and knows all of this already, so the
 * only thing a dictionary has to supply is the words.
 */
export type PluralForms = {
  one: string;
  /** Slovak's 2–4. Falls back to `other` where a language has no such form. */
  few?: string;
  many?: string;
  other: string;
};

export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const key = locale;
  let rules = pluralCache.get(key);
  if (!rules) {
    rules = new Intl.PluralRules(tagFor(locale));
    pluralCache.set(key, rules);
  }

  const category = rules.select(count);
  const word =
    (category === "one" && forms.one) ||
    (category === "few" && (forms.few ?? forms.other)) ||
    (category === "many" && (forms.many ?? forms.other)) ||
    forms.other;

  return word.replace("#", formatNumber(locale, count));
}
