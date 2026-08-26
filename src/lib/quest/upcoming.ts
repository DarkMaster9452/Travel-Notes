import "server-only";

import type { SchedulePeriod } from "@prisma/client";

import {
  slotDatesLabel,
  slotFor,
  slotLabel,
  slotOpensLabel,
  slotState,
  type Slot,
} from "@/lib/admin/schedule";
import { db } from "@/lib/db";

/**
 * What is coming, and what is still shut.
 *
 * The dashboard's "What's coming" card answers two different questions with
 * two different shapes: the slots that are *open* get a tile with the quest in
 * them, and the ones ahead get one line and a padlock. The difference is not
 * decoration — a future slot deliberately does not say what is in it, because
 * knowing next week's quest a week early is the one thing the cadence is for.
 *
 * So this returns the booked title only for slots that have actually opened.
 * A future slot carries its label and its opening time and nothing else, even
 * when a quest is already booked into it.
 */

export type OpenSlot = {
  key: string;
  period: SchedulePeriod;
  /** "Week 34" / "September 2026". */
  label: string;
  /** "1–30 Sep 2026". */
  dates: string;
  /** The booked quest, when an admin has booked one. */
  title: string | null;
  questId: string | null;
  where: string | null;
  /** "Open now · filed" and the like — what the member should read. */
  state: string;
  closeAt: Date;
};

export type SealedSlot = {
  key: string;
  period: SchedulePeriod;
  /** "Week 35 is sealed until Monday 06:00". */
  text: string;
  /** "Mon 31 Aug". */
  when: string;
};

const WHEN = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** The weekly and monthly slots that are open right now. */
export async function getOpenSlots(now = new Date()): Promise<OpenSlot[]> {
  const slots: { period: SchedulePeriod; slot: Slot }[] = [
    { period: "MONTHLY", slot: slotFor("MONTHLY", now) },
    { period: "WEEKLY", slot: slotFor("WEEKLY", now) },
  ];

  const booked = await db.questSchedule.findMany({
    where: {
      OR: slots.map(({ period, slot }) => ({ period, slotKey: slot.key })),
    },
    select: {
      period: true,
      slotKey: true,
      quest: { select: { id: true, title: true, location: true, region: true } },
    },
  });

  const bySlot = new Map(booked.map((row) => [`${row.period}:${row.slotKey}`, row]));

  return slots.map(({ period, slot }) => {
    const row = bySlot.get(`${period}:${slot.key}`);
    return {
      key: slot.key,
      period,
      label: slotLabel(slot),
      dates: slotDatesLabel(slot),
      title: row?.quest.title ?? null,
      questId: row?.quest.id ?? null,
      where: row ? `${row.quest.location} · ${row.quest.region}` : null,
      state: row ? "Open now" : "Generated for you when you open it",
      closeAt: slot.closeAt,
    };
  });
}

/**
 * The run of slots ahead, sealed.
 *
 * Weeks and the next month interleaved by opening time, so the list reads as
 * one calendar rather than as two columns of the same future.
 */
export async function getSealedSlots(count = 3, now = new Date()): Promise<SealedSlot[]> {
  const ahead: { period: SchedulePeriod; slot: Slot }[] = [];

  for (let offset = 1; offset <= count; offset += 1) {
    const cursor = new Date(now);
    cursor.setDate(cursor.getDate() + offset * 7);
    ahead.push({ period: "WEEKLY", slot: slotFor("WEEKLY", cursor) });
  }

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  ahead.push({ period: "MONTHLY", slot: slotFor("MONTHLY", nextMonth) });

  return ahead
    .filter(({ slot }) => slotState(slot, now) === "future")
    .sort((a, b) => a.slot.openAt.getTime() - b.slot.openAt.getTime())
    .slice(0, count)
    .map(({ period, slot }) => ({
      key: slot.key,
      period,
      text: `${slotLabel(slot)} is sealed until ${slotOpensLabel(slot)}`,
      when: WHEN.format(slot.openAt),
    }));
}
