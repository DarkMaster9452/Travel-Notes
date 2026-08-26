"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { touch } from "@/lib/activity";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { normaliseHandle, normaliseSocial, uniqueHandle } from "@/lib/profile";

/**
 * Editing your own public profile.
 *
 * Everything here is optional and everything here is off until asked for. The
 * one field that is not free-form is the handle: it is a path segment and the
 * thing that makes two people distinguishable, so it is normalised hard and
 * checked against everybody else's before it is written.
 */

const publicProfileSchema = z.object({
  handle: z.string().trim().min(2, "A handle needs at least two characters.").max(30),
  published: z.coerce.boolean().optional(),
  displayName: z.string().trim().max(60).optional().or(z.literal("")),
  headline: z.string().trim().max(90).optional().or(z.literal("")),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  instagram: z.string().trim().max(120).optional().or(z.literal("")),
  facebook: z.string().trim().max(120).optional().or(z.literal("")),
  strava: z.string().trim().max(120).optional().or(z.literal("")),
  accent: z.enum(["PINE", "MOSS", "STONE", "WATER", "CLAY", "DUSK", "SIGNAL"]),
  showStats: z.coerce.boolean().optional(),
  showCountry: z.coerce.boolean().optional(),
  showActivities: z.coerce.boolean().optional(),
  showStickers: z.coerce.boolean().optional(),
  showActivityGrid: z.coerce.boolean().optional(),
});

export type PublicProfileState =
  | { ok: true; handle: string; published: boolean }
  | { ok: false; errors: Record<string, string> }
  | undefined;

export async function savePublicProfileAction(
  _prev: PublicProfileState,
  formData: FormData,
): Promise<PublicProfileState> {
  const user = await requireClient();

  const parsed = publicProfileSchema.safeParse({
    handle: formData.get("handle"),
    published: formData.get("published") === "true",
    displayName: formData.get("displayName") ?? "",
    headline: formData.get("headline") ?? "",
    bio: formData.get("bio") ?? "",
    instagram: formData.get("instagram") ?? "",
    facebook: formData.get("facebook") ?? "",
    strava: formData.get("strava") ?? "",
    accent: formData.get("accent") ?? "PINE",
    showStats: formData.get("showStats") === "true",
    showCountry: formData.get("showCountry") === "true",
    showActivities: formData.get("showActivities") === "true",
    showStickers: formData.get("showStickers") === "true",
    showActivityGrid: formData.get("showActivityGrid") === "true",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".") || "form"] ??= issue.message;
    }
    return { ok: false, errors };
  }

  const input = parsed.data;

  const handle = normaliseHandle(input.handle);
  if (handle.length < 2) {
    return {
      ok: false,
      errors: { handle: "That reduces to nothing usable — try letters and numbers." },
    };
  }

  const clash = await db.profile.findUnique({ where: { handle }, select: { userId: true } });
  if (clash && clash.userId !== user.id) {
    return { ok: false, errors: { handle: "Somebody already walks under that one." } };
  }

  const values = {
    handle,
    published: input.published ?? false,
    displayName: input.displayName || null,
    headline: input.headline || null,
    bio: input.bio || null,
    // Stored as bare handles. A pasted URL is reduced to the handle inside it,
    // so nothing anybody types can turn into a link somewhere else entirely.
    instagram: input.instagram ? normaliseSocial(input.instagram) : null,
    facebook: input.facebook ? normaliseSocial(input.facebook) : null,
    strava: input.strava ? normaliseSocial(input.strava) : null,
    accent: input.accent,
    showStats: input.showStats ?? false,
    showCountry: input.showCountry ?? false,
    showActivities: input.showActivities ?? false,
    showStickers: input.showStickers ?? false,
    showActivityGrid: input.showActivityGrid ?? false,
  };

  await db.profile.upsert({
    where: { userId: user.id },
    update: values,
    create: { userId: user.id, ...values },
  });

  void touch(user.id);

  revalidatePath("/profile");
  revalidatePath("/profile/public");
  revalidatePath("/people");
  revalidatePath(`/people/${handle}`);

  return { ok: true, handle, published: values.published };
}

/**
 * The profile somebody starts from.
 *
 * Created on first visit to the editor rather than at signup: an account that
 * never opens this page should not have a row, and a row that exists but has
 * never been published is indistinguishable from no row at all to everybody
 * except its owner.
 */
export async function ensureProfileAction() {
  const user = await requireClient();

  const existing = await db.profile.findUnique({ where: { userId: user.id } });
  if (existing) return existing;

  return db.profile.create({
    data: { userId: user.id, handle: await uniqueHandle(user.name, user.id) },
  });
}
