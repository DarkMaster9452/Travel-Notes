"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLocale, LOCALE_COOKIE, LOCALE_MAX_AGE } from "@/lib/i18n/config";

/**
 * Remember the visitor's language choice.
 *
 * The locale lives in a cookie rather than the URL, so every route keeps one
 * canonical path. If you later want per-language URLs for SEO, this is the
 * seam to replace with a `[locale]` segment.
 */
export async function setLocaleAction(value: string): Promise<void> {
  if (!isLocale(value)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false, // read by nothing sensitive; keeps client-side switching simple
  });

  revalidatePath("/", "layout");
}
