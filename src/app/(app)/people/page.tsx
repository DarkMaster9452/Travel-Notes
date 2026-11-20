import type { Metadata } from "next";
import { Users } from "lucide-react";

import { GroupStarter } from "@/components/app/group";
import { Locked } from "@/components/app/locked";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardLink } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { TabsNav } from "@/components/ui/nav";
import { PageHeader } from "@/components/ui/page";
import { type } from "@/components/ui/typography";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import type { Locale, Messages } from "@/lib/i18n";
import { countryName, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { getMyGroups } from "@/lib/groups";
import { getDirectory, type DirectoryEntry } from "@/lib/profile";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.people.title };
}
export const dynamic = "force-dynamic";

/**
 * Two halves of the same question: who else is out there, and who am I walking
 * with. People first, because that is the half that works without anybody
 * having organised anything.
 *
 * Only published pages appear. Nothing here says whether anybody else has an
 * account — the directory is a list of people who chose to be listed, and a
 * count that included the unlisted would give the rest away.
 */
export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireClient();
  const params = await searchParams;
  const tab = params.tab === "groups" ? "groups" : "people";

  const [directory, groups, mine, entitlement, reader] = await Promise.all([
    getDirectory(),
    getMyGroups(user.id),
    db.profile.findUnique({ where: { userId: user.id }, select: { published: true } }),
    getEntitlement(user.id),
    getReader(user.id),
  ]);
  const { t, locale } = reader;
  const words = t.app.people;

  // Two different gates, because they are two different promises: the
  // directory is Explorer's partner matching, and a group is Ultra's private
  // crew. Both stay on screen either way — a capability nobody can see is a
  // capability nobody buys.
  const canMatch = entitlement.can("matching");
  const canCrew = entitlement.can("crews");

  return (
    <>
      <PageHeader
        title={tab === "groups" ? t.people.groupsTitle : t.people.peopleTitle}
        lede={tab === "groups" ? t.people.groupsNote : t.people.directoryLede}
        actions={
          <ButtonLink href="/settings/profile" variant="secondary">
            {mine?.published ? t.people.editYours : t.people.publishYours}
          </ButtonLink>
        }
      />

      <TabsNav
        className="mb-6"
        label={t.people.tabs}
        active={tab}
        options={[
          { key: "people", label: words.people, href: "/people" },
          {
            key: "groups",
            label: groups.length ? `${words.groups} · ${groups.length}` : words.groups,
            href: "/people?tab=groups",
          },
        ]}
      />

      {tab === "people" ? (
        !canMatch ? (
          <Locked capability="matching" plan="explorer">
            <PeopleGrid t={t} locale={locale} people={directory.slice(0, 6)} />
          </Locked>
        ) : directory.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title={t.people.nobodyYet}
              action={<ButtonLink href="/settings/profile">{t.people.publishYours}</ButtonLink>}
            >
              {t.people.nobodyYetBody}
            </EmptyState>
          </Card>
        ) : (
          <PeopleGrid t={t} locale={locale} people={directory} />
        )
      ) : !canCrew ? (
        <Locked capability="crews" plan="ultra">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className={type.h3}>{t.groups.namePlaceholder}</h2>
              <p className="mt-2 text-body-sm text-muted">{t.groups.blurbPlaceholder}</p>
            </Card>
            <Card>
              <h2 className={type.h3}>{words.starter.title}</h2>
              <p className="mt-2 text-body-sm text-muted">{words.starter.body}</p>
            </Card>
          </div>
        </Locked>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 md:items-start lg:gap-6">
          <div className="flex flex-col gap-4">
            {groups.length === 0 ? (
              <Card>
                <EmptyState icon={Users} title={t.people.noGroup}>
                  {t.people.noGroupBody}
                </EmptyState>
              </Card>
            ) : (
              groups.map((group) => (
                <CardLink key={group.id} href={`/people/groups/${group.slug}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className={type.h3}>{group.name}</h2>
                    <span className="text-caption text-muted">{plural(locale, group.members, words.members)}</span>
                  </div>
                  {group.blurb ? <p className="mt-2 text-body-sm text-muted">{group.blurb}</p> : null}
                </CardLink>
              ))
            )}
          </div>

          <GroupStarter />
        </div>
      )}
    </>
  );
}

/** The directory grid, shared by the real list and the locked preview. */
function PeopleGrid({ people, t, locale }: { people: DirectoryEntry[]; t: Messages; locale: Locale }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {people.map((person) => (
        <li key={person.handle} className="flex">
          <CardLink href={`/people/${person.handle}`} className="flex w-full flex-col gap-3">
            {/* The profile colour is how somebody is recognisable in a grid of
                faces, so it is on the card and not only on the page behind it. */}
            <Avatar name={person.name} accent={person.accent} size="lg" />
            <div className="min-w-0">
              <h2 className={type.h4}>{person.name}</h2>
              {person.headline ? <p className="mt-1 text-body-sm text-muted">{person.headline}</p> : null}
            </div>
            <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-caption text-muted">
              <span>{person.country ? countryName(locale, person.country) : t.common.none}</span>
              <span>{t.people.logged(person.logged)}</span>
            </p>
          </CardLink>
        </li>
      ))}
    </ul>
  );
}

