"use client";

import { createContext, useContext, useMemo } from "react";

import { getMessages, type Locale, type Messages } from "@/lib/i18n";

/**
 * The language, for the two thirds of this design system that runs on the
 * client.
 *
 * The provider takes the locale *string* and looks the dictionary up itself,
 * rather than being handed the resolved messages as a prop. That is not a
 * style choice: the dictionaries contain functions, functions cannot cross the
 * server/client boundary, and passing the message object down from a server
 * layout would throw at render. Passing three characters and resolving on this
 * side sidesteps it and keeps one dictionary shape on both.
 *
 * The cost is that all three dictionaries end up in the client bundle. At this
 * string count that is a few kilobytes gzipped, and if it ever stops being
 * true the fix is a dynamic import per locale rather than a different design.
 */
type Value = { locale: Locale; t: Messages };

const I18nContext = createContext<Value | null>(null);

export function SqI18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: getMessages(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Falls back to English rather than throwing when there is no provider above.
 *
 * A component rendered outside the member shell — a toast from an error
 * boundary, something in a story — should show English words, not a blank
 * screen. The guarantee that matters is compile-time completeness, and that
 * one holds regardless.
 */
export function useI18n(): Value {
  return useContext(I18nContext) ?? { locale: "en", t: getMessages("en") };
}

/** `const t = useT()` — the common case, where only the words are wanted. */
export function useT(): Messages {
  return useI18n().t;
}
