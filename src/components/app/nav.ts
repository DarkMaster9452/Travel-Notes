import type { Messages } from "@/lib/i18n";

/**
 * The customer app's navigation (design/DESIGN-SYSTEM.md §6.5).
 *
 * The monthly quest leads, because the product turns around it. Icons are
 * named rather than passed: this list is built on the server and a component
 * cannot cross to the client, so the shell looks the icon up by name.
 */
export type AppNavIcon =
  | "monthly"
  | "dashboard"
  | "quests"
  | "leaderboard"
  | "stickers"
  | "submissions"
  | "people"
  | "settings";

export type AppNavItem = {
  href: string;
  label: string;
  /** A shorter label for the phone tab bar. */
  tabLabel?: string;
  icon: AppNavIcon;
  /** A count beside the label. Null renders nothing. */
  badge?: number | null;
  /** What the count means, for a screen reader. */
  badgeLabel?: string;
  /** A quiet note on the right (the plan beside Settings). */
  note?: string | null;
  /** Match the item as active for deeper routes too (`/quests/abc`). */
  prefix?: boolean;
  /** The monthly quest: carries the accent dot, and the raised tab on a phone. */
  feature?: boolean;
};

/** The sidebar, in order. */
export function appNav(pendingSubmissions: number, t: Messages): AppNavItem[] {
  return [
    { href: "/monthly", label: t.nav.monthly, tabLabel: t.app.shell.tabMonthly, icon: "monthly", feature: true },
    { href: "/dashboard", label: t.nav.dashboard, icon: "dashboard" },
    { href: "/quests", label: t.nav.quests, icon: "quests", prefix: true },
    { href: "/leaderboard", label: t.nav.leaderboard, icon: "leaderboard" },
    { href: "/stickers", label: t.nav.stickers, icon: "stickers" },
    {
      href: "/submissions",
      label: t.nav.submissions,
      icon: "submissions",
      badge: pendingSubmissions || null,
      badgeLabel: t.app.shell.waiting(pendingSubmissions),
    },
    { href: "/people", label: t.nav.people, icon: "people", prefix: true },
  ];
}

/** Below the sidebar's main list. */
export function appFootNav(planName: string, t: Messages): AppNavItem[] {
  return [{ href: "/settings", label: t.nav.settings, icon: "settings", note: planName, prefix: true }];
}

/** The phone tab bar: four destinations around the raised monthly quest. */
export const APP_TAB_HREFS = ["/dashboard", "/quests", "/monthly", "/leaderboard"] as const;

export function isActive(pathname: string, item: Pick<AppNavItem, "href" | "prefix">): boolean {
  if (pathname === item.href) return true;
  return Boolean(item.prefix) && pathname.startsWith(`${item.href}/`);
}
