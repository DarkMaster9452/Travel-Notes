import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GroupMembership } from "@/components/sq/group-membership";
import { SqSegmentedLinks } from "@/components/sq/controls";
import { Avatar, Bar, EmptyState, PageHeader, Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { getGroup, getGroupBoard } from "@/lib/groups";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

/**
 * A group page.
 *
 * A non-member sees the name, the line about it and a way in — enough for an
 * invite link to mean something. The roster and the board are for the people
 * in it, checked on the server, because that is the only place the check
 * counts.
 */
export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await requireClient();
  const { slug } = await params;
  const query = await searchParams;
  const period = query.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  const group = await getGroup(slug, user.id);
  if (!group) notFound();

  if (!group.isMember) {
    return (
      <>
        <PageHeader kicker="Group" title={group.name} lede={group.blurb ?? undefined} />
        <EmptyState
          glyph="users"
          title="You are not in this group"
          body="Who is in a group is visible to the people in it. Join with the link somebody sent you and the roster and the board open up."
          action={<GroupMembership slug={group.slug} joined={false} />}
        />
      </>
    );
  }

  const board = await getGroupBoard(
    group.members.map((member) => member.userId),
    period,
  );

  const leader = board.rows[0]?.score ?? 0;

  return (
    <>
      <PageHeader
        kicker={`Group · ${group.members.length} ${group.members.length === 1 ? "member" : "members"}`}
        title={group.name}
        lede={group.blurb ?? undefined}
        right={<GroupMembership slug={group.slug} joined isOwner={group.isOwner} />}
      />

      <section className="sq-grid sq-grid-fit-md" style={{ alignItems: "start" }}>
        <article className="sq-card" style={{ overflow: "hidden" }}>
          <div className="sq-section-head sq-rule-head">
            <h2 className="sq-h2">
              {board.label} · {board.dates}
            </h2>
            <SqSegmentedLinks
              label="Board cadence"
              active={period}
              options={[
                { key: "MONTHLY", label: "Monthly", href: `/people/groups/${group.slug}` },
                { key: "WEEKLY", label: "Weekly", href: `/people/groups/${group.slug}?period=WEEKLY` },
              ]}
            />
          </div>

          {board.rows.length === 0 ? (
            <div style={{ padding: 26 }}>
              <EmptyState
                glyph="laurel"
                title="Nothing scored in this window"
                body="Approved proof is what puts somebody on a board. Nobody in the group has any inside these dates yet."
              />
            </div>
          ) : (
            <ul className="sq-stagger">
              {board.rows.map((row, index) => (
                <li
                  key={row.userId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px 32px minmax(120px,1fr) minmax(50px,110px) 56px",
                    gap: 12,
                    alignItems: "center",
                    padding: "11px 22px",
                    borderTop: "1px solid var(--line-2)",
                    background: row.userId === user.id ? "var(--paper-2)" : "transparent",
                    borderLeft: `2px solid ${row.userId === user.id ? "var(--signal)" : "transparent"}`,
                    ["--i" as string]: index,
                  }}
                >
                  <span className="sq-mono" style={{ fontSize: 14, color: "var(--ink-3)" }}>
                    {row.rank}
                  </span>
                  <Avatar name={row.username} size={32} square />
                  <span style={{ minWidth: 0 }}>
                    {row.handle ? (
                      <Link href={`/people/${row.handle}`} style={{ color: "var(--color-text)" }}>
                        <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{row.username}</b>
                      </Link>
                    ) : (
                      <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{row.username}</b>
                    )}
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                      {row.quests} {row.quests === 1 ? "quest" : "quests"}
                      {row.tookFeatured ? " · took the featured one" : ""}
                    </span>
                  </span>
                  <Bar pct={leader === 0 ? 0 : (row.score / leader) * 100} />
                  <b
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 600,
                      fontSize: 19,
                      textAlign: "right",
                    }}
                  >
                    {row.score}
                  </b>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="sq-card-flat">
          <div className="sq-section-head sq-rule-head">
            <h2 className="sq-h2">Who is in it</h2>
            <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
              Members only
            </span>
          </div>
          <ul>
            {group.members.map((member) => (
              <li
                key={member.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 22px",
                  borderTop: "1px solid var(--line-2)",
                }}
              >
                <Avatar name={member.name} size={32} square />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
                  {member.handle ? (
                    <Link href={`/people/${member.handle}`} style={{ color: "var(--color-text)" }}>
                      {member.name}
                    </Link>
                  ) : (
                    member.name
                  )}
                </span>
                {member.role === "OWNER" ? <Tag small>Owner</Tag> : null}
              </li>
            ))}
          </ul>
          <p style={{ padding: "14px 22px", fontSize: 12.5, color: "var(--ink-3)" }}>
            Anybody with this page&rsquo;s link can join. Send it to whoever you walk with.
          </p>
        </article>
      </section>
    </>
  );
}
