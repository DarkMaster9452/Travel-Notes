"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { findPlace } from "@/lib/geo";
import { expandInterests } from "@/lib/quest/taxonomy";
import { fieldErrors, onboardingSchema, profileSchema } from "@/lib/validation";

export type ProfileState = { errors?: Record<string, string>; saved?: boolean } | undefined;

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireOnboardedUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/profile");
  return { saved: true };
}

export async function updatePreferencesAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireOnboardedUser();

  const parsed = onboardingSchema.safeParse({
    homeLocation: formData.get("homeLocation"),
    maxDistance: formData.get("maxDistance"),
    preferredDistance: formData.get("preferredDistance"),
    interests: formData.getAll("interests"),
    difficulty: formData.get("difficulty"),
    timeAvailable: formData.get("timeAvailable"),
    transport: formData.get("transport"),
    questStyle: formData.get("questStyle"),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const place = findPlace(input.homeLocation);
  const expanded = expandInterests(input.interests);

  await db.userPreferences.update({
    where: { userId: user.id },
    data: {
      homeLocation: place?.name ?? input.homeLocation,
      homeLatitude: place?.latitude ?? null,
      homeLongitude: place?.longitude ?? null,
      maxDistance: input.maxDistance,
      preferredDistance: input.preferredDistance ?? 12,
      difficulty: input.difficulty,
      preferredTerrain: input.interests,
      preferredEnvironment: expanded.features,
      timeAvailable: input.timeAvailable,
      transport: input.transport,
      questStyle: input.questStyle,
      waterPreference: input.interests.includes("water") ? "YES" : "SURPRISE",
      elevationPreference: input.interests.includes("mountains") ? "YES" : "SURPRISE",
      sunsetPreference: input.interests.includes("views") ? "YES" : "SURPRISE",
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { saved: true };
}
