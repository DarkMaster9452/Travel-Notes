"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  IconBell,
  IconChevronDown,
  IconClose,
  IconCrown,
  IconLogout,
  IconMenu,
  IconSettings,
  IconTrophy,
  IconUser,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The signed-in shell: a single top bar over a warm near-white canvas.
 *
 * The nav collapses to a sheet under `md`, and the avatar opens a menu whose
 * last item is Log out — the one destructive action here, so it is separated
 * and styled apart rather than sitting in the list like another link.
 */

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/database", label: "Quests" },
  { href: "/saved", label: "Saved" },
  { href: "/achievements", label: "Achievements" },
  { href: "/profile", label: "Profile" },
] as const;

export function AppShell({
  children,
  userName,
  userEmail,
  isSubscribed,
  planName,
  logout,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  isSubscribed: boolean;
  planName: string;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const firstName = userName.split(" ")[0] || userName;
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  // Close the avatar menu on outside click and on Escape.
  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            className="flex size-10 items-center justify-center rounded-md text-ink md:hidden"
          >
            {navOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>

          <Link
            href="/dashboard"
            className="font-display text-xl font-extrabold tracking-tight text-ink"
          >
            {BRAND.name}
          </Link>

          <nav className="ml-8 hidden items-center gap-1 md:flex" aria-label="Main">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "relative px-3 py-5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-ink"
                    : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {!isSubscribed && (
              <Link
                href="/upgrade"
                className="hidden items-center gap-2 rounded-lg border border-ember-light/50 bg-ember-light/15 px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ember-light/25 sm:flex"
              >
                <IconCrown size={15} />
                Go Premium
              </Link>
            )}

            <Link
              href="/history"
              aria-label="Recent activity"
              className="flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <IconBell size={20} />
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-ink/5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 items-center justify-center rounded-full bg-moss font-display text-sm font-extrabold text-paper"
                >
                  {initial}
                </span>
                <span className="hidden text-sm font-medium text-ink sm:inline">{firstName}</span>
                <IconChevronDown size={16} className="text-muted" />
                <span className="sr-only">Account menu</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Account"
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-card shadow-lg"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-medium text-ink">{userName}</p>
                    <p className="truncate text-xs text-muted">{userEmail}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-ink/5 px-2 py-1 text-[0.6875rem] font-medium text-muted">
                      <IconCrown size={12} />
                      {planName}
                    </p>
                  </div>

                  <div className="py-1">
                    <MenuLink href="/profile" onClick={() => setMenuOpen(false)}>
                      <IconUser size={16} /> Profile
                    </MenuLink>
                    <MenuLink href="/achievements" onClick={() => setMenuOpen(false)}>
                      <IconTrophy size={16} /> Achievements
                    </MenuLink>
                    <MenuLink href="/upgrade" onClick={() => setMenuOpen(false)}>
                      <IconSettings size={16} /> Billing
                    </MenuLink>
                  </div>

                  <form action={logout} className="border-t border-line py-1">
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-ember transition-colors hover:bg-ember/10"
                    >
                      <IconLogout size={16} /> Log out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav sheet */}
        {navOpen && (
          <nav className="border-t border-line bg-card px-4 pb-3 md:hidden" aria-label="Main">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNavOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive(item.href) ? "bg-ink/5 text-ink" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="flex-1">{children}</div>
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
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-ink/5"
    >
      {children}
    </Link>
  );
}
