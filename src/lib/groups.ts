import "server-only";

import { db } from "@/lib/db";
import { getLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";

/**
 * Groups.
 *
 * The rule that shapes every function here: a group's roster is visible to its
 * members and to nobody else. Not to signed-in strangers, not through a
 * directory count, not by a 404 that differs from a 403. Everything below
 * either takes a reader id and checks membership, or returns only what a
 * non-member is allowed to know, which is the name and that it exists.
 */

export type GroupSummary = {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  members: number;
  /** True when the reader is in it. */
  joined: boolean;
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** A slug nobody else holds, derived from the name they typed. */
export async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "group";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await db.group.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** The groups this reader is in. */
export async function getMyGroups(userId: string): Promise<GroupSummary[]> {
  const rows = await db.groupMembership.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: {
      group: {
        select: {
          id: true,
          slug: true,
          name: true,
          blurb: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.group.id,
    slug: row.group.slug,
    name: row.group.name,
    blurb: row.group.blurb,
    members: row.group._count.members,
    joined: true,
  }));
}

export type GroupDetail = {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  isMember: boolean;
  isOwner: boolean;
  members: {
    userId: string;
    name: string;
    handle: string | null;
    role: "OWNER" | "MEMBER";
    joinedAt: Date;
  }[];
};

/**
 * One group, as this reader may see it.
 *
 * A non-member gets the name and the blurb and an empty roster: enough for an
 * invite link to mean something, and nothing that says who is inside.
 */
export async function getGroup(slug: string, readerId: string): Promise<GroupDetail | null> {
  const group = await db.group.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      blurb: true,
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          userId: true,
          role: true,
          joinedAt: true,
          user: {
            select: { name: true, profile: { select: { handle: true, published: true } } },
          },
        },
      },
    },
  });
  if (!group) return null;

  const mine = group.members.find((member) => member.userId === readerId) ?? null;

  return {
    id: group.id,
    slug: group.slug,
    name: group.name,
    blurb: group.blurb,
    isMember: mine !== null,
    isOwner: mine?.role === "OWNER",
    members: mine
      ? group.members.map((member) => ({
          userId: member.userId,
          name: member.user.name,
          handle: member.user.profile?.published ? member.user.profile.handle : null,
          role: member.role,
          joinedAt: member.joinedAt,
        }))
      : [],
  };
}

/**
 * A group's board: the shared board, filtered to the roster and re-ranked.
 *
 * Deliberately not a second scoring path. The points are the product's points;
 * a group board that scored differently would be a second answer to the one
 * question the leaderboard exists to answer.
 */
export async function getGroupBoard(
  memberIds: string[],
  period: "WEEKLY" | "MONTHLY",
  slotKey?: string,
): Promise<{ label: string; dates: string; rows: LeaderboardRow[] }> {
  const board = await getLeaderboard(period, slotKey);
  const inGroup = new Set(memberIds);

  const rows = board.rows
    .filter((row) => inGroup.has(row.userId))
    .map((row, index, all) => ({
      ...row,
      rank: index + 1,
      behindLeader: all[0] ? all[0].score - row.score : 0,
      toOvertake: index === 0 ? 0 : all[index - 1].score - row.score,
    }));

  return { label: board.label, dates: board.dates, rows };
}
