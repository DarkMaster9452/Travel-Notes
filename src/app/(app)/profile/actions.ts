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

  // The fields beyond home town and difficulty are optional in the shared
  // schema (onboarding no longer asks for them). This form does submit them,
  // but anything genuinely absent is left untouched rather than reset —
  // `undefined` tells Prisma to skip the column.
  const interests = input.interests;
  const derived = interests
    ? {
        preferredTerrain: interests,
        preferredEnvironment: expandInterests(interests).features,
        waterPreference: interests.includes("water") ? ("YES" as const) : ("SURPRISE" as const),
        elevationPreference: interests.includes("mountains")
          ? ("YES" as const)
          : ("SURPRISE" as const),
        sunsetPreference: interests.includes("views") ? ("YES" as const) : ("SURPRISE" as const),
      }
    : {};

  await db.userPreferences.update({
    where: { userId: user.id },
    data: {
      homeLocation: place?.name ?? input.homeLocation,
      homeLatitude: place?.latitude ?? null,
      homeLongitude: place?.longitude ?? null,
      maxDistance: input.maxDistance,
      preferredDistance: input.preferredDistance,
      difficulty: input.difficulty,
      timeAvailable: input.timeAvailable,
      transport: input.transport,
      questStyle: input.questStyle,
      ...derived,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { saved: true };
}
