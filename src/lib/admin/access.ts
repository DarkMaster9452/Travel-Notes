import "server-only";

import type { Role } from "@prisma/client";

/**
 * Who may open what.
 *
 * One table, read by the screens that display it *and* by the guard that
 * enforces it, so "which tabs can this role open" has exactly one answer. A
 * matrix drawn on a page and a matrix checked on the server that were written
 * separately would eventually disagree, and the page is the one people would
 * believe.
 *
 * Roles are additive: an owner can reach everything staff can, and staff can
 * reach everything a member can plus the panel.
 */

export type PanelTab = {
  href: string;
  label: string;
  what: string;
  /** The lowest role that may open it. */
  needs: Extract<Role, "ADMIN" | "OWNER">;
};

export const PANEL_TABS: PanelTab[] = [
  { href: "/admin", label: "Dashboard", what: "Live counts and what needs a decision", needs: "ADMIN" },
  { href: "/admin/review", label: "Review", what: "Read proof and decide", needs: "ADMIN" },
  { href: "/admin/submissions", label: "Submissions", what: "The record, no verdicts", needs: "ADMIN" },
  { href: "/admin/users", label: "Users", what: "Accounts and what they hold", needs: "ADMIN" },
  { href: "/admin/quests", label: "Quests", what: "Write, edit and publish quests", needs: "ADMIN" },
  { href: "/admin/schedule", label: "Schedule", what: "Book a quest into a week or a month", needs: "ADMIN" },
  { href: "/admin/locations", label: "Locations", what: "Trailheads and where they point", needs: "ADMIN" },
  { href: "/admin/leaderboard", label: "Leaderboards", what: "Boards, sealed and open", needs: "ADMIN" },
  { href: "/admin/revenue", label: "Revenue", what: "Recurring revenue at list price", needs: "ADMIN" },
  { href: "/admin/database", label: "Database", what: "Read-only row counts and recent rows", needs: "ADMIN" },
  { href: "/admin/staff", label: "Staff settings", what: "The desk, the roles, the log", needs: "ADMIN" },
  { href: "/admin/access", label: "Panel access", what: "Who holds the keys", needs: "OWNER" },
];

export function canOpen(role: Role, tab: PanelTab): boolean {
  if (tab.needs === "OWNER") return role === "OWNER";
  return role === "ADMIN" || role === "OWNER";
}

export type Capability = { label: string; member: boolean; staff: boolean; owner: boolean };

/** What each role may actually *do*, as the staff page prints it. */
export const ROLE_MATRIX: Capability[] = [
  { label: "File proof against a quest", member: true, staff: false, owner: false },
  { label: "Hold a subscription and a sticker sheet", member: true, staff: false, owner: false },
  { label: "Read proof and decide it", member: false, staff: true, owner: true },
  { label: "Write, edit and publish quests", member: false, staff: true, owner: true },
  { label: "Book a quest into a slot", member: false, staff: true, owner: true },
  { label: "Correct a name, an email or an allowance", member: false, staff: true, owner: true },
  { label: "Read the write log", member: false, staff: true, owner: true },
  { label: "Open Panel access", member: false, staff: false, owner: true },
  { label: "Take somebody's staff role away", member: false, staff: false, owner: true },
  { label: "Grant the staff role", member: false, staff: false, owner: false },
];
