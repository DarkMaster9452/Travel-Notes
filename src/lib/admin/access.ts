import "server-only";

import type { Role } from "@prisma/client";

/**
 * Who may open what, and who may do what.
 *
 * One table, read by the screens that display it *and* by the guards that
 * enforce it, so "which tabs can this role open" has exactly one answer. A
 * matrix drawn on a page and a matrix checked on the server that were written
 * separately would eventually disagree, and the page is the one people would
 * believe.
 *
 * Roles are additive and ranked. Everything below is expressed as "at least
 * this rank", which is why there is no row anywhere saying what a writer
 * *cannot* do: a writer is a reader plus quests, and that is the whole rule.
 */

export type StaffRole = Extract<Role, "READER" | "WRITER" | "ADMIN" | "OWNER">;

export const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  READER: 1,
  WRITER: 2,
  ADMIN: 3,
  OWNER: 4,
};

/** The roles that can open the panel at all. */
export const STAFF_ROLES: StaffRole[] = ["READER", "WRITER", "ADMIN", "OWNER"];

export function isStaffRole(role: Role): role is StaffRole {
  return ROLE_RANK[role] >= ROLE_RANK.READER;
}

export function atLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export const ROLE_LABEL: Record<Role, string> = {
  USER: "Member",
  READER: "Reader",
  WRITER: "Writer",
  ADMIN: "Admin",
  OWNER: "Owner",
};

export type PanelTab = {
  href: string;
  label: string;
  what: string;
  /** The lowest rank that may open it. */
  needs: StaffRole;
  /** Match deeper routes too (`/admin/users/abc`). */
  prefix?: boolean;
  /** Show the pending-review count beside it. */
  badge?: "review";
};

export const PANEL_TABS: PanelTab[] = [
  { href: "/admin", label: "Dashboard", what: "Live counts and what needs a decision", needs: "READER" },
  { href: "/admin/review", label: "Review", what: "Read proof and decide", needs: "READER", badge: "review" },
  { href: "/admin/submissions", label: "Submissions", what: "The record, no verdicts", needs: "READER" },
  { href: "/admin/leaderboard", label: "Leaderboards", what: "Boards, sealed and open", needs: "READER" },
  { href: "/admin/quests", label: "Quests", what: "Write, edit and publish quests", needs: "WRITER", prefix: true },
  { href: "/admin/schedule", label: "Schedule", what: "Book a quest into a week or a month", needs: "WRITER" },
  { href: "/admin/locations", label: "Locations", what: "Trailheads and where they point", needs: "WRITER", prefix: true },
  { href: "/admin/users", label: "Users", what: "Accounts and what they hold", needs: "ADMIN", prefix: true },
  { href: "/admin/revenue", label: "Revenue", what: "Recurring revenue at list price", needs: "ADMIN" },
  { href: "/admin/database", label: "Database", what: "Read-only row counts and recent rows", needs: "ADMIN" },
  { href: "/admin/staff", label: "Staff settings", what: "The desk, the roles, the log", needs: "READER", prefix: true },
  { href: "/admin/access", label: "Panel access", what: "Who holds the keys", needs: "ADMIN" },
];

export function canOpen(role: Role, tab: PanelTab): boolean {
  return atLeast(role, tab.needs);
}

/** The tabs one role actually sees in the rail. */
export function tabsFor(role: Role): PanelTab[] {
  return PANEL_TABS.filter((tab) => canOpen(role, tab));
}

/* -------------------------------------------------------------------------- */
/* What each role may do                                                       */
/* -------------------------------------------------------------------------- */

export type Capability = { label: string; needs: Role; detail?: string };

/**
 * The matrix the staff page prints, as capabilities rather than as ticks.
 *
 * `needs: "USER"` marks the two things only a *member* has — an account with a
 * staff role has no quests and no subscription, so those rows are true of
 * members and of nobody at the desk.
 */
export const ROLE_MATRIX: Capability[] = [
  { label: "File proof against a quest", needs: "USER" },
  { label: "Hold a subscription and a sticker sheet", needs: "USER" },
  { label: "Open the review deck and decide proof", needs: "READER" },
  { label: "Read the submissions record and the boards", needs: "READER" },
  { label: "Write, edit and publish quests", needs: "WRITER" },
  { label: "Book a quest into a slot", needs: "WRITER" },
  { label: "Correct a name, an email or an allowance", needs: "ADMIN" },
  { label: "See revenue and the database browser", needs: "ADMIN" },
  { label: "Invite a reader or a writer", needs: "ADMIN" },
  { label: "Invite an admin", needs: "OWNER" },
  { label: "Take somebody's role away", needs: "OWNER" },
  { label: "Make somebody an owner", needs: "OWNER", detail: "database prompt only" },
];

/** The role descriptions on the staff page, in the design's own words. */
export const ROLE_NOTES: { role: StaffRole; what: string }[] = [
  {
    role: "READER",
    what: "Opens the review deck and decides submissions. Sees nothing about money.",
  },
  {
    role: "WRITER",
    what: "Everything a reader can, plus writing quests and booking them into slots.",
  },
  {
    role: "ADMIN",
    what: "Everything a writer can, plus users, billing and the database browser.",
  },
  {
    role: "OWNER",
    what: "Everything, plus the desk itself — invitations, revocations and panel access.",
  },
];

/** Which roles a given role may hand out. Never OWNER, from anywhere. */
export function invitableBy(role: Role): StaffRole[] {
  if (role === "OWNER") return ["READER", "WRITER", "ADMIN"];
  if (role === "ADMIN") return ["READER", "WRITER"];
  return [];
}
