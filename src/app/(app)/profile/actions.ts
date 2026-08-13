"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedUser } from "@/lib/auth/guards";
import { ACCENT_IDS, AVATAR_STYLE_IDS, BANNER_IDS } from "@/lib/cosmetics";
import { db } from "@/lib/db";
import { getAchievements } from "@/lib/achievements";
import { getUserStats } from "@/lib/quest/service";
import { fieldErrors, profileSchema } from "@/lib/validation";

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

/**
 * Save the cosmetic choices.
 *
 * Each value is checked against the enumerated preset ids rather than written
 * through, so nothing here can smuggle in styling of its own. The explorer
 * title is checked against the achievements the account has actually earned —
 * a title is a reward, and the form is not the authority on who has it.
 */
export async function updateCosmeticsAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireOnboardedUser();

  const accentColor = String(formData.get("accentColor") ?? "");
  const avatarStyle = String(formData.get("avatarStyle") ?? "");
  const bannerStyle = String(formData.get("bannerStyle") ?? "");
  const explorerTitle = String(formData.get("explorerTitle") ?? "");

  if (!ACCENT_IDS.includes(accentColor as never)) {
    return { errors: { accentColor: "Pick one of the available accents." } };
  }
  if (!AVATAR_STYLE_IDS.includes(avatarStyle as never)) {
    return { errors: { avatarStyle: "Pick one of the available avatars." } };
  }
  if (!BANNER_IDS.includes(bannerStyle as never)) {
    return { errors: { bannerStyle: "Pick one of the available banners." } };
  }

  let title: string | null = null;
  if (explorerTitle) {
    const stats = await getUserStats(user.id);
    const earned = getAchievements(stats).filter((achievement) => achievement.earned);
    if (!earned.some((achievement) => achievement.label === explorerTitle)) {
      return { errors: { explorerTitle: "You haven't earned that title yet." } };
    }
    title = explorerTitle;
  }

  await db.user.update({
    where: { id: user.id },
    data: { accentColor, avatarStyle, bannerStyle, explorerTitle: title },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { saved: true };
}
