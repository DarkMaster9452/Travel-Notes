"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/components/sq/i18n";
import { Chevron, LogoMark } from "@/components/sq/icons";
import { isActive, type SqNavItem } from "@/components/sq/nav";

/**
 * The persistent two-column shell.
 *
 * The sidebar is deliberately outside every route's render: it never
 * re-animates, because the thing that moved is the page, not the furniture.
 * Only `<main>` carries the enter transition, keyed on the pathname.
 *
 * Below 900px the rail becomes a drawer behind a top bar. The drawer is closed
 * on every navigation — a menu that stays open over the page you just asked
 * for is a menu you have to dismiss twice.
 */

export type SqShellProps = {
  /** "Explorer · Slovakia" on the member side, "Staff panel" on the admin side. */
  flag: string;
  nav: SqNavItem[];
  footNav: SqNavItem[];
  account: {
    href: string;
    name: string;
    initials: string;
    /** Plan name for a member, email for staff. */
    note: string;
    avatar?: string | null;
  };
  /** The server action that ends the session. Both shells pass the same one. */
  signOut: () => Promise<void>;
  /**
   * The third column, on wide screens.
   *
   * A 1180px column on a 2000px monitor leaves half the window empty, which
   * reads as a page that failed to load rather than as a page that is
   * finished. Pages that have something worth standing beside the content put
   * it here; pages that do not simply centre instead.
   */
  rail?: React.ReactNode;
  /**
   * Anything the product needs to say before the page says anything.
   *
   * Above `children` rather than inside each page, because a notice that
   * belonged to one screen would disappear the moment somebody navigated —
   * and an ask that only exists on the screen you happen to be on is an ask
   * that never gets answered.
   */
  notice?: React.ReactNode;
  /**
   * A small permanent readout at the foot of the rail.
   *
   * The panel puts the systems pulse here. It belongs to the furniture rather
   * than to a page because "is anything broken" is worth knowing on whichever
   * screen you happen to be on, and a status that only exists on the dashboard
   * is a status nobody sees while they are working.
   */
  status?: React.ReactNode;
  /**
   * What language the app is in.
   *
   * Set here rather than on `<html>` because the root layout wraps the
   * marketing site as well, and that stays English. A `lang` on the app's own
   * subtree is valid HTML, is what a screen reader actually needs, and leaves
   * the landing page's own declaration honest.
   */
  lang?: string;
  /** Where the logo goes. Defaults to the first nav item. */
  home?: string;
  /** The account's stored palette; written as `data-theme` on the shell. */
  theme?: "light" | "dark" | "system";
  /**
   * The phone tab bar (below `lg`): four destinations plus "Menu", with the
   * `feature` item raised in the middle. The member app has one; the panel
   * does not.
   */
  tabs?: SqNavItem[];
  children: React.ReactNode;
};

