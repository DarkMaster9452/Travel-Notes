import { z } from "zod";

import { ONBOARDING_INTERESTS } from "@/lib/quest/taxonomy";

/**
 * Every mutation validates its input here, on the server, before touching the
 * database. Client-side checks exist only to make the form pleasant.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254)
  .email("That doesn't look like an email address")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200, "That's longer than we can hash sensibly");

export const signupSchema = z.object({
  name: z.string().trim().min(1, "What should we call you?").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

const interestIds = ONBOARDING_INTERESTS.map((i) => i.id) as [string, ...string[]];

/**
 * Onboarding asks two questions: where you are, and how hard you want it.
 *
 * Everything else the generator needs is derived server-side from the
 * difficulty answer (see `completeOnboardingAction`) and stays editable in
 * settings afterwards, so the signup path never turns into a survey. The
 * remaining fields are still accepted here — the settings form posts the same
 * schema — but they are optional and defaulted rather than required.
 */
export const onboardingSchema = z.object({
  homeLocation: z.string().trim().min(2, "Where are you starting from?").max(120),
  difficulty: z.enum(["EASY", "MODERATE", "HARD", "SURPRISE"]),
  maxDistance: z.coerce.number().int().min(5).max(300).optional(),
  preferredDistance: z.coerce.number().int().min(3).max(40).optional(),
  interests: z.array(z.enum(interestIds)).max(8).optional(),
  timeAvailable: z.enum(["SHORT", "HALF", "LONG", "FULL", "SURPRISE"]).optional(),
  transport: z.enum(["CAR", "PUBLIC_TRANSPORT", "BIKE", "WALKING"]).optional(),
  questStyle: z.enum(["RELAXED", "ADVENTUROUS", "CHALLENGING", "RANDOM"]).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export const questIdSchema = z.string().trim().min(1).max(60);

/** Flatten Zod issues into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    result[key] ??= issue.message;
  }
  return result;
}
