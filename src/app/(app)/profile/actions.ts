"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { destroySession } from "@/lib/auth/session";
import { DELETE_PHRASE } from "@/lib/config";
import { findCountry } from "@/lib/geo";
import { getEntitlement } from "@/lib/entitlements";
import { fieldErrors, profileSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export type ProfileState = { errors?: Record<string, string>; saved?: boolean } | undefined;

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireClient();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/profile");
  return { saved: true };
}

const preferencesSchema = z.object({
  country: z.string().trim().min(2, "Pick a country.").max(60),
});

/**
 * The one preference left.
 *
 * Settings used to ask for a town, a difficulty grade, a time budget and a
 * travel radius. Every one of those was a decision the product exists to take
 * off you — being told what to do is the premise — so they are gone, and the
 * only thing still worth asking is which country to measure from.
 *
 * Stored as a country, never a town or an address: the safety notice promises
 * no home addresses and no exact coordinates, and a chooser with nothing but
 * countries in it keeps that true by construction rather than by validation.
 */
export async function updatePreferencesAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireClient();

  const parsed = preferencesSchema.safeParse({ country: formData.get("country") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const country = findCountry(parsed.data.country);
  if (!country) return { errors: { country: "That isn't a country we cover yet." } };

  // Worldwide is Ultra's. Anyone else picking a non-European country is
  // refused here rather than in the form, because the form is not the
  // authority on what a plan reaches.
  const entitlement = await getEntitlement(user.id);
  if (!country.europe && !entitlement.can("worldwide")) {
    return { errors: { country: "Outside Europe is Ultra. Your plan stops at Europe." } };
  }

  await db.userPreferences.update({
    where: { userId: user.id },
    data: {
      homeLocation: country.name,
      homeLatitude: country.latitude,
      homeLongitude: country.longitude,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { saved: true };
}

/**
 * Delete the account, for good.
 *
 * Cascades take the sessions, preferences, subscription and history with it.
 * GDPR calls this a hard delete and so do we — there is no soft-delete flag to
 * quietly keep the row.
 *
 * The typed phrase is checked here, not only in the dialog: a confirmation
 * that lives entirely in the client is a confirmation an accidental POST goes
 * straight past.
 */
export async function deleteAccountAction(formData: FormData): Promise<ProfileState> {
  const user = await requireClient();

  if (String(formData.get("confirm") ?? "").trim() !== DELETE_PHRASE) {
    return { errors: { confirm: `Type ${DELETE_PHRASE} exactly.` } };
  }

  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}

/**
 * Erase what the account has done without closing it.
 *
 * The middle option between "change nothing" and "delete me": history,
 * submissions, saved quests and the stickers derived from them all go, the
 * login stays. Guarded by the same typed phrase, since it is just as
 * irreversible as the delete — it simply leaves a door open afterwards.
 */
export async function clearMyDataAction(formData: FormData): Promise<ProfileState> {
  const user = await requireClient();

  if (String(formData.get("confirm") ?? "").trim() !== DELETE_PHRASE) {
    return { errors: { confirm: `Type ${DELETE_PHRASE} exactly.` } };
  }

  // One transaction: a half-erased account — submissions gone but the history
  // they were filed against still standing — is worse than either end state.
  await db.$transaction([
    db.submission.deleteMany({ where: { userId: user.id } }),
    db.savedQuest.deleteMany({ where: { userId: user.id } }),
    db.questHistory.deleteMany({ where: { userId: user.id } }),
    db.questGeneration.deleteMany({ where: { userId: user.id } }),
    db.user.update({ where: { id: user.id }, data: { freeQuestsUsed: 0 } }),
  ]);

  revalidatePath("/", "layout");
  return { saved: true };
}
