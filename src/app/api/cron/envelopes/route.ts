import { NextResponse } from "next/server";

import { cronAuthorised } from "@/lib/cron";
import { db } from "@/lib/db";
import { sendEnvelopeByEmail, sendEnvelopePosted } from "@/lib/email";
import { getEnvelopeStatus } from "@/lib/envelope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * The monthly envelope, on the 2nd.
 *
 * This is where "no address, no envelope — an email instead" stops being copy
 * on a settings page and becomes a decision the system actually makes. Every
 * account whose plan includes post is put through `getEnvelopeStatus`, the
 * same function the billing page and the sticker sheet read, and lands in one
 * of two lists:
 *
 *   · `posting` — an addressed envelope, and a note saying it went;
 *   · `no_address` — no envelope at all, and the month's card by email.
 *
 * The despatch list is returned rather than printed, because there is no
 * printer at the other end of this yet. That is deliberate and it is honest:
 * the rule is enforced and the addresses are assembled, and the day a fulfiler
 * exists it reads this list rather than re-deciding who gets what.
 *
 * Accounts on a plan without post are not in either list. They were never owed
 * an envelope, so telling them they are not getting one would be news about
 * nothing.
 */
export async function GET(request: Request) {
  if (!cronAuthorised(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  if (now.getUTCDate() !== 2) {
    return NextResponse.json({ ok: true, posted: 0, emailed: 0, note: "envelopes go out on the 2nd" });
  }

  const month = MONTH.format(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

  // Only live subscriptions. A cancelled account keeps its access to the end
  // of what it paid for, and `getEnvelopeStatus` reads the same entitlement
  // that decides that, so the filter here is only about not walking the whole
  // user table.
  const candidates = await db.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
      plan: { not: "FREE" },
      user: { role: "USER" },
    },
    select: { userId: true, user: { select: { name: true } } },
  });

  const despatch: { userId: string; recipient: string; lines: string[] }[] = [];
  let emailed = 0;

  for (const candidate of candidates) {
    const status = await getEnvelopeStatus(candidate.userId, candidate.user.name);
    if (status.reason === "not_included") continue;

    // Stickers earned but not yet posted would come from a despatch log once
    // one exists. Until then the count is the honest zero rather than a number
    // invented to make the sentence read better.
    const stickers = 0;

    if (status.posts) {
      despatch.push({
        userId: candidate.userId,
        recipient: status.address.recipient,
        lines: [
          status.address.line1,
          status.address.line2,
          [status.address.postcode, status.address.city].filter(Boolean).join(" "),
          status.address.country,
        ].filter((line): line is string => Boolean(line)),
      });
      await sendEnvelopePosted(candidate.userId, { month, stickers });
      continue;
    }

    await sendEnvelopeByEmail(candidate.userId, { month, stickers });
    emailed += 1;
  }

  return NextResponse.json({
    ok: true,
    month,
    posted: despatch.length,
    emailed,
    despatch,
  });
}
