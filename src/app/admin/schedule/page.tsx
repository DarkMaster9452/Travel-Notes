import type { Metadata } from "next";

import { SqSegmentedLinks } from "@/components/sq/controls";
import { SqSlotEditor, type QuestOption, type SlotRow } from "@/components/sq/slot-editor";
import { PageHeader, Tag } from "@/components/sq/ui";
import { slotDatesLabel, slotLabel, slotOpensLabel, slotRange, slotState } from "@/lib/admin/schedule";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Schedule · Admin" };
export const dynamic = "force-dynamic";

/**
 * The calendar.
 *
 * The cadence is stated on the landing page and this screen obeys it rather
 * than re-opening it: the weekly drops Monday at 06:00 and the monthly on the
 * 1st, and there is nowhere here to type an hour because there is no hour to
 * choose. Monthly leads, because the monthly is the headline.
 */
export default async function AdminSchedulePage({
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
        quest: { select: { id: true, title: true, location: true, region: true } },
      },
    }),
    db.quest.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
      take: 300,
      select: { id: true, title: true, location: true, region: true },
    }),
  ]);

  const bySlot = new Map(booked.map((row) => [row.slotKey, row]));

  const slots: SlotRow[] = range.map((slot) => {
    const row = bySlot.get(slot.key);
    return {
      key: slot.key,
      label: slotLabel(slot),
      opensLabel: slotOpensLabel(slot),
      dates: slotDatesLabel(slot),
      state: slotState(slot),
      booking: row
        ? {
            id: row.id,
            questId: row.quest.id,
            title: row.quest.title,
            where: `${row.quest.location} · ${row.quest.region}`,
            audience: row.audience,
          }
        : null,
    };
  });

  const options: QuestOption[] = quests.map((quest) => ({
    id: quest.id,
    title: quest.title,
    where: `${quest.location} · ${quest.region}`,
  }));

  const empty = slots.filter((slot) => slot.state !== "past" && !slot.booking).length;

  return (
    <>
      <PageHeader
        kicker="The cadence"
        title="Schedule"
        lede="One quest per slot. The weekly opens Monday at 06:00, the monthly on the 1st — the instants are derived from the slot, never typed."
        right={
          <SqSegmentedLinks
            label="Cadence"
            active={period}
            options={[
              { key: "MONTHLY", label: "Monthly", href: "/admin/schedule" },
              { key: "WEEKLY", label: "Weekly", href: "/admin/schedule?period=WEEKLY" },
            ]}
          />
        }
      />

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            {period === "MONTHLY" ? "Months" : "Weeks"}
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10.5, letterSpacing: "0.08em" }}>
            {empty === 0 ? "Every slot ahead is booked" : `${empty} slots ahead still empty`}
          </span>
        </div>

        <ul className="sq-stagger">
          {slots.map((slot, index) => (
            <li
              key={slot.key}
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1fr) auto auto auto",
                gap: 14,
                alignItems: "center",
                padding: "13px 22px",
                borderTop: "1px solid var(--line-2)",
                background: slot.state === "live" ? "var(--paper-2)" : "transparent",
                opacity: slot.state === "past" ? 0.62 : 1,
                ["--i" as string]: index,
              }}
            >
              <span className="sq-mono" style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                {slot.key}
              </span>

              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 15, fontWeight: 600 }}>
                  {slot.booking ? slot.booking.title : `${slot.label} — nothing booked`}
                </b>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {slot.booking ? slot.booking.where : slot.dates} · opens {slot.opensLabel}
                </span>
              </span>

              {slot.booking && slot.booking.audience !== "FREE" ? (
                <Tag small>{slot.booking.audience}</Tag>
              ) : (
                <span />
              )}

              <Tag tone={slot.state === "live" ? "stamp" : "plain"} small>
                {slot.state === "live" ? "OPEN" : slot.state === "past" ? "CLOSED" : "SEALED"}
              </Tag>

              <SqSlotEditor period={period} slot={slot} quests={options} />
            </li>
          ))}
        </ul>
      </section>

      <section className="sq-tinted sq-pad-sm" style={{ marginTop: 16 }}>
        <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 10 }}>
          What a slot means
        </h2>
        <ul style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, lineHeight: 1.55 }}>
          <li>A booked slot is the same quest for everybody. An empty one is generated per account.</li>
          <li>A slot aimed above somebody&rsquo;s plan is skipped for them, and the generator fills the gap.</li>
          <li>Proof filed against a slot is stamped at filing time and keeps that stamp for good.</li>
          <li>Clearing a slot after it has opened does not un-stamp proof already filed against it.</li>
        </ul>
      </section>
    </>
  );
}
