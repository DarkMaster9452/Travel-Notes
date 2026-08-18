"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  Avatar,
  IconBadge,
  IconBook,
  IconCalendarDays,
  IconClose,
  IconCoin,
  IconCompass,
  IconDatabase,
  IconGear,
  IconGrid,
  IconInbox,
  IconMap,
  IconMarker,
  IconMountain,
  IconSparkle,
  IconSun,
  IconUsers,
  LogoMark,
} from "@/components/field";
import type { IconProps } from "@/components/field/icons";
import type { PlanId } from "@/lib/config";
import { cn } from "@/lib/utils";

import { PlanMark } from "./plan-mark";
import { ThemeToggle, type ThemeChoice } from "./theme-toggle";

/**
 * The signed-in shell.
 *
 * Same paper, same card language and the same uppercase mono metadata as the
 * landing page — the interior only drops the grain and the contour lines,
 * because a dashboard is read for minutes at a time rather than scrolled past.
 *
 * `AdminShell` is the same chrome inverted onto the dark forest surface, and it
 * is deliberately *not* the customer shell with extra links: an admin has no
 * plan, no stickers and no billing, so that menu simply does not exist on that
 * side of the desk.
 */

/**
 * Looked up by key rather than passed as a component: the layouts that build
 * `NavItem[]` are server components, and a component reference cannot cross
 * into `"use client"` as a prop — only serialisable data can. The map itself
 * lives here, inside the client module, where referencing a component is fine.
 */
const NAV_ICONS = {
  grid: IconGrid,
  compass: IconCompass,
  inbox: IconInbox,
  users: IconUsers,
  map: IconMap,
  marker: IconMarker,
  coin: IconCoin,
  database: IconDatabase,
  sun: IconSun,
  calendar: IconCalendarDays,
  mountain: IconMountain,
  book: IconBook,
  badge: IconBadge,
  gear: IconGear,
  sparkle: IconSparkle,
} satisfies Record<string, React.ComponentType<IconProps>>;

export type NavIconKey = keyof typeof NAV_ICONS;

export type NavItem = {
  href: string;
  label: string;
  /**
   * A key into the sidebar's line-icon set, drawn before the label. Never an
   * emoji — an emoji is a colour glyph baked into the platform font and
   * cannot take the sidebar's ink or paper colour, so it would sit next to
   * the mono labels as decoration instead of matching them.
   */
  icon?: NavIconKey;
  /** Starts a labelled block in the sidebar — "Analytics", "Management". */
  section?: string;
  /** A count rendered on the right. Zero and undefined both render nothing. */
  badge?: number;
};

