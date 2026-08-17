"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Avatar, IconClose, LogoMark } from "@/components/field";
import type { PlanId } from "@/lib/config";
import { cn } from "@/lib/utils";

import { PlanMark } from "./plan-mark";

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

export type NavItem = { href: string; label: string };

function Bar({
  home,
  items,
  admin,
  children,
}: {
  home: string;
  items: readonly NavItem[];
  admin?: boolean;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={cn("app-bar", admin && "admin-bar")}>
      <div className="wrap app-bar-in">
        <Link href={home} className="logo logo-live" aria-label="Summit Quest">
          <LogoMark />
          Summit&nbsp;Quest
        </Link>

        {admin && <span className="admin-flag">Admin</span>}

        <nav className="app-nav" aria-label="Main">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {children}
          <button
            type="button"
            className={cn("burger", menuOpen && "open")}
            aria-label={menuOpen ? "Close menu" : "Menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="wrap drop-in flex flex-col gap-1 border-t border-line py-3 md:hidden"
          aria-label="Main"
          onClick={() => setMenuOpen(false)}
        >
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              style={{ animationDelay: `${index * 40}ms` }}
              className="slide-in rounded-[var(--radius-pill)] px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-2 aria-[current=page]:bg-pine aria-[current=page]:text-card"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
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
  logout: () => Promise<void>;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink" data-plan={plan}>
      <Bar home="/dashboard" items={items}>
        {plan !== "free" && <PlanMark plan={plan} />}
        <AccountMenu
          userName={userName}
          userEmail={userEmail}
          planName={planName}
          links={CLIENT_LINKS}
          logout={logout}
        />
      </Bar>
      <main className="app-main flex-1">
        <div className="wrap">{children}</div>
      </main>
    </div>
  );
}

export function AdminShell({
  children,
  items,
  userName,
  userEmail,
  logout,
}: {
  children: React.ReactNode;
  items: readonly NavItem[];
  userName: string;
  userEmail: string;
  logout: () => Promise<void>;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink" data-surface="admin">
      <Bar home="/admin" items={items} admin>
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
      </Bar>
      <main className="app-main flex-1">
        <div className="wrap">{children}</div>
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="press flex items-center gap-2 rounded-[var(--radius-pill)] p-1 transition-transform"
      >
        <Avatar name={userName} className="size-9 flex-[0_0_2.25rem] rounded-[11px] text-[12px]" />
        <span className="sr-only">Account</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="drop-in absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-field-lg)]"
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
