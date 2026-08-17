"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { destroySession } from "@/lib/auth/session";
import { findPlace } from "@/lib/geo";
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
  homeLocation: z.string().trim().min(1, "Where do you set out from?").max(80),
  difficulty: z.enum(["EASY", "MODERATE", "HARD", "SURPRISE"]),
  maxDistance: z.coerce.number().int().min(10).max(300),
  timeAvailable: z.enum(["SHORT", "HALF", "LONG", "FULL", "SURPRISE"]),
});

/**
 * The preferences the generator actually reads.
 *
 * These used to be collected by a seven-step quiz before an account had seen a
 * single quest. They live here instead, editable at any time, and an account
 * starts with broad defaults — the product is meant to remove decisions, not
 * open with a form full of them.
 */
export async function updatePreferencesAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireClient();

  const parsed = preferencesSchema.safeParse({
    homeLocation: formData.get("homeLocation"),
    difficulty: formData.get("difficulty"),
    maxDistance: formData.get("maxDistance"),
    timeAvailable: formData.get("timeAvailable"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { homeLocation, difficulty, maxDistance, timeAvailable } = parsed.data;

  // Only the coordinates of a *town* are stored, never a street address — the
  // safety notice promises no home addresses and no exact coordinates, and the
  // gazetteer is what keeps that true.
  const place = findPlace(homeLocation);

  await db.userPreferences.update({
    where: { userId: user.id },
    data: {
      homeLocation: place?.name ?? homeLocation,
      ...(place ? { homeLatitude: place.latitude, homeLongitude: place.longitude } : {}),
      difficulty,
      maxDistance,
      timeAvailable,
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
 */
export async function deleteAccountAction(): Promise<void> {
  const user = await requireClient();
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
