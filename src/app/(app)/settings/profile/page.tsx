import type { Metadata } from "next";

import { ensureProfileAction } from "@/app/(app)/profile/public-actions";
import { SqProfileForm } from "@/components/sq/profile-form";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/**
 * The page about you.
 *
 * The profile row is created on first visit here rather than at signup: an
 * account that never opens this page should not have one, and a row that
 * exists but has never been published is indistinguishable from no row at all
 * to everybody except its owner.
 */
export default async function ProfileSettingsPage() {
  const user = await requireClient();
  await ensureProfileAction();

  const profile = await db.profile.findUnique({ where: { userId: user.id } });

  return (
    <SqProfileForm
      draft={{
        handle: profile?.handle ?? "",
        published: profile?.published ?? false,
        displayName: profile?.displayName ?? "",
        headline: profile?.headline ?? "",
        bio: profile?.bio ?? "",
        instagram: profile?.instagram ?? "",
        facebook: profile?.facebook ?? "",
        strava: profile?.strava ?? "",
        accent: profile?.accent ?? "PINE",
        showStats: profile?.showStats ?? true,
        showCountry: profile?.showCountry ?? true,
        showActivities: profile?.showActivities ?? true,
        showStickers: profile?.showStickers ?? true,
      }}
    />
  );
}
