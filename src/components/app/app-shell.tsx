"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Avatar, IconClose, LogoMark } from "@/components/field";
import { cn } from "@/lib/utils";

/**
 * The signed-in shell.
 *
 * Same paper, same card language and the same uppercase mono metadata as the
 * landing page — the interior only drops the grain and the contour lines,
 * because a dashboard is read for minutes at a time rather than scrolled past.
 *
 * `AdminShell` is the same chrome inverted onto the dark forest surface, so an
 * admin can always tell which side of the desk they are on.
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
        <Link href={home} className="logo" aria-label="Summit Quest">
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
            className="burger"
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
          className="wrap flex flex-col gap-1 border-t border-line py-3 md:hidden"
          aria-label="Main"
          onClick={() => setMenuOpen(false)}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="rounded-[var(--radius-pill)] px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-2 aria-[current=page]:bg-pine aria-[current=page]:text-card"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function AppShell({
  children,
  items,
  userName,
  userEmail,
  planName,
  logout,
}: {
  children: React.ReactNode;
  items: readonly NavItem[];
  userName: string;
  userEmail: string;
  /** "Free plan", "Explorer" — shown in the account menu. */
  planName: string;
  logout: () => Promise<void>;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <Bar home="/dashboard" items={items}>
        <AccountMenu
          userName={userName}
          userEmail={userEmail}
          planName={planName}
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
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <Bar home="/admin" items={items} admin>
        <AccountMenu
          userName={userName}
          userEmail={userEmail}
          planName="Admin"
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
  logout,
  inverse,
}: {
  userName: string;
  userEmail: string;
  planName: string;
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
        className="flex items-center gap-2 rounded-[var(--radius-pill)] p-1 transition-colors"
      >
        <Avatar name={userName} className="size-9 flex-[0_0_2.25rem] rounded-[11px] text-[12px]" />
        <span className="sr-only">Account</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-field-lg)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{userName}</p>
            <p className="meta mt-1 truncate normal-case">{userEmail}</p>
            <p className="meta mt-2">{planName}</p>
          </div>

          <div className="py-1">
            <MenuLink href="/profile" onClick={() => setOpen(false)}>
              Settings
            </MenuLink>
            <MenuLink href="/achievements" onClick={() => setOpen(false)}>
              Stickers
            </MenuLink>
            <MenuLink href="/upgrade" onClick={() => setOpen(false)}>
              Plan &amp; billing
            </MenuLink>
          </div>

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
      className="block px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.13em] text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
    >
      {children}
    </Link>
  );
}
