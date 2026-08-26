import { NextResponse } from "next/server";

import { cronAuthorised } from "@/lib/cron";
import { db } from "@/lib/db";
import { sendEnvelopeByEmail, sendEnvelopePosted } from "@/lib/email";
import { getEnvelopeStatus, STICKERS_PER_ENVELOPE, pickStickersToPost } from "@/lib/envelope";

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
 * the rule is enforced, the addresses are assembled and the stickers are
 * chosen and logged, and the day a fulfiler exists it reads this list rather
 * than re-deciding who gets what.
 *
 * The stickers in each envelope are picked by `pickStickersToPost` and written
 * to `StickerDespatch` before the email goes out, so the same two are never
 * sent twice and a job that runs again on the same day is a no-op.
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

  const despatch: {
    userId: string;
    recipient: string;
    lines: string[];
    stickers: string[];
  }[] = [];
  let emailed = 0;

  for (const candidate of candidates) {
    const status = await getEnvelopeStatus(candidate.userId, candidate.user.name);
    if (status.reason === "not_included") continue;

    if (status.posts) {
      // Chosen and logged before the email claims they were sent, so the
      // message can never promise stickers the log does not record.
      const going = await pickStickersToPost(candidate.userId);
      if (going.length > 0) {
        await db.stickerDespatch.createMany({
          data: going.map((entry) => ({
            userId: candidate.userId,
            achievementId: entry.id,
          })),
          skipDuplicates: true,
        });
      }

      despatch.push({
        userId: candidate.userId,
        recipient: status.address.recipient,
        lines: [
          status.address.line1,
          status.address.line2,
          [status.address.postcode, status.address.city].filter(Boolean).join(" "),
          status.address.country,
        ].filter((line): line is string => Boolean(line)),
        stickers: going.map((entry) => entry.label),
      });
      await sendEnvelopePosted(candidate.userId, { month, stickers: going.length });
      continue;
    }

    // No address, so nothing is despatched and nothing is logged — the
    // stickers stay in the queue for the first envelope we can actually post.
    await sendEnvelopeByEmail(candidate.userId, { month, stickers: 0 });
    emailed += 1;
  }

  return NextResponse.json({
    ok: true,
    month,
    posted: despatch.length,
    emailed,
    perEnvelope: STICKERS_PER_ENVELOPE,
    despatch,
  });
}
