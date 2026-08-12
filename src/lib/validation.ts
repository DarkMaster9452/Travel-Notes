import { z } from "zod";

import { CATEGORY_IDS, DIFFICULTY_ORDER } from "@/lib/gamification";

/**
 * Every mutation validates here, on the server, before touching the database.
 * Client-side checks exist only to make the forms pleasant.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "email")
  .max(254)
  .email("email")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z.string().min(10, "short").max(200);

export const signupSchema = z.object({
  name: z.string().trim().min(1, "name").max(60),
  email: emailSchema,
  password: passwordSchema,
  acceptRules: z.literal("on", { message: "rules" }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "password").max(200),
});

/**
 * Photos arrive as data URLs, resized in the browser first. The cap is a
 * backstop against someone posting a raw 12 MP file straight to the endpoint —
 * see the README on moving this to object storage.
 */
export const MAX_PHOTO_BYTES = 1_500_000;

export const photoSchema = z
  .string()
  .min(1, "photo")
  .refine((value) => /^data:image\/(jpeg|png|webp);base64,/.test(value), "photo")
  .refine((value) => value.length <= MAX_PHOTO_BYTES, "size");

export const submissionSchema = z.object({
  questId: z.string().trim().min(1).max(60),
  photo: photoSchema,
  caption: z.string().trim().max(600, "caption").optional().or(z.literal("")),
  difficulty: z.enum(DIFFICULTY_ORDER as [string, ...string[]]),
  comparison: z.enum(["HARDER", "SIMILAR", "EASIER", "FIRST"]),
  comparedToQuestId: z.string().trim().max(60).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  submissionId: z.string().trim().min(1).max(60),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  notePublic: z.enum(["on", "off"]).optional(),
});

export const questSchema = z.object({
  title: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(600),
  category: z.enum(CATEGORY_IDS as [string, ...string[]]),
  points: z.coerce.number().int().min(10).max(2000),
  publishedAt: z.string().trim().min(1),
  closesAt: z.string().trim().min(1),
});

export const commentSchema = z.object({
  submissionId: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(400),
});

export const reactionSchema = z.object({
  submissionId: z.string().trim().min(1).max(60),
  emoji: z.string().trim().min(1).max(8),
});

/** Flatten Zod issues into `{ field: code }` so the UI can localise them. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    result[key] ??= issue.message;
  }
  return result;
}
