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

/**
 * The panel rail is built from the access table, not written out twice.
 *
 * The layout passes in the tabs this role may open (`tabsFor`), so a reader
 * simply does not see Revenue rather than seeing it and being bounced — and
 * the rail cannot drift from what the guards allow, because there is only one
 * list.
 *
 * The last two tabs are the desk itself and sit in the footer, away from the
 * work.
 */
const FOOTER_TABS = new Set(["/admin/staff", "/admin/access"]);

export type PanelTabInput = {
  href: string;
  label: string;
  prefix?: boolean;
  badge?: "review";
};

export function adminNav(tabs: PanelTabInput[], pendingReviews: number): SqNavItem[] {
  return tabs
    .filter((tab) => !FOOTER_TABS.has(tab.href))
    .map((tab) => ({
      href: tab.href,
      label: tab.label,
      prefix: tab.prefix,
      badge: tab.badge === "review" ? pendingReviews || null : null,
    }));
}

export function adminFootNav(tabs: PanelTabInput[]): SqNavItem[] {
  return tabs
    .filter((tab) => FOOTER_TABS.has(tab.href))
    .map((tab) => ({ href: tab.href, label: tab.label, prefix: tab.prefix }));
}

export function isActive(pathname: string, item: SqNavItem): boolean {
  if (pathname === item.href) return true;
  return Boolean(item.prefix) && pathname.startsWith(`${item.href}/`);
}
