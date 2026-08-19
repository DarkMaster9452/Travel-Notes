import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/app/motion";
import { ProfileFeed } from "@/components/app/profile-feed";
import { Avatar, Panel, PanelHead, QuestArt, Sticker, Tag } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { stagger } from "@/lib/motion";
import { getPublicProfile, type SocialKey } from "@/lib/profile";
import { formatDate } from "@/lib/utils";

type Params = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const user = await requireClient();
  const { handle } = await params;
  const profile = await getPublicProfile(handle, user.id);
  return {
    title: profile ? profile.name : "Profile",
    // Members' pages are for the person you are about to meet at a trailhead,
    // not for a search engine. Even the published ones stay out of the index.
    robots: { index: false, follow: false },
  };
}

const SOCIAL_LABEL: Record<SocialKey, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  strava: "Strava",
};

/**
 * Somebody's page.
 *
 * Signed-in only, and only for a profile its owner has published — the one
 * exception being the owner, who can always see their own so the editor has
 * something to preview. `getPublicProfile` is what decides that; nothing here
 * repeats the rule.
 *
 * A handle that does not exist and a handle that exists but is not published
 * both come back as not-found, deliberately: otherwise the 404 tells you who
 * has an account.
 */
export default async function ProfilePage({ params }: Params) {
  const user = await requireClient();
  const { handle } = await params;

  const profile = await getPublicProfile(handle, user.id);
  if (!profile) notFound();

  return (
    <>
      {/* The banner. The same generated landscape a quest wears, seeded from
          the handle and inked in the colour they picked — so a profile is
          recognisable at a glance without anybody uploading anything. */}
      <Reveal className="profile-banner" data-accent={profile.accent.toLowerCase()}>
        <QuestArt seed={`profile:${profile.handle}`} variant="band" className="profile-band" />
        <div className="profile-identity">
          <Avatar name={profile.name} className="profile-avatar" />
          <div>
            <h1>{profile.name}</h1>
            {profile.headline && <p className="profile-headline">{profile.headline}</p>}
            <p className="profile-meta">
              {profile.country && <span>{profile.country}</span>}
              <span>Walking since {formatDate(profile.joinedAt)}</span>
            </p>
          </div>
          {profile.isSelf && (
            <Link href="/profile/public" className="btn btn-ghost btn-sm profile-edit">
              Edit your page
            </Link>
          )}
        </div>
      </Reveal>

      {profile.isSelf && !profile.published && (
        <Reveal className="mb-5">
          <div className="safety mt-0">
            <span aria-hidden="true" />
            <p>
              <b>Only you can see this.</b> It stays that way until you publish it, and
              un-publishing takes it away again straight after.{" "}
              <Link href="/profile/public" className="underline">
                Publish it
              </Link>
            </p>
          </div>
        </Reveal>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr] lg:items-start">
        <div className="flex flex-col gap-5">
          {profile.bio && (
            <Reveal delay={stagger(0)}>
              <Panel flush>
                <PanelHead title="About" />
                <p className="profile-bio">{profile.bio}</p>
              </Panel>
            </Reveal>
          )}

          {profile.stats && (
            <Reveal delay={stagger(1)}>
              <Panel flush>
                <PanelHead title="What they have logged" />
                <ul className="quest-facts">
                  <li>
                    <span>Quests</span>
                    <b>{profile.stats.logged}</b>
                  </li>
                  <li>
                    <span>Kilometres</span>
                    <b>{profile.stats.km}</b>
                  </li>
                  <li>
                    <span>Metres up</span>
                    <b>{profile.stats.up}</b>
                  </li>
                  <li>
                    <span>Regions</span>
                    <b>
                      {profile.stats.regions} in {profile.stats.countries}{" "}
                      {profile.stats.countries === 1 ? "country" : "countries"}
                    </b>
                  </li>
                </ul>
              </Panel>
            </Reveal>
          )}

          {profile.socials.length > 0 && (
            <Reveal delay={stagger(2)}>
              <Panel flush>
                <PanelHead title="Elsewhere" />
                <ul className="profile-socials">
                  {profile.socials.map((social) => (
                    <li key={social.key}>
                      <a href={social.href} target="_blank" rel="noreferrer nofollow">
                        <span>{SOCIAL_LABEL[social.key]}</span>
                        <b>@{social.handle}</b>
                      </a>
                    </li>
                  ))}
                </ul>
              </Panel>
            </Reveal>
          )}

          {profile.stickers.length > 0 && (
            <Reveal delay={stagger(3)}>
              <Panel flush>
                <PanelHead
                  title="Earned"
                  aside={<Tag tone="ghost">{profile.stickers.length}</Tag>}
                />
                <ul className="profile-stickers">
                  {profile.stickers.map((sticker) => (
                    <li key={sticker.id}>
                      <Sticker achievementKey={sticker.sticker} title={sticker.label} />
                    </li>
                  ))}
                </ul>
              </Panel>
            </Reveal>
          )}
        </div>

        <Reveal delay={stagger(1)}>
          <ProfileFeed activities={profile.activities} name={profile.name} />
        </Reveal>
      </div>
    </>
  );
}
