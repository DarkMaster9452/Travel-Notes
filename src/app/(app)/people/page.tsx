import type { Metadata } from "next";
import Link from "next/link";

import { GroupStarter } from "@/components/sq/group-starter";
import { SqSegmentedLinks } from "@/components/sq/controls";
import { SqLocked } from "@/components/sq/locked";
import { Avatar, EmptyState, PageHeader } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getMyGroups } from "@/lib/groups";
import { getEntitlement } from "@/lib/entitlements";
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

  const [directory, groups, mine, entitlement] = await Promise.all([
    getDirectory(),
    getMyGroups(user.id),
    db.profile.findUnique({ where: { userId: user.id }, select: { published: true } }),
    getEntitlement(user.id),
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
        kicker="Who else is out there"
        title={tab === "groups" ? "Groups" : "People"}
        lede={
          tab === "groups"
            ? "A group is a smaller board and a page to find each other on. Who is in one is visible to the people in it, and to nobody else."
            : "Everybody who has published a page. Nobody is here who has not chosen to be, and nothing here says whether anyone else has an account."
        }
        right={
          <Link href="/settings/profile" className="sq-btn sq-btn-ghost">
            {mine?.published ? "Edit your page" : "Publish your page"}
          </Link>
        }
      />

      <div style={{ marginBottom: 18 }}>
        <SqSegmentedLinks
          label="People or groups"
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
            <PeopleGrid people={directory.slice(0, 8)} />
          </SqLocked>
        ) : directory.length === 0 ? (
          <EmptyState
            glyph="users"
            title="Nobody has published a page yet"
            body="Publishing yours is what puts you here. It shows what you have logged, and nothing about your account."
            action={
              <Link href="/settings/profile" className="sq-btn sq-btn-primary sq-btn-sm">
                Publish your page
              </Link>
            }
          />
        ) : (
          <PeopleGrid people={directory} />
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
                title="You are not in a group"
                body="Start one and send the link to whoever you walk with. A group is a board of its own, on the same points as everything else."
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
function PeopleGrid({ people }: { people: DirectoryEntry[] }) {
  return (
    <section
      className="sq-stagger"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(216px,1fr))",
        gap: 14,
      }}
    >
      {people.map((person, index) => (
        <Link
          key={person.handle}
          href={`/people/${person.handle}`}
          className="sq-card sq-lift"
          style={{ padding: 18, color: "var(--color-text)", ["--i" as string]: index }}
        >
          <Avatar name={person.name} size={48} />
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
            <i style={{ fontStyle: "normal" }}>{person.logged} logged</i>
          </span>
        </Link>
      ))}
    </section>
  );
}
