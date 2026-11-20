import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { ActivityGrid } from "@/components/domain/activity-grid";
import { Sticker } from "@/components/domain/sticker";
import { tagLabel } from "@/components/domain/trail";
import { Avatar } from "@/components/ui/avatar";
import { Badge, tagTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageStack, StatCard, StatRow } from "@/components/ui/page";
import { Overline, type } from "@/components/ui/typography";
import { accentInk } from "@/lib/accents";
import { requireClient } from "@/lib/auth/guards";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { formatDistance, formatHeight, formatMinutes } from "@/lib/i18n/units";
import { getPublicProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle}` };
}

/**
 * Somebody's page.
 *
 * A page about a person for the people they might walk with: what they have
 * logged, what they have said about it, where else to find them. Every section
 * is a switch they hold, and a section switched off is simply absent — never
 * shown as a blank, because an empty profile should read as private rather
 * than as unfinished.
 *
 * It is the one screen that is allowed to be *theirs*: the account's profile
 * colour prints the band behind their name and their avatar
 * (design/DESIGN-SYSTEM.md §1.5).
 *
 * An unpublished handle and a handle that does not exist are indistinguishable
 * from here, on purpose: the directory must not be usable to confirm that
 * somebody has an account.
 */
export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const user = await requireClient();
  const { handle } = await params;
  const { t, locale, units } = await getReader(user.id);

  const profile = await getPublicProfile(handle, user.id, locale);
  if (!profile) notFound();

  const accent = accentInk(profile.accent);
  const first = profile.name.trim().split(/\s+/)[0] ?? profile.name;
  const walked = profile.months.reduce((sum, month) => sum + month.count, 0);

  return (
    <PageStack>
      {/* --- who ------------------------------------------------------------- */}
      <Card pad="none" className="overflow-hidden">
        <div
          className="flex h-24 items-start justify-between gap-3 border-b border-(--accent-edge) bg-(--accent-wash) p-5 text-(--accent-deep) md:h-32"
          style={{
            ["--accent-wash" as string]: accent.wash,
            ["--accent-edge" as string]: accent.edge,
            ["--accent-deep" as string]: accent.deep,
          }}
        >
          <Overline className="text-(--accent-deep)">
            {t.app.people.profile.handleLine(profile.handle)}
            {profile.country ? ` · ${profile.country}` : ""}
          </Overline>
          <span className="text-caption">{t.profile.since(formatDate(locale, profile.joinedAt, "monthYear"))}</span>
        </div>

        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <Avatar
              name={profile.name}
              accent={profile.accent}
              size="xl"
              className="-mt-16 ring-4 ring-surface md:-mt-20"
            />
            <div>
              <h1 className={type.h1}>{profile.name}</h1>
              {profile.headline ? <p className="mt-1 max-w-text text-body text-muted">{profile.headline}</p> : null}
            </div>
          </div>
          {profile.isSelf ? (
            <ButtonLink href="/settings/profile">{t.profile.editYourPage}</ButtonLink>
          ) : (
            <ButtonLink href="/people?tab=groups" variant="secondary">
              {t.profile.walkTogether}
            </ButtonLink>
          )}
        </div>
      </Card>

      {profile.stats ? (
        <StatRow>
          <StatCard value={formatNumber(locale, profile.stats.logged)} label={t.profile.logged} />
          <StatCard value={formatDistance(locale, Math.round(profile.stats.km), units)} label={t.profile.kilometres} />
          <StatCard value={formatHeight(locale, profile.stats.up, units)} label={t.profile.metresUp} />
          <StatCard value={formatNumber(locale, profile.stats.regions)} label={t.profile.regions} />
        </StatRow>
      ) : null}

      {profile.activityGrid ? (
        <Card>
          <CardHeader
            title={t.profile.yearHeading}
            note={walked === 0 ? t.profile.nothingApproved : t.profile.walked(walked)}
          />
          <ActivityGrid grid={profile.activityGrid} name={first} locale={locale} t={t} />
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 md:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          {profile.bio ? (
            <Card>
              <CardHeader title={t.profile.about} />
              <p className="text-body-sm text-muted text-pretty">{profile.bio}</p>
            </Card>
          ) : null}

          {profile.socials.length > 0 ? (
            <Card>
              <CardHeader title={t.profile.elsewhere} />
              <ul className="divide-y divide-border">
                {profile.socials.map((social) => (
                  <li key={social.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-overline font-semibold uppercase text-subtle">{social.key}</span>
                    <a
                      href={social.href}
                      rel="noreferrer noopener nofollow"
                      target="_blank"
                      className="inline-flex min-w-0 items-center gap-1 text-body-sm font-semibold text-primary underline underline-offset-2"
                    >
                      <span className="truncate">{social.handle}</span>
                      <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {profile.stickers.length > 0 ? (
            <Card>
              <CardHeader title={t.profile.earnedHeading} note={formatNumber(locale, profile.stickers.length)} />
              <ul className="flex flex-wrap gap-3">
                {profile.stickers.map((sticker) => (
                  <li key={sticker.id}>
                    <Sticker sticker={sticker.sticker} size="md" title={sticker.label} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader title={t.profile.walkedHeading(first)} note={t.profile.approvedOnly} />
          {profile.activities.length === 0 ? (
            <p className="text-body-sm text-muted">{t.profile.nothingHere}</p>
          ) : (
            <ul className="divide-y divide-border">
              {profile.activities.map((activity) => (
                <li key={activity.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className={type.h4}>{activity.title}</h3>
                    <span className="shrink-0 text-caption tabular-nums text-subtle">
                      {formatDate(locale, activity.loggedAt)}
                    </span>
                  </div>
                  <p className="text-caption text-muted">
                    {activity.location} · {activity.region}
                    {activity.retreated ? ` · ${t.profile.retreat}` : ""}
                  </p>
                  {activity.tags.length > 0 ? (
                    <ul className="flex flex-wrap gap-1">
                      {[...new Set(activity.tags)].slice(0, 5).map((tag) => {
                        const label = tagLabel(tag, t);
                        return (
                          <li key={tag}>
                            <Badge tone={tagTone(label)}>{label}</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  <dl className="grid grid-cols-3 divide-x divide-border rounded-control bg-surface-sunken">
                    {[
                      {
                        label: t.trail.distance,
                        value: activity.distance != null ? formatDistance(locale, activity.distance, units) : t.common.none,
                      },
                      {
                        label: t.trail.ascent,
                        value: activity.elevation != null ? formatHeight(locale, activity.elevation, units) : t.common.none,
                      },
                      {
                        label: t.trail.time,
                        value: activity.movingTime != null ? formatMinutes(activity.movingTime) : t.common.none,
                      },
                    ].map((fact) => (
                      <div key={fact.label} className="flex min-w-0 flex-col-reverse px-3 py-2">
                        <dt className="text-caption text-muted">{fact.label}</dt>
                        <dd className="text-body-sm font-semibold tabular-nums">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-body-sm text-muted text-pretty">{activity.note}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageStack>
  );
}
