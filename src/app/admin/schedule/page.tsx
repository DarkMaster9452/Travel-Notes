import type { Metadata } from "next";

import { SqSegmentedLinks } from "@/components/sq/controls";
import { SqSlotEditor, type QuestOption, type SlotRow } from "@/components/sq/slot-editor";
import { PageHeader, Tag } from "@/components/sq/ui";
import {
  slotDatesLabel,
  slotLabel,
  slotOpensLabel,
  slotRange,
  slotState,
} from "@/lib/admin/schedule";
import { requireRank } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Schedule · Admin" };
export const dynamic = "force-dynamic";

const OPENED = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

const AUDIENCE_LABEL: Record<string, string> = {
  FREE: "Everyone",
  EXPLORER: "Explorer and up",
  ULTRA: "Ultra only",
};

/**
 * The calendar.
 *
 * A board rather than a list: a schedule is a shape you read at a glance —
 * where the gaps are, which one is running — and a column of rows makes every
 * slot look equally urgent. The open slot is the only one in stamp ink,
 * because it is the only one anybody is walking right now.
 *
 * The cadence itself is not editable anywhere. The weekly drops Monday at
 * 06:00 and the monthly on the 1st, so what the desk picks is *which* quest
 * goes in a slot that already exists — and once a slot has opened, not even
 * that: an opened slot is read-only, because people are already out on it.
 */
export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireRank("WRITER");
  const params = await searchParams;
  const period = params.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  const now = new Date();
  const range = slotRange(period, now, period === "MONTHLY" ? { back: 8, forward: 5 } : { back: 4, forward: 8 });

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
      state: slotState(slot, now),
      openAt: slot.openAt.toISOString(),
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

  const openable = slots.filter((slot) => slot.state === "future");
  const empty = openable.filter((slot) => !slot.booking).length;
  const first = slots[0];
  const last = slots[slots.length - 1];

  return (
    <>
      <PageHeader
        kicker="The calendar"
        title="Schedule"
        lede={
          period === "MONTHLY"
            ? "The monthly opens on the 1st at 06:00. You pick which slot and which quest — the times aren't yours to change."
            : "The weekly drops Monday at 06:00. You pick which slot and which quest — the times aren't yours to change."
        }
      />

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <SqSegmentedLinks
            label="Cadence"
            active={period}
            options={[
              { key: "MONTHLY", label: "Monthly", href: "/admin/schedule" },
              { key: "WEEKLY", label: "Weekly", href: "/admin/schedule?period=WEEKLY" },
            ]}
          />
          <Tag tone={empty > 0 ? "stamp" : "green"} small>
            {empty === 0 ? "Every slot ahead is booked" : `${empty} still empty`} ·{" "}
            {first?.label} → {last?.label}
          </Tag>
        </div>

        <div className="sq-slot-grid sq-stagger">
          {slots.map((slot, index) => (
            <SlotCard key={slot.key} slot={slot} quests={options} period={period} index={index} />
          ))}
        </div>
      </section>

      <section className="sq-grid sq-grid-fit-md" style={{ marginTop: 16, alignItems: "start" }}>
        <article className="sq-tinted sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 14 }}>
            The cadence
          </h2>
          <ul>
            {[
              { k: "Mon", text: "The weekly drops at 06:00." },
              { k: "Sun", text: "The weekly log closes at 23:59." },
              { k: "1st", text: "The monthly opens at 06:00." },
              { k: "Last", text: "The monthly log closes with the month." },
            ].map((line) => (
              <li
                key={line.k}
                style={{
                  display: "grid",
                  gridTemplateColumns: "54px minmax(0,1fr)",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "11px 0",
                  borderTop: "1px solid var(--line-2)",
                  fontSize: 13.5,
                }}
              >
                <span
                  className="sq-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--moss)",
                  }}
                >
                  {line.k}
                </span>
                <span>{line.text}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="sq-card sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 10 }}>
            A slot that has opened is read-only
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)", marginBottom: 12 }}>
            One quest per slot, and only a published quest can be booked into one. Swapping the
            quest under people who are already walking it is not an edit, it is a different quest —
            so once a slot opens, the booking is fixed.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
            An empty slot is not a gap: it is generated per account instead, against that member&rsquo;s
            own preferences. Booking one is how the whole product does the same quest at once.
          </p>
        </article>
      </section>
    </>
  );
}

function SlotCard({
  slot,
  quests,
  period,
  index,
}: {
  slot: SlotRow;
  quests: QuestOption[];
  period: "WEEKLY" | "MONTHLY";
  index: number;
}) {
  const live = slot.state === "live";
  const past = slot.state === "past";
  const editable = slot.state === "future";

  const state = live ? "OPEN" : past ? "CLOSED" : slot.booking ? "BOOKED" : "EMPTY";

  return (
    <article
      className="sq-slot-card"
      data-live={live ? "1" : "0"}
      data-past={past ? "1" : "0"}
      style={{ ["--i" as string]: index }}
    >
      <div className="sq-section-head" style={{ marginBottom: 10 }}>
        <h3 style={{ fontSize: 17 }}>{slot.label}</h3>
        <span
          className="sq-mono"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.08em",
            color: live ? "var(--signal)" : "var(--ink-3)",
          }}
        >
          {state}
        </span>
      </div>

      <p className="sq-kicker-sm" style={{ fontSize: 9.5, marginBottom: 12 }}>
        {past || live ? "Opened" : "Opens"} {OPENED.format(new Date(slot.openAt))} · {slot.dates}
      </p>

      {slot.booking ? (
        <>
          <b style={{ display: "block", fontSize: 14.5, lineHeight: 1.3, fontWeight: 600 }}>
            {slot.booking.title}
          </b>
          <span style={{ display: "block", marginTop: 4, fontSize: 12.5, color: "var(--ink-3)" }}>
            {slot.booking.where}
          </span>
        </>
      ) : (
        <>
          <b style={{ display: "block", fontSize: 14.5, lineHeight: 1.3, fontWeight: 600, color: "var(--ink-2)" }}>
            Nothing booked
          </b>
          <span style={{ display: "block", marginTop: 4, fontSize: 12.5, color: "var(--ink-3)" }}>
            {editable ? "Generated per account until one is" : "Generated per account"}
          </span>
        </>
      )}

      <div className="sq-slot-foot">
        <span className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
          {slot.booking ? AUDIENCE_LABEL[slot.booking.audience] ?? slot.booking.audience : "—"}
        </span>
        {editable ? (
          <SqSlotEditor period={period} slot={slot} quests={quests} />
        ) : (
          <span className="sq-mono" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>
            read-only
          </span>
        )}
      </div>
    </article>
  );
}
