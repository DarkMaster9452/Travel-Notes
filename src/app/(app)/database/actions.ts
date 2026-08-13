"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LOCATIONS } from "@/lib/quest/locations";
import { unlockQuestForUser } from "@/lib/quest/service";

export type UnlockState =
  | { ok: true; questId: string; title: string }
  | { ok: false; message: string }
  | undefined;

/**
 * Turn a catalogue place into one of the reader's quests.
 *
 * The location id is checked against the catalogue here rather than trusted
 * from the form, and every other guard (entitlement, rate limit, quota) lives
 * in `unlockQuestForUser` on the server.
 */
export async function unlockQuestAction(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const user = await requireOnboardedUser();

  const locationId = String(formData.get("locationId") ?? "");
  if (!LOCATIONS.some((location) => location.id === locationId)) {
    return { ok: false, message: "That place isn't in the catalogue." };
  }

  const outcome = await unlockQuestForUser(user.id, locationId);
  if (!outcome.ok) return { ok: false, message: outcome.message };

  revalidatePath("/dashboard");
  revalidatePath("/database");
  revalidatePath("/history");

  return { ok: true, questId: outcome.quest.id, title: outcome.quest.title };
}

/**
 * Unlock a place the reader hasn't been sent to yet, chosen at random.
 *
 * Somewhere-new is preferred over somewhere-repeated, but a reader who has
 * worked through the whole catalogue still gets a quest rather than an error.
 */
export async function surpriseMeAction(): Promise<UnlockState> {
  const user = await requireOnboardedUser();

  const visited = await db.questHistory.findMany({
    where: { userId: user.id },
    select: { quest: { select: { location: true } } },
  });
  const seen = new Set(visited.map((entry) => entry.quest.location));

  const unseen = LOCATIONS.filter((location) => !seen.has(location.name));
  const pool = unseen.length > 0 ? unseen : LOCATIONS;
  const pick = pool[Math.floor(Math.random() * pool.length)]!;

  const outcome = await unlockQuestForUser(user.id, pick.id);
  if (!outcome.ok) return { ok: false, message: outcome.message };

  revalidatePath("/dashboard");
  revalidatePath("/database");
  revalidatePath("/history");

  return { ok: true, questId: outcome.quest.id, title: outcome.quest.title };
}
