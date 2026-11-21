"use server";

import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

/**
 * The language switcher on the landing page, login, signup and the legal
 * pages. The choice is remembered in a cookie for a year; a signed-in member
 * who uses it has their account setting changed too, so the app and the
 * marketing pages never disagree about what they speak.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const user = await getCurrentUser();
  if (user) {
    await db.displaySettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, language: locale },
      update: { language: locale },
    });
  }
}
