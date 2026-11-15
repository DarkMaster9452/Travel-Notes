"use client";

import {
  ClipboardCheck,
  Compass,
  Ellipsis,
  House,
  LogOut,
  Mountain,
  Settings,
  Sticker,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { APP_TAB_HREFS, isActive, type AppNavIcon, type AppNavItem } from "@/components/app/nav";
import { useT } from "@/components/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/**
 * The customer app's shell (design/DESIGN-SYSTEM.md §6.5).
 *
 *   ≥ lg   a 248 px sidebar on `surface`, the page beside it, and an optional
 *          320 px rail from `xl`
 *   < lg   a 56 px top bar and a 64 px tab bar: Dashboard · Quests · the
 *          monthly quest raised in the middle · Leaderboard · More
 *
 * The furniture is outside every route's render, so it never re-animates;
 * only the page does.
 */

const ICONS: Record<AppNavIcon, LucideIcon> = {
  monthly: Mountain,
  dashboard: House,
  quests: Compass,
  leaderboard: Trophy,
  stickers: Sticker,
  submissions: ClipboardCheck,
  people: Users,
  settings: Settings,
};

export type AppShellProps = {
  nav: AppNavItem[];
  footNav: AppNavItem[];
  account: {
    href: string;
    name: string;
    /** The plan's name. */
    note: string;
    avatar?: string | null;
  };
  /** The server action that ends the session. A POST, never a link. */
  signOut: () => Promise<void>;
  /** The third column on wide screens; empty for screens without one. */
  rail?: React.ReactNode;
  /** Anything the product needs to say before the page says anything. */
  notice?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ nav, footNav, account, signOut, rail, notice, children }: AppShellProps) {
  const pathname = usePathname();
  const t = useT();
  const [more, setMore] = useState(false);

  const tabs = APP_TAB_HREFS.map((href) => nav.find((item) => item.href === href)).filter(
    (item): item is AppNavItem => Boolean(item),
  );
  const rest = [...nav.filter((item) => !tabs.includes(item)), ...footNav];
  const restActive = rest.some((item) => isActive(pathname, item));

  return (
    <div className="min-h-dvh">
      {/* --- sidebar, lg and up ------------------------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-nav hidden w-62 flex-col border-r border-border bg-surface lg:flex">
        <Link
          href="/dashboard"
          aria-label={t.shell.brand}
          className="flex h-16 shrink-0 items-center px-5 no-underline"
        >
          <Logo />
        </Link>

        <nav aria-label={t.app.shell.main} className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {nav.map((item) => (
            <SideLink key={item.href} item={item} active={isActive(pathname, item)} />
          ))}
          <div className="mt-auto flex flex-col gap-1 pt-4">
            {footNav.map((item) => (
              <SideLink key={item.href} item={item} active={isActive(pathname, item)} />
            ))}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
          <Link
            href={account.href}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-control p-2 no-underline transition-colors duration-fast hover:bg-surface-sunken"
          >
            <Avatar name={account.name} src={account.avatar} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-body-sm font-semibold text-text">{account.name}</span>
              <span className="block truncate text-caption text-muted">{account.note}</span>
            </span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              aria-label={t.nav.signOut}
              title={t.nav.signOut}
              className="grid size-10 cursor-pointer place-items-center rounded-control text-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-text"
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </aside>

      {/* --- top bar, below lg --------------------------------------------- */}
      <header className="sticky top-0 z-nav flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur-sm lg:hidden">
        <Link href="/dashboard" aria-label={t.shell.brand} className="rounded-control no-underline">
          <Logo className="text-h4" />
        </Link>
        <Link href={account.href} aria-label={t.app.shell.account} className="rounded-pill">
          <Avatar name={account.name} src={account.avatar} size="sm" />
        </Link>
      </header>

      {/* --- the page ------------------------------------------------------- */}
      <div className="lg:pl-62">
        <div className="mx-auto flex w-full max-w-app flex-col gap-8 px-4 pb-24 pt-6 md:px-6 lg:px-8 lg:pb-12 lg:pt-8 xl:flex-row xl:items-start">
          <main key={pathname} id="main" className="min-w-0 flex-1 animate-fade-in">
            {notice}
            {/* TEMPORARY: screens not yet rebuilt still use the panel's legacy
                classes, which read variables defined on `.sq`. `contents`
                keeps this wrapper out of the layout. Removed with the last
                legacy screen. */}
            <div className="sq contents">{children}</div>
          </main>
          {/* Always rendered, often empty: a route with no rail renders nothing
              into the slot, and an empty column takes no space. */}
          <aside
            key={`${pathname}-rail`}
            aria-label={t.nav.alongside}
            className="flex animate-fade-in flex-col gap-4 empty:hidden xl:w-80 xl:shrink-0"
          >
            {rail}
          </aside>
        </div>
      </div>

      {/* --- tab bar, below lg ---------------------------------------------- */}
      <nav
        aria-label={t.app.shell.tabs}
        className="fixed inset-x-0 bottom-0 z-nav grid grid-cols-5 items-end border-t border-border bg-surface pb-safe lg:hidden"
      >
        {tabs.map((item) => (
          <TabLink key={item.href} item={item} active={isActive(pathname, item)} />
        ))}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={more}
          onClick={() => setMore(true)}
          className={cn(tabClass, restActive ? "font-semibold text-primary" : "text-muted")}
        >
          <span className="grid size-7 place-items-center">
            <Ellipsis className="size-6" aria-hidden="true" />
          </span>
          <span className="max-w-full truncate">{t.app.shell.more}</span>
        </button>
      </nav>

      <Dialog open={more} onOpenChange={setMore} title={t.app.shell.moreTitle} closeLabel={t.ui.close}>
        <ul className="flex flex-col gap-1">
          {rest.map((item) => (
            <li key={item.href}>
              <SideLink item={item} active={isActive(pathname, item)} onNavigate={() => setMore(false)} tall />
            </li>
          ))}
          <li className="mt-2 border-t border-border pt-3">
            <form action={signOut}>
              <button
                type="submit"
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-body-sm font-medium text-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-text"
              >
                <LogOut className="size-5" aria-hidden="true" />
                {t.nav.signOut}
              </button>
            </form>
          </li>
        </ul>
      </Dialog>
    </div>
  );
}