function Sidebar({
  home,
  items,
  admin,
  theme,
  children,
}: {
  home: string;
  items: readonly NavItem[];
  admin?: boolean;
  theme: ThemeChoice;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close the drawer whenever the route changes, so following a link on a
  // phone doesn't leave the menu sitting over the page you just opened.
  // Adjusted during render rather than in an effect, per the React-blessed
  // pattern for resetting state on a prop change — an effect here would mean
  // the drawer visibly stays open for one extra frame after the navigation.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Exact match for the index route, prefix match for the rest — otherwise
  // "/admin" would light up on every page in the panel.
  const isActive = (href: string) =>
    pathname === href || (href !== home && pathname.startsWith(`${href}/`));

  return (
    <>
      {/* The phone bar. The sidebar is a drawer under `lg`. */}
      <header className={cn("app-topbar", admin && "admin-topbar")}>
        <button
          type="button"
          className={cn("burger", open && "open")}
          aria-label={open ? "Close menu" : "Menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link href={home} className="logo logo-live" aria-label="Summit Quest">
          <LogoMark />
          Summit&nbsp;Quest
        </Link>
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </header>

      {open && (
        <button
          type="button"
          className="app-scrim"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn("app-side", admin && "admin-side", open && "open")}>
        <div className="app-side-head">
          <Link href={home} className="logo logo-live" aria-label="Summit Quest">
            <LogoMark />
            Summit&nbsp;Quest
          </Link>
          {admin && <span className="admin-flag">Admin panel</span>}
        </div>

        <nav className="app-side-nav" aria-label="Main">
          {items.map((item, index) => {
            const Icon = item.icon ? NAV_ICONS[item.icon] : null;
            return (
              <React.Fragment key={item.href}>
                {item.section && <p className="app-side-section">{item.section}</p>}
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
                  className="slide-in"
                >
                  {Icon && <Icon className="app-side-icon" />}
                  <span className="app-side-label">{item.label}</span>
                  {item.badge ? <span className="app-side-badge">{item.badge}</span> : null}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="app-side-foot">
          <ThemeToggle value={theme} />
          {children}
        </div>
      </aside>
    </>
  );
}

/** The menu links a customer has. An admin gets none of these. */
const CLIENT_LINKS: readonly NavItem[] = [
  { href: "/profile", label: "Settings" },
  { href: "/achievements", label: "Stickers" },
  { href: "/upgrade", label: "Plan & billing" },
];

export function AppShell({
  children,
  items,
  userName,
  userEmail,
  plan,
  planName,
  theme,
  logout,
}: {
  children: React.ReactNode;
  items: readonly NavItem[];
  userName: string;
  userEmail: string;
  /** Drives the membership accents. `free` leaves the interior plain. */
  plan: PlanId;
  /** "Free plan", "Explorer" — shown in the account menu. */
  planName: string;
  /** The account's palette. Rendered on the server so there is no flash. */
  theme: ThemeChoice;
  logout: () => Promise<void>;
}) {
  return (
    <div
      className="app-frame bg-paper text-ink"
      data-plan={plan}
      data-theme={theme.toLowerCase()}
    >
      <Sidebar home="/dashboard" items={items} theme={theme}>
        {plan !== "free" && <PlanMark plan={plan} />}
        <AccountMenu
          userName={userName}
          userEmail={userEmail}
          planName={planName}
          links={CLIENT_LINKS}
          logout={logout}
        />
      </Sidebar>
      <main className="app-main">
        <div className="app-canvas">{children}</div>
      </main>
    </div>
  );
}

export function AdminShell({
  children,
  items,
  userName,
  userEmail,
  theme,
  logout,
}: {
  children: React.ReactNode;
  items: readonly NavItem[];
  userName: string;
  userEmail: string;
  theme: ThemeChoice;
  logout: () => Promise<void>;
}) {
  return (
    <div
      className="app-frame bg-paper text-ink"
      data-surface="admin"
      data-theme={theme.toLowerCase()}
    >
      <Sidebar home="/admin" items={items} admin theme={theme}>
        {/* No plan mark, no settings, no billing: an admin account holds none
            of those, and a menu that offers them would be lying. */}
        <AccountMenu
          userName={userName}
          userEmail={userEmail}
          planName="Staff account"
          links={[]}
          logout={logout}
          inverse
        />
      </Sidebar>
      <main className="app-main">
        <div className="app-canvas">{children}</div>
      </main>
    </div>
  );
}

function AccountMenu({
  userName,
  userEmail,
  planName,
  links,
  logout,
  inverse,
}: {
  userName: string;
  userEmail: string;
  planName: string;
  links: readonly NavItem[];
  logout: () => Promise<void>;
  inverse?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="app-side-account press"
      >
        <Avatar name={userName} className="size-9 flex-[0_0_2.25rem] rounded-[11px] text-[12px]" />
        <span className="app-side-account-who">
          <b>{userName}</b>
          <span>{planName}</span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="drop-in absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-field-lg)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{userName}</p>
            <p className="meta mt-1 truncate normal-case">{userEmail}</p>
            <p className="meta mt-2">{planName}</p>
          </div>

          {links.length > 0 && (
            <div className="py-1">
              {links.map((link) => (
                <MenuLink key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </MenuLink>
              ))}
            </div>
          )}

          <form action={logout} className="border-t border-line py-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.13em] text-signal transition-colors hover:bg-signal/10"
            >
              <IconClose width={12} height={12} />
              Log out
            </button>
          </form>
        </div>
      )}
      {inverse && <span className="sr-only">Admin account</span>}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="menu-link block px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.13em] text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
    >
      {children}
    </Link>
  );
}
