"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { findPlace } from "@/lib/geo";
import { expandInterests } from "@/lib/quest/taxonomy";
import { fieldErrors, onboardingSchema } from "@/lib/validation";

export type OnboardingState = { errors?: Record<string, string> } | undefined;

/** Route length that fits the time the user says they have, in km. */
const DISTANCE_FOR_TIME: Record<string, number> = {
  SHORT: 6,
  HALF: 11,
  LONG: 16,
  FULL: 22,
  SURPRISE: 12,
};

const ACTIVITY_FOR_STYLE: Record<string, string[]> = {
  RELAXED: ["nature", "photography"],
  ADVENTUROUS: ["exploration", "nature"],
  CHALLENGING: ["challenge", "exploration"],
  RANDOM: ["spontaneous", "off_the_beaten_path"],
};

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    homeLocation: formData.get("homeLocation"),
    maxDistance: formData.get("maxDistance"),
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

  const data = {
    homeLocation: place?.name ?? input.homeLocation,
    homeLatitude: place?.latitude ?? null,
    homeLongitude: place?.longitude ?? null,
    maxDistance: input.maxDistance,
    preferredDistance: input.preferredDistance ?? DISTANCE_FOR_TIME[input.timeAvailable] ?? 12,
    difficulty: input.difficulty,
    preferredTerrain: input.interests,
    preferredActivity: ACTIVITY_FOR_STYLE[input.questStyle] ?? ["exploration"],
    preferredEnvironment: expanded.features,
    timeAvailable: input.timeAvailable,
    transport: input.transport,
    questStyle: input.questStyle,
    // Derived from what they picked; editable later in the profile.
    waterPreference: input.interests.includes("water") ? ("YES" as const) : ("SURPRISE" as const),
    elevationPreference: input.interests.includes("mountains")
      ? ("YES" as const)
      : ("SURPRISE" as const),
    sunsetPreference: input.interests.includes("views") ? ("YES" as const) : ("SURPRISE" as const),
  };

  await db.$transaction([
    db.userPreferences.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    }),
    db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } }),
  ]);

  redirect("/dashboard");
}
