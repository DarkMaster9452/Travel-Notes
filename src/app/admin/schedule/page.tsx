import type { Metadata } from "next";
import Link from "next/link";

import {
  ScheduleCalendar,
  type CalendarSlot,
  type QuestOption,
} from "@/components/admin/schedule-calendar";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import {
  slotLabel,
  slotOpensLabel,
  slotRange,
  slotState,
} from "@/lib/admin/schedule";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";

export const metadata: Metadata = { title: "Schedule · Admin" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "MONTHLY", label: "Monthly" },
  { key: "WEEKLY", label: "Weekly" },
] as const;

/**
 * The calendar.
 *
 * The product's cadence is stated on the landing page and this page obeys it
 * rather than re-opening it: the weekly drops Monday at 06:00, the monthly on
 * the 1st, and there is nowhere here to type an hour because there is no hour
 * to choose. What an admin picks is *which* week or month, and which quest
 * goes in it.
 *
 * Monthly is the first tab because the monthly is the headline quest — the
 * big one — and the weekly is the thing alongside it.
 */
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const period = params.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  const range = slotRange(period);

  const [booked, quests] = await Promise.all([
    db.questSchedule.findMany({
      where: { period, slotKey: { in: range.map((slot) => slot.key) } },
      select: {
        id: true,
        slotKey: true,
        audience: true,
        quest: { select: { id: true, title: true, location: true } },
      },
    }),
    // Only published quests can be booked — the action refuses an unpublished
    // one, so offering it in the picker would only be a trap.
    db.quest.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
      take: 300,
      select: { id: true, title: true, location: true },
    }),
  ]);

  const bySlot = new Map(booked.map((row) => [row.slotKey, row]));

  const slots: CalendarSlot[] = range.map((slot) => {
    const row = bySlot.get(slot.key);
    return {
      key: slot.key,
      label: slotLabel(slot),
      opensLabel: slotOpensLabel(slot),
      state: slotState(slot),
      booked: row
        ? {
            id: row.id,
            questId: row.quest.id,
            questTitle: row.quest.title,
            questLocation: row.quest.location,
            audience: row.audience as "FREE" | "EXPLORER" | "ULTRA",
          }
        : null,
    };
  });

  const options: QuestOption[] = quests;
  const filled = slots.filter((slot) => slot.booked).length;
  const upcomingEmpty = slots.filter((slot) => slot.state === "future" && !slot.booked).length;

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>The calendar</Eyebrow>
          <h1>Schedule.</h1>
          <p>
            The weekly drops Monday at 06:00. The monthly opens on the 1st. You pick which slot
            and which quest — the times aren&apos;t yours to change.
          </p>
        </div>
        <Link href="/admin/quests/new" className="btn btn-ghost btn-sm">
          Write a new quest
        </Link>
      </Reveal>

      <Reveal>
        <Panel flush>
          <PanelHead
            title={period === "MONTHLY" ? "Monthly slots" : "Weekly slots"}
            aside={
              <Tag tone={upcomingEmpty > 0 ? "warm" : "pine"}>
                {upcomingEmpty > 0 ? `${upcomingEmpty} still empty` : "All booked"}
              </Tag>
            }
          />

          <div className="admin-filters">
            <nav aria-label="Cadence">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={`/admin/schedule?period=${tab.key}`}
                  aria-current={tab.key === period ? "page" : undefined}
                  scroll={false}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
            <p className="meta">{filled} scheduled in view</p>
          </div>

          <div className="px-5 py-5">
            <ScheduleCalendar period={period} slots={slots} quests={options} />
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={stagger(1)} className="mt-5">
        <Panel>
          <PanelHead title="How it works" />
          <ul className="cadence-list">
            <li>
              <b>MON</b> The weekly drops at 06:00.
            </li>
            <li>
              <b>SUN</b> The log closes at 23:59.
            </li>
            <li>
              <b>1st</b> The monthly opens — the big one.
            </li>
          </ul>
          <p className="note">
            A slot that has already opened can be read but not changed. One quest per slot: to
            swap it, edit the slot rather than adding a second.
          </p>
        </Panel>
      </Reveal>
    </>
  );
}
