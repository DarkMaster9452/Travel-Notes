import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getMessages, isLocale, type Locale, type Messages } from "@/lib/i18n";
import type { Units } from "@/lib/i18n/units";

/**
 * Which language this request reads in.
 *
 * Signed in, it is the account's own setting (`DisplaySettings.language`).
 * Signed out — the landing page, login, signup, the legal pages — it is the
 * visitor's choice from the language switcher (a cookie), then whatever their
 * browser asks for, then Slovak, which is where the product lives.
 *
 * Wrapped in React's `cache`, which is the load-bearing part: a layout, a page
 * and three components all asking again costs one indexed read per request.
 *
 * The optional `userId` is the seam for anything that runs outside a request —
 * `send()` in `lib/email` takes a user id and no cookies.
 */

/** The visitor's explicit choice. Set by `setLocaleAction`, read here. */
export const LOCALE_COOKIE = "sq_locale";

/** Where the product lives; what a visitor reads when nothing says otherwise. */
export const DEFAULT_LOCALE: Locale = "sk";

/**
 * The first language in `Accept-Language` this product speaks. Czech readers
 * get Slovak rather than English: the two are mutually intelligible.
 */
export function negotiateLocale(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.q) && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of wanted) {
    const primary = tag.split("-")[0];
    if (primary === "cs") return "sk";
    if (isLocale(primary)) return primary;
  }
  return null;
}

/** Cookie, then the browser, then the default. Never throws outside a request. */
async function visitorLocale(): Promise<Locale> {
  try {
    const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(cookie)) return cookie;
    return negotiateLocale((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
  } catch {
    // No request scope (a scheduled job, a script): there is no visitor to ask.
    return "en";
  }
}

/** One read of the account's display row per request, shared by everything below. */
const getDisplayRow = cache(async (userId: string) => {
  return db.displaySettings.findUnique({
    where: { userId },
    select: { language: true, units: true },
  });
});

export const getLocale = cache(async (userId?: string): Promise<Locale> => {
  const id = userId ?? (await getCurrentUser())?.id;
  if (!id) return visitorLocale();

  // An account that has never saved its display settings has no row yet; it
  // reads in whatever language the person arrived in.
  const display = await getDisplayRow(id);
  return isLocale(display?.language) ? display.language : visitorLocale();
});

/** Kilometres and metres, or miles and feet. Signed out is always metric. */
export const getUnits = cache(async (userId?: string): Promise<Units> => {
  const id = userId ?? (await getCurrentUser())?.id;
  if (!id) return "METRIC";
  return (await getDisplayRow(id))?.units ?? "METRIC";
});

/** The dictionary for this request. `const t = await getT()` at the top of a page. */
export const getT = cache(async (userId?: string): Promise<Messages> => {
  return getMessages(await getLocale(userId));
});

/** Everything a page needs to write words and figures: `{ t, locale, units }`. */
export async function getReader(userId?: string): Promise<{ t: Messages; locale: Locale; units: Units }> {
  const [locale, units] = await Promise.all([getLocale(userId), getUnits(userId)]);
  return { t: getMessages(locale), locale, units };
}
