import type { SchedulePeriod } from "@prisma/client";

/**
 * Slot arithmetic for the schedule.
 *
 * The product states its own cadence on the landing page and it is not
 * negotiable:
 *
 *   MON  the weekly drops at 06:00
 *   SUN  the log closes at 23:59
 *   1st  the monthly opens — the big one
 *
 * So a schedule is not "pick a date and time". It is "pick which week" or
 * "pick which month", and the instant is derived from that. There is nowhere
 * in the admin UI to type an hour, because there is no hour to choose: a
 * weekly that opened on a Wednesday afternoon would be a different product.
 *
 * Everything here works in local server time deliberately — the cadence is a
 * promise about the reader's Monday morning, not about UTC.
 */

/** The hour both cadences open at. */
export const OPEN_HOUR = 6;

export type Slot = {
  period: SchedulePeriod;
  /** `2026-W34` for a weekly, `2026-09` for a monthly. */
  key: string;
  /** Monday 06:00, or the 1st at 06:00. */
  openAt: Date;
  /** The instant the next slot opens — "SUN, the log closes at 23:59". */
  closeAt: Date;
};

/* -------------------------------------------------------------------------- */
/* Weekly                                                                      */
/* -------------------------------------------------------------------------- */

/** The Monday of the week `date` falls in, at 00:00 local. */
export function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay(): 0 = Sunday. Shift so Monday is 0 and Sunday is 6.
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return monday;
}

/**
 * ISO-8601 week key, e.g. `2026-W34`.
 *
 * Matches `lib/quest/featured.ts` exactly — the two have to agree about what
 * "week 34" means or a scheduled quest would land in a week the dashboard
 * calls something else.
 */
export function isoWeekKey(date: Date): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
  const week =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Calendar month key, e.g. `2026-08`. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Slots                                                                       */
/* -------------------------------------------------------------------------- */

/** The weekly slot containing `date`. */
export function weeklySlot(date: Date): Slot {
  const monday = mondayOf(date);
  const openAt = new Date(monday);
  openAt.setHours(OPEN_HOUR, 0, 0, 0);

  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  nextMonday.setHours(OPEN_HOUR, 0, 0, 0);

  return { period: "WEEKLY", key: isoWeekKey(monday), openAt, closeAt: nextMonday };
}

/** The monthly slot containing `date`. */
export function monthlySlot(date: Date): Slot {
  const openAt = new Date(date.getFullYear(), date.getMonth(), 1, OPEN_HOUR, 0, 0, 0);
  const closeAt = new Date(date.getFullYear(), date.getMonth() + 1, 1, OPEN_HOUR, 0, 0, 0);
  return { period: "MONTHLY", key: monthKey(openAt), openAt, closeAt };
}

export function slotFor(period: SchedulePeriod, date: Date): Slot {
  return period === "WEEKLY" ? weeklySlot(date) : monthlySlot(date);
}

/**
 * Rebuild a slot from its key alone.
 *
 * The form posts a key, not a date, so the server has to be able to derive
 * the instants from it rather than trusting anything the client sends about
 * when a slot opens. Returns null for a key it cannot parse, which is how an
 * invalid one is rejected.
 */
export function slotFromKey(period: SchedulePeriod, key: string): Slot | null {
  if (period === "MONTHLY") {
    const match = /^(\d{4})-(\d{2})$/.exec(key);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return monthlySlot(new Date(year, month - 1, 1));
  }

  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  // Walk out from 4 January, which ISO-8601 guarantees is in week 1.
  const jan4 = new Date(year, 0, 4);
  const firstMonday = mondayOf(jan4);
  const monday = new Date(firstMonday);
  monday.setDate(monday.getDate() + (week - 1) * 7);

  const slot = weeklySlot(monday);
  // A 53rd week that doesn't exist in this year rolls into the next one, and
  // the round-trip is what catches it.
  return slot.key === key ? slot : null;
}

/* -------------------------------------------------------------------------- */
/* Calendar                                                                    */
/* -------------------------------------------------------------------------- */

export type SlotState = "past" | "live" | "future";

export function slotState(slot: Slot, now = new Date()): SlotState {
  if (now >= slot.closeAt) return "past";
  if (now >= slot.openAt) return "live";
  return "future";
}

/** Human label: "Week 34" / "September 2026". */
export function slotLabel(slot: Slot): string {
  if (slot.period === "WEEKLY") return `Week ${slot.key.split("-W")[1] ?? slot.key}`;
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(slot.openAt);
}

/** "Mon 24 Aug, 06:00" — the instant a slot actually opens, spelled out. */
export function slotOpensLabel(slot: Slot): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(slot.openAt);
}

/**
 * The slots a calendar should show: a few behind, the current one, and a
 * run ahead — enough to book a season without turning into an infinite
 * scroll of empty weeks.
 */
export function slotRange(
  period: SchedulePeriod,
  now = new Date(),
  { back = 2, forward = 15 }: { back?: number; forward?: number } = {},
): Slot[] {
  const slots: Slot[] = [];
  for (let offset = -back; offset <= forward; offset += 1) {
    const cursor = new Date(now);
    if (period === "WEEKLY") cursor.setDate(cursor.getDate() + offset * 7);
    else cursor.setMonth(cursor.getMonth() + offset, 1);
    slots.push(slotFor(period, cursor));
  }
  return slots;
}
