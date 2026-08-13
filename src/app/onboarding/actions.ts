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

/**
 * Onboarding only asks for a home town and a difficulty, so the rest of the
 * generator's inputs are inferred from that one answer. These are starting
 * points, not commitments — every one of them is editable in settings, and
 * leaving them broad keeps the first few quests varied rather than funnelling
 * a new account into one kind of day out.
 */
const DEFAULTS_FOR_DIFFICULTY = {
  EASY: {
    maxDistance: 40,
    timeAvailable: "SHORT" as const,
    questStyle: "RELAXED" as const,
    interests: ["forest", "water", "views"],
  },
  MODERATE: {
    maxDistance: 60,
    timeAvailable: "HALF" as const,
    questStyle: "ADVENTUROUS" as const,
    interests: ["forest", "mountains", "water", "views"],
  },
  HARD: {
    maxDistance: 90,
    timeAvailable: "LONG" as const,
    questStyle: "CHALLENGING" as const,
    interests: ["mountains", "rocks", "views", "long_hikes"],
  },
  SURPRISE: {
    maxDistance: 75,
    timeAvailable: "SURPRISE" as const,
    questStyle: "RANDOM" as const,
    interests: ["forest", "mountains", "water", "rocks", "history", "views", "hidden"],
  },
} satisfies Record<string, { maxDistance: number; timeAvailable: string; questStyle: string; interests: string[] }>;

/** `null` (field absent) → `undefined` (field optional). */
function optional(value: FormDataEntryValue | null): FormDataEntryValue | undefined {
  return value === null ? undefined : value;
}

function optionalList(values: FormDataEntryValue[]): FormDataEntryValue[] | undefined {
  return values.length > 0 ? values : undefined;
}

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    homeLocation: formData.get("homeLocation"),
    difficulty: formData.get("difficulty"),
    // The form only submits the two answers above. `FormData.get` returns
    // `null` for the rest, and `null` is not `undefined` — an optional field
    // would still be parsed (and `z.coerce.number()` would happily turn `null`
    // into a `0` that fails the minimum), so absent fields are normalised away
    // and left to the difficulty-derived defaults below.
    maxDistance: optional(formData.get("maxDistance")),
    interests: optionalList(formData.getAll("interests")),
    timeAvailable: optional(formData.get("timeAvailable")),
    transport: optional(formData.get("transport")),
    questStyle: optional(formData.get("questStyle")),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const fallback = DEFAULTS_FOR_DIFFICULTY[input.difficulty];
  const interests = input.interests?.length ? input.interests : fallback.interests;
  const timeAvailable = input.timeAvailable ?? fallback.timeAvailable;
  const questStyle = input.questStyle ?? fallback.questStyle;

  const place = findPlace(input.homeLocation);
  const expanded = expandInterests(interests);

  const data = {
    homeLocation: place?.name ?? input.homeLocation,
    homeLatitude: place?.latitude ?? null,
    homeLongitude: place?.longitude ?? null,
    maxDistance: input.maxDistance ?? fallback.maxDistance,
    preferredDistance: input.preferredDistance ?? DISTANCE_FOR_TIME[timeAvailable] ?? 12,
    difficulty: input.difficulty,
    preferredTerrain: interests,
    preferredActivity: ACTIVITY_FOR_STYLE[questStyle] ?? ["exploration"],
    preferredEnvironment: expanded.features,
    timeAvailable,
    transport: input.transport ?? ("CAR" as const),
    questStyle,
    // Derived from what they picked; editable later in settings.
    waterPreference: interests.includes("water") ? ("YES" as const) : ("SURPRISE" as const),
    elevationPreference: interests.includes("mountains") ? ("YES" as const) : ("SURPRISE" as const),
    sunsetPreference: interests.includes("views") ? ("YES" as const) : ("SURPRISE" as const),
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
