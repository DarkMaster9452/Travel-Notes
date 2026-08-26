import "server-only";

import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";

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

/** The one line each state is described by, everywhere it is described. */
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