export function SqShell({
  flag,
  nav,
  footNav,
  account,
  signOut,
  rail,
  notice,
  status,
  lang,
  home,
  theme = "system",
  tabs,
  children,
}: SqShellProps) {
  const pathname = usePathname();
  const t = useT();

  // The drawer remembers *which* route it was opened on rather than whether it
  // is open, so a navigation closes it during render instead of through an
  // effect that fires after the new page has already painted behind it.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const drawer = openedAt === pathname;
  const setDrawer = (open: boolean | ((current: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(drawer) : open;
    setOpenedAt(next ? pathname : null);
  };

  return (
    <div
      className="sq sq-shell"
      lang={lang}
      data-theme={theme}
      data-tabs={tabs ? "1" : "0"}
      data-drawer={drawer ? "open" : "closed"}
    >
      <header className="sq-topbar">
        <Link href={home ?? nav[0]?.href ?? "/"} className="sq-brand" aria-label={t.shell.brand}>
          <LogoMark size={26} />
          <span>{t.shell.brand}</span>
        </Link>
        <button
          type="button"
          className="sq-btn sq-btn-ghost sq-btn-sm"
          aria-expanded={drawer}
          onClick={() => setDrawer((open) => !open)}
        >
          {drawer ? "Close" : "Menu"}
        </button>
      </header>

      <aside className="sq-side">
        <Link href={home ?? nav[0]?.href ?? "/"} className="sq-brand" aria-label={t.shell.brand}>
          <LogoMark />
          <span>
            Summit
            <br />
            Quest
          </span>
        </Link>

        <p className="sq-side-flag">{flag}</p>

        <nav className="sq-nav" aria-label="Main">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item)} />
          ))}
        </nav>

        <div className="sq-nav-foot">
          {footNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item)} />
          ))}
        </div>

        {status}

        <div className="sq-account-block">
          <Link href={account.href} className="sq-account">
            <span className="sq-account-mark">
              {account.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary hosts
                <img src={account.avatar} alt="" width={32} height={32} />
              ) : (
                account.initials
              )}
            </span>
            <span className="sq-account-name">
              <b>{account.name}</b>
              <span>{account.note}</span>
            </span>
            <Chevron />
          </Link>

          {/* Signing out is a POST to a server action, not a link: a GET that
              destroys a session can be fired by anything that prefetches. */}
          <form action={signOut}>
            <button type="submit" className="sq-signout">
              {t.nav.signOut}
            </button>
          </form>
        </div>
      </aside>

      {drawer ? (
        <button
          type="button"
          aria-label={t.shell.closeMenu}
          onClick={() => setDrawer(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            border: 0,
            background: "rgba(20,26,22,0.42)",
          }}
        />
      ) : null}

      <main key={pathname} className="sq-main sq-main-enter">
        {notice}
        {children}
      </main>

      {tabs ? (
        <nav className="trail-tabbar" aria-label={t.nav.menu}>
          {tabs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="trail-tab"
              data-feature={item.feature ? "1" : "0"}
              aria-current={isActive(pathname, item) ? "page" : undefined}
            >
              <span className="trail-tab-icon" aria-hidden="true">
                <TabIcon href={item.href} />
              </span>
              <span className="trail-tab-label">{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            className="trail-tab"
            aria-expanded={drawer}
            onClick={() => setDrawer((open) => !open)}
          >
            <span className="trail-tab-icon" aria-hidden="true">
              <TabIcon href="#menu" />
            </span>
            <span className="trail-tab-label">{t.nav.menu}</span>
          </button>
        </nav>
      ) : null}

      {/* Always rendered, often empty. Whether it takes a column is decided in
          CSS by whether it actually has anything in it, so a route with no
          rail needs no flag — it simply renders nothing into the slot. */}
      <aside key={`${pathname}-rail`} className="sq-rail sq-main-enter" aria-label={t.nav.alongside}>
        {rail}
      </aside>
    </div>
  );
}

function NavLink({ item, active }: { item: SqNavItem; active: boolean }) {
  const badge = item.badge ?? null;
  const pulse = useBadgePulse(badge);

  return (
    <Link
      href={item.href}
      className="sq-nav-item"
      data-feature={item.feature ? "1" : "0"}
      aria-current={active ? "page" : undefined}
    >
      <span>
        {item.feature ? <span className="trail-feature-dot" aria-hidden="true" /> : null}
        {item.label}
      </span>
      {badge ? (
        <span className="sq-nav-badge" data-pulse={pulse ? "1" : "0"}>
          {badge}
        </span>
      ) : null}
      {item.note ? <span className="sq-nav-note">{item.note}</span> : null}
    </Link>
  );
}

/**
 * True for one beat after a badge's number changes, which is what drives the
 * single 1.15× pulse. First render never pulses: arriving on a page is not a
 * change.
 */
function useBadgePulse(value: number | null): boolean {
  const previous = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 340);
    return () => window.clearTimeout(timer);
  }, [value]);

  return pulse;
}

/** Tab bar glyphs, drawn to the lucide grid (24, stroke 2). */
function TabIcon({ href }: { href: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (href) {
    case "/monthly":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M2.5 20 9.5 7l4 7 2-3.2L21.5 20z" />
        </svg>
      );
    case "/dashboard":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "/quests":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5z" />
        </svg>
      );
    case "/leaderboard":
      return (
        <svg {...common}>
          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}
