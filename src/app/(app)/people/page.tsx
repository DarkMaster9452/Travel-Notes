import type { Metadata } from "next";
import Link from "next/link";

import { GroupStarter } from "@/components/sq/group-starter";
import { SqSegmentedLinks } from "@/components/sq/controls";
import { SqLocked } from "@/components/sq/locked";
import { Avatar, EmptyState, PageHeader } from "@/components/sq/ui";
import { accentInk } from "@/lib/accents";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getMyGroups } from "@/lib/groups";
import { getEntitlement } from "@/lib/entitlements";
import { getT } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n";
import { getDirectory, type DirectoryEntry } from "@/lib/profile";

export const metadata: Metadata = { title: "People & groups" };
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
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireClient();
  const params = await searchParams;
  const tab = params.tab === "groups" ? "groups" : "people";

  const [directory, groups, mine, entitlement, t] = await Promise.all([
    getDirectory(),
    getMyGroups(user.id),
    db.profile.findUnique({ where: { userId: user.id }, select: { published: true } }),
    getEntitlement(user.id),
    getT(user.id),
  ]);

  // Two different gates, because they are two different promises: the
  // directory is Explorer's partner matching, and a group is Ultra's private
  // crew. Both stay on screen either way — a capability nobody can see is a
  // capability nobody buys.
  const canMatch = entitlement.can("matching");
  const canCrew = entitlement.can("crews");

  return (
    <>
      <PageHeader
        kicker={t.people.directory}
        title={tab === "groups" ? t.people.groupsTitle : t.people.peopleTitle}
        lede={
          tab === "groups"
            ? t.people.groupsNote
            : t.people.directoryLede
        }
        right={
          <Link href="/settings/profile" className="sq-btn sq-btn-ghost">
            {mine?.published ? t.people.editYours : t.people.publishYours}
          </Link>
        }
      />

      <div style={{ marginBottom: 18 }}>
        <SqSegmentedLinks
          label={t.people.tabs}
          active={tab}
          options={[
            { key: "people", label: "People", href: "/people" },
            { key: "groups", label: `Groups${groups.length ? ` · ${groups.length}` : ""}`, href: "/people?tab=groups" },
          ]}
        />
      </div>

      {tab === "people" ? (
        !canMatch ? (
          <SqLocked capability="matching" plan="explorer">
            <PeopleGrid t={t} people={directory.slice(0, 8)} />
          </SqLocked>
        ) : directory.length === 0 ? (
          <EmptyState
            glyph="users"
            title={t.people.nobodyYet}
            body={t.people.nobodyYetBody}
            action={
              <Link href="/settings/profile" className="sq-btn sq-btn-primary sq-btn-sm">
                {t.people.publishYours}
              </Link>
            }
          />
        ) : (
          <PeopleGrid t={t} people={directory} />
        )
      ) : !canCrew ? (
        <SqLocked capability="crews" plan="ultra">
          <section className="sq-grid sq-grid-fit-md" style={{ alignItems: "start" }}>
            <div className="sq-card sq-pad-sm">
              <h2 className="sq-h2" style={{ fontSize: 19 }}>
                Tuesday nights
              </h2>
              <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
                Short ones after work, all year.
              </p>
            </div>
            <div className="sq-tinted sq-pad-sm">
              <h2 className="sq-h2" style={{ fontSize: 19 }}>
                Start a group
              </h2>
              <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
                Whoever you send the link to is in it.
              </p>
            </div>
          </section>
        </SqLocked>
      ) : (
        <section className="sq-grid sq-grid-fit-md" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {groups.length === 0 ? (
              <EmptyState
                glyph="users"
                title={t.people.noGroup}
                body={t.people.noGroupBody}
              />
            ) : (
              groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/people/groups/${group.slug}`}
                  className="sq-card sq-lift sq-pad-sm"
                  style={{ color: "var(--color-text)", display: "block" }}
                >
                  <div className="sq-section-head">
                    <h2 className="sq-h2" style={{ fontSize: 19 }}>
                      {group.name}
                    </h2>
                    <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                      {group.members} {group.members === 1 ? "member" : "members"}
                    </span>
                  </div>
                  {group.blurb ? (
                    <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
                      {group.blurb}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>

          <GroupStarter />
        </section>
      )}
    </>
  );
}

/** The directory grid, shared by the real list and the locked preview. */
function PeopleGrid({ people, t }: { people: DirectoryEntry[]; t: Messages }) {
  return (
    <section
      className="sq-stagger"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(216px,1fr))",
        gap: 14,
      }}
    >
      {people.map((person, index) => {
        const accent = accentInk(person.accent);
        return (
        <Link
          key={person.handle}
          href={`/people/${person.handle}`}
          className="sq-card sq-lift"
          style={{
            padding: 18,
            color: "var(--color-text)",
            // The accent is how somebody is recognisable in a grid of faces,
            // so it has to be on the card and not only on the page behind it.
            borderTop: `4px solid ${accent.ink}`,
            ["--i" as string]: index,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              padding: 4,
              borderRadius: 999,
              background: accent.wash,
              border: `1px solid ${accent.edge}`,
            }}
          >
            <Avatar name={person.name} size={44} />
          </span>
          <b
            style={{
              display: "block",
              marginTop: 12,
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 17,
              lineHeight: 1.2,
            }}
          >
            {person.name}
          </b>
          {person.headline ? (
            <span
              style={{
                display: "block",
                marginTop: 5,
                fontSize: 12.5,
                lineHeight: 1.45,
                color: "var(--ink-2)",
              }}
            >
              {person.headline}
            </span>
          ) : null}
          <span
            className="sq-kicker-sm"
            style={{
              display: "flex",
              gap: 12,
              marginTop: 14,
              paddingTop: 11,
              borderTop: "1px solid var(--line-2)",
              fontSize: 9.5,
              letterSpacing: "0.07em",
            }}
          >
            <i style={{ fontStyle: "normal" }}>{person.country ?? "—"}</i>
            <i style={{ fontStyle: "normal" }}>{t.people.logged(person.logged)}</i>
          </span>
        </Link>
        );
      })}
    </section>
  );
}