function SideLink({
  item,
  active,
  onNavigate,
  tall,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate?: () => void;
  /** Touch-height rows in the phone's "More" sheet. */
  tall?: boolean;
}) {
  const t = useT();
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-control px-3 text-body-sm no-underline transition-colors duration-fast",
        tall ? "min-h-11" : "min-h-10",
        active
          ? "bg-primary-soft font-semibold text-primary-soft-fg"
          : "font-medium text-muted hover:bg-surface-sunken hover:text-text",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.feature ? (
        <span className="size-2 shrink-0 rounded-pill bg-accent" title={t.app.shell.monthlyOpen} aria-hidden="true" />
      ) : null}
      {item.badge ? (
        <span
          className="grid h-5 min-w-5 shrink-0 place-items-center rounded-pill bg-primary px-1 text-caption font-semibold tabular-nums text-primary-fg"
          aria-label={item.badgeLabel}
        >
          {item.badge}
        </span>
      ) : null}
      {item.note ? <span className="shrink-0 text-caption font-normal text-subtle">{item.note}</span> : null}
    </Link>
  );
}

const tabClass =
  "flex h-16 min-w-0 cursor-pointer flex-col items-center justify-end gap-0.5 px-1 pb-2 text-caption no-underline transition-colors duration-fast";

function TabLink({ item, active }: { item: AppNavItem; active: boolean }) {
  const Icon = ICONS[item.icon];

  if (item.feature) {
    // The monthly quest: a 48 px accent disc lifted out of the bar.
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(tabClass, active ? "font-semibold text-text" : "font-medium text-muted")}
      >
        <span className="-mt-4 grid size-12 place-items-center rounded-pill bg-accent text-accent-fg ring-4 ring-surface">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span className="max-w-full truncate">{item.tabLabel ?? item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(tabClass, active ? "font-semibold text-primary" : "font-medium text-muted")}
    >
      <span className="grid size-7 place-items-center">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="max-w-full truncate">{item.tabLabel ?? item.label}</span>
    </Link>
  );
}
