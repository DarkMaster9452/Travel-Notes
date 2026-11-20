import type { Metadata } from "next";
import { Trophy, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { GroupMembership } from "@/components/app/group";
import { BoardList, BoardRow } from "@/components/domain/board";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { SegmentedLinks } from "@/components/ui/nav";
import { DetailGrid, PageHeader } from "@/components/ui/page";
import { requireClient } from "@/lib/auth/guards";
import { getGroup, getGroupBoard } from "@/lib/groups";
import { formatNumber, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { resolveSlot } from "@/lib/leaderboard";
import { slotDates, slotTitle } from "@/lib/quest/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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
  const { t, locale } = await getReader(user.id);
  const words = t.app.people;
  const { slug } = await params;
  const query = await searchParams;
  const period = query.period === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  const group = await getGroup(slug, user.id);
  if (!group) notFound();

  if (!group.isMember) {
    return (
      <>
        <PageHeader overline={t.groups.kicker} title={group.name} lede={group.blurb ?? undefined} />
        <Card>
          <EmptyState icon={Users} title={t.groups.notIn} action={<GroupMembership slug={group.slug} joined={false} />}>
            {t.groups.notInBody}
          </EmptyState>
        </Card>
      </>
    );
  }

  const board = await getGroupBoard(
    group.members.map((member) => member.userId),
    period,
  );
  // The group board is always the current window; no slot is picked here.
  const slot = resolveSlot(period);

  return (
    <>
      <PageHeader
        overline={`${t.groups.kicker} · ${plural(locale, group.members.length, words.members)}`}
        title={group.name}
        lede={group.blurb ?? undefined}
        actions={<GroupMembership slug={group.slug} joined isOwner={group.isOwner} />}
      />

      <DetailGrid
        aside={
          <Card>
            <CardHeader title={words.group.roster} note={words.group.membersOnly} />
            <ul className="divide-y divide-border">
              {group.members.map((member) => (
                <li key={member.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={member.name} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-body-sm">
                    {member.handle ? (
                      <a href={`/people/${member.handle}`} className="font-medium text-text no-underline hover:underline">
                        {member.name}
                      </a>
                    ) : (
                      member.name
                    )}
                  </span>
                  {member.role === "OWNER" ? <Badge size="sm">{words.group.owner}</Badge> : null}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-caption text-subtle">{words.group.linkNote}</p>
          </Card>
        }
      >
        <Card>
          <CardHeader
            title={slotTitle(slot, locale, t)}
            note={slotDates(slot, locale)}
            action={
              <SegmentedLinks
                label={t.groups.cadence}
                active={period}
                options={[
                  { key: "MONTHLY", label: t.leaderboard.monthlyTab, href: `/people/groups/${group.slug}` },
                  { key: "WEEKLY", label: t.leaderboard.weeklyTab, href: `/people/groups/${group.slug}?period=WEEKLY` },
                ]}
              />
            }
          />
          {board.rows.length === 0 ? (
            <EmptyState icon={Trophy} title={t.groups.nothingScored}>
              {t.groups.nothingScoredBody}
            </EmptyState>
          ) : (
            <BoardList aria-label={words.group.board}>
              {board.rows.map((row) => (
                <BoardRow
                  key={row.userId}
                  rank={row.rank}
                  name={row.username}
                  href={row.handle ? `/people/${row.handle}` : undefined}
                  leading={<Avatar name={row.username} size="sm" />}
                  score={formatNumber(locale, row.score)}
                  meta={`${plural(locale, row.quests, t.common.quests)}${row.tookFeatured ? ` · ${t.leaderboard.tookFeatured}` : ""}`}
                  me={row.userId === user.id}
                  meLabel={t.app.dashboard.you}
                />
              ))}
            </BoardList>
          )}
        </Card>
      </DetailGrid>
    </>
  );
}
