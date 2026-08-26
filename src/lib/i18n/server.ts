import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { asLocale, getMessages, type Locale, type Messages } from "@/lib/i18n";

/**
 * Which language this request reads in.
 *
 * Wrapped in React's `cache`, which is the load-bearing part. Five different
 * pages each ran their own `db.displaySettings.findUnique` before this existed,
 * with five different `select`s; a layout, a page and three components all
 * asking again would have made that worse rather than better. `cache` dedupes
 * within a single render pass, so the whole tree costs one indexed read.
 *
 * Signed out, or an account that has never opened the settings page, reads
 * English. The optional `userId` is the seam for anything that runs outside a
 * request — `send()` in `lib/email` takes a user id and no cookies, and will
 * want this when the emails are translated.
 */
export const getLocale = cache(async (userId?: string): Promise<Locale> => {
  const id = userId ?? (await getCurrentUser())?.id;
  if (!id) return "en";

  const display = await db.displaySettings.findUnique({
    where: { userId: id },
    select: { language: true },
  });

  return asLocale(display?.language);
});

/** The dictionary for this request. `const t = await getT()` at the top of a page. */
export const getT = cache(async (userId?: string): Promise<Messages> => {
  return getMessages(await getLocale(userId));
});
