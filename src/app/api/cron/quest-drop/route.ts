import { NextResponse } from "next/server";

import { slotFor, slotLabel } from "@/lib/admin/schedule";
import { cronAuthorised } from "@/lib/cron";
import { db } from "@/lib/db";
import { sendQuestDrop } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tell everybody a quest has opened.
 *
 * Run at 06:00 — Monday for the weekly, the 1st for the monthly. The route
 * decides which of those it is from the clock rather than from a parameter, so
 * one schedule entry cannot be pointed at the wrong cadence.
 *
 * Only booked slots produce an email. A generated slot is a different quest per
 * account and is materialised when somebody opens it; announcing one before it
 * exists would be announcing something we have not written yet.
 */
export async function GET(request: Request) {
  if (!cronAuthorised(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  const periods: ("WEEKLY" | "MONTHLY")[] = [];
  if (now.getDate() === 1) periods.push("MONTHLY");
  if (now.getDay() === 1) periods.push("WEEKLY");

  if (periods.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: "no slot opens today" });
  }

  const recipients = await db.user.findMany({
    where: { role: "USER" },
    select: { id: true },
  });

  let sent = 0;

  for (const period of periods) {
    const slot = slotFor(period, now);
    const booking = await db.questSchedule.findUnique({
      where: { period_slotKey: { period, slotKey: slot.key } },
      select: { quest: { select: { id: true, title: true, location: true, region: true } } },
    });
    if (!booking) continue;

    for (const recipient of recipients) {
      const result = await sendQuestDrop(recipient.id, {
        title: booking.quest.title,
        where: `${booking.quest.location} · ${booking.quest.region}`,
        period,
        label: slotLabel(slot),
        questId: booking.quest.id,
      });
      if (result.sent) sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, periods });
}
