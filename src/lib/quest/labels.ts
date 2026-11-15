import type { SchedulePeriod } from "@prisma/client";

import type { Locale, Messages } from "@/lib/i18n";
import { formatDate, tagFor } from "@/lib/i18n/format";

/**
 * Slot labels in the reader's language.
 *
 * `lib/admin/schedule` labels slots in English for the panel. The customer
 * side reads three languages, so the same facts are worded here: "Týždeň 46",
 * "November 2026", "9. – 15. 11. 2026".
 */
type SlotLike = { period: SchedulePeriod; key: string; openAt: Date };

/** "Week 46" · "November 2026". */
export function slotTitle(slot: SlotLike, locale: Locale, t: Messages): string {
  if (slot.period === "WEEKLY") return t.trail.weekLabel(slot.key.split("-W")[1] ?? slot.key);
  return capitalise(formatDate(locale, slot.openAt, "monthYear"));
}

/** "November" — the month a monthly slot belongs to. */
export function slotMonth(slot: SlotLike, locale: Locale): string {
  return capitalise(new Intl.DateTimeFormat(tagFor(locale), { month: "long" }).format(slot.openAt));
}

/** The days a slot runs over: "9–15 Nov 2026". `closeAt` is the next slot's opening. */
export function slotDates(slot: { openAt: Date; closeAt: Date }, locale: Locale): string {
  const last = new Date(slot.closeAt.getTime() - 24 * 60 * 60 * 1000);
  const format = new Intl.DateTimeFormat(tagFor(locale), { day: "numeric", month: "short", year: "numeric" });
  return format.formatRange(slot.openAt, last);
}

/** Month names are lower-case in Slovak; a label that opens a line is not. */
function capitalise(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
