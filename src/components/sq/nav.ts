/**
 * The two rails.
 *
 * Which one renders is decided by the route the request landed on, not by a
 * flag carried around beside it — there is exactly one place in the product
 * where "is this the panel?" is answered, and it is `isAdminPath`.
 */

export type SqNavItem = {
  href: string;
  label: string;
  /** Right-aligned count, mono, stamp ink. Null renders nothing. */
  badge?: number | null;
  /** Right-aligned note, mono, tertiary ink. Footer items only. */
  note?: string | null;
  /** Match the item as active for deeper routes too (`/quests/abc`). */
  prefix?: boolean;
};

export function memberNav(pendingSubmissions: number): SqNavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/monthly", label: "The monthly" },
    { href: "/quests", label: "Quest database", prefix: true },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/stickers", label: "Stickers" },
    { href: "/submissions", label: "Submissions", badge: pendingSubmissions || null },
    { href: "/people", label: "People & groups", prefix: true },
  ];
}

export function memberFootNav(planName: string): SqNavItem[] {
  return [{ href: "/settings", label: "Settings", note: planName, prefix: true }];
}

export function adminNav(pendingReviews: number): SqNavItem[] {
  return [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/review", label: "Review", badge: pendingReviews || null },
    { href: "/admin/submissions", label: "Submissions" },
    { href: "/admin/users", label: "Users", prefix: true },
    { href: "/admin/quests", label: "Quests", prefix: true },
    { href: "/admin/schedule", label: "Schedule" },
    { href: "/admin/locations", label: "Locations", prefix: true },
    { href: "/admin/leaderboard", label: "Leaderboards" },
    { href: "/admin/revenue", label: "Revenue" },
    { href: "/admin/database", label: "Database" },
  ];
}

export function adminFootNav(): SqNavItem[] {
  return [
    { href: "/admin/staff", label: "Staff settings", prefix: true },
    { href: "/admin/access", label: "Panel access" },
  ];
}

export function isActive(pathname: string, item: SqNavItem): boolean {
  if (pathname === item.href) return true;
  return Boolean(item.prefix) && pathname.startsWith(`${item.href}/`);
}
