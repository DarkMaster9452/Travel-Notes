import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { ProfileEditor } from "@/components/app/profile-editor";
import { Eyebrow, IconShield, Tag } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { ensureProfileAction } from "@/app/(app)/profile/public-actions";

export const metadata: Metadata = { title: "Your public page" };
export const dynamic = "force-dynamic";

/**
 * Editing your own page.
 *
 * The row is created here, on first visit, rather than at signup: an account
 * that never opens this page has no profile at all, which is a stronger
 * default than an unpublished one nobody asked for.
 */
export default async function PublicProfileSettingsPage() {
  await requireClient();
  const profile = await ensureProfileAction();

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>For the people you might walk with</Eyebrow>
          <h1>Your public page.</h1>
          <p>
            Somewhere for the person deciding whether to spend a Saturday with you. Off until you
            say otherwise, and off again the moment you change your mind.
          </p>
        </div>
        <Tag tone={profile.published ? "pine" : "ghost"}>
          {profile.published ? "Published" : "Private"}
        </Tag>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <ProfileEditor
          draft={{
            handle: profile.handle,
            published: profile.published,
            displayName: profile.displayName ?? "",
            headline: profile.headline ?? "",
            bio: profile.bio ?? "",
            instagram: profile.instagram ?? "",
            facebook: profile.facebook ?? "",
            strava: profile.strava ?? "",
            accent: profile.accent,
            showStats: profile.showStats,
            showCountry: profile.showCountry,
            showActivities: profile.showActivities,
            showStickers: profile.showStickers,
          }}
        />

        <Reveal className="flex flex-col gap-4">
          <div className="safety mt-0">
            <IconShield />
            <p>
              <b>What is never on it.</b> Your email, your exact location, anything you have filed
              that has not been approved, and anything you have switched off below. Where you set
              out from is a country and stays a country — nothing in the product asks for more
              precision than that, so nothing can leak it.
            </p>
          </div>

          <div className="safety mt-0">
            <IconShield />
            <p>
              Published pages are visible to signed-in accounts only, and are kept out of search
              engines. The full version of this is in{" "}
              <Link href="/rules#people" className="underline">
                the rules
              </Link>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </>
  );
}
