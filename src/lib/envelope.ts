import "server-only";

import { getAchievements } from "@/lib/achievements";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import type { Messages } from "@/lib/i18n";
import { getUserStats } from "@/lib/quest/service";

/**
 * Whether a monthly envelope actually goes out, and why not when it doesn't.
 *
 * One place decides this, because it is a promise about real post and the
 * three screens that mention it must not each reach their own conclusion. The
 * rule, stated once:
 *
 *   · the plan has to include post, and
 *   · there has to be somewhere to send it.
 *
 * The second half is the one people trip over. An account that never filled in
 * an address is not owed an envelope and is not quietly dropped either — the
 * month's quest card and sticker list arrive by email instead, which is a
 * worse version of the same thing rather than nothing at all. That is the
 * whole of "no address, no envelope, an email instead".
 */

/**
 * How many stickers ride along with the quest card.
 *
 * Two, because the envelope is a card and two stickers and that is the whole
 * of it. Stated once so the copy, the job and anything that ever counts them
 * cannot drift apart — this number is a promise printed on the settings page.
 */
export const STICKERS_PER_ENVELOPE = 2;

export type EnvelopeStatus =
  /** Post goes out on the 2nd. */
  | { posts: true; reason: "posting"; address: PostalAddress }
  /** The plan does not include post at all. */
  | { posts: false; reason: "not_included"; address: null }
  /** The plan includes it; nobody told us where. */
  | { posts: false; reason: "no_address"; address: null };

export type PostalAddress = {
  recipient: string;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  country: string;
};

/**
 * An address is usable when it could survive a postal sorter: a street, a
 * town and a country. A row that exists with only a country in it — which is
 * what the form's default produces if somebody opens it and saves nothing —
 * is not an address, and treating it as one would send an envelope into a
 * void and bill us for it.
 */
export function isPostable(address: {
  recipient?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
} | null): boolean {
  if (!address) return false;
  return Boolean(address.line1?.trim() && address.city?.trim() && address.country?.trim());
}

export async function getEnvelopeStatus(
  userId: string,
  fallbackName = "",
): Promise<EnvelopeStatus> {
  const [entitlement, address] = await Promise.all([
    getEntitlement(userId),
    db.shippingAddress.findUnique({ where: { userId } }),
  ]);

  if (!entitlement.can("mail")) return { posts: false, reason: "not_included", address: null };
  if (!isPostable(address)) return { posts: false, reason: "no_address", address: null };

  return {
    posts: true,
    reason: "posting",
    address: {
      recipient: address!.recipient?.trim() || fallbackName,
      line1: address!.line1!.trim(),
      line2: address!.line2?.trim() || null,
      city: address!.city!.trim(),
      postcode: address!.postcode?.trim() ?? "",
      country: address!.country.trim(),
    },
  };
}

/**
 * The one line each state is described by, everywhere it is described.
 *
 * `envelopeCopy(t, reason)` is the translated way in; this stays as the
 * English fallback for anything that runs without a reader — the despatch job,
 * a log line, a test.
 */
export function envelopeCopy(
  t: Messages,
  reason: EnvelopeStatus["reason"],
): { title: string; detail: string } {
  return t.envelope[reason];
}

export const ENVELOPE_COPY: Record<EnvelopeStatus["reason"], { title: string; detail: string }> = {
  posting: {
    title: "Posting on the 2nd",
    detail:
      "Your quest card and two stickers go out by post on the 2nd of each month. An address changed after the 28th applies to the envelope after next.",
  },
  not_included: {
    title: "Screen only",
    detail:
      "Free accounts read their quest card here rather than receiving one. Explorer and above get the printed envelope.",
  },
  no_address: {
    title: "Email instead of post",
    detail:
      "Your plan includes the printed envelope, but we have no address to send it to — so the quest card and your stickers arrive by email instead. Add an address and the next envelope goes in the post.",
  },
};


/**
 * Which stickers go in this month's envelope.
 *
 * Earned, printed, and not already posted — in sheet order, so somebody
 * collects them in the order the sheet reads rather than in whatever order the
 * database happened to return. At most `STICKERS_PER_ENVELOPE`; the rest wait
 * for next month, which is what makes the sheet something that arrives over a
 * year rather than in one parcel.
 *
 * Only the reachable sheet is considered: `getAchievements` already refuses to
 * mark anything beyond the plan as earned, so an account that downgrades stops
 * being sent stickers it can no longer hold.
 */
export async function pickStickersToPost(
  userId: string,
  limit = STICKERS_PER_ENVELOPE,
): Promise<{ id: string; label: string }[]> {
  const [stats, entitlement, revocations, alreadySent] = await Promise.all([
    getUserStats(userId),
    getEntitlement(userId),
    db.achievementRevocation.findMany({ where: { userId }, select: { achievementId: true } }),
    db.stickerDespatch.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);

  const sent = new Set(alreadySent.map((row) => row.achievementId));

  return getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
  )
    .filter((entry) => entry.earned && entry.printed && !sent.has(entry.id))
    .slice(0, limit)
    .map((entry) => ({ id: entry.id, label: entry.label }));
}

/** How many printed stickers are earned and still waiting for an envelope. */
export async function countStickersWaiting(userId: string): Promise<number> {
  const waiting = await pickStickersToPost(userId, Number.MAX_SAFE_INTEGER);
  return waiting.length;
}
