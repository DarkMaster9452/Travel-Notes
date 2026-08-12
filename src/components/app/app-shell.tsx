"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Sidebar on desktop, bottom bar on mobile — the two conventions each platform
 * expects, from one nav definition.
 */

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/history", label: "Quests", icon: ListIcon },
  { href: "/saved", label: "Saved", icon: BookmarkIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppShell({
  children,
  freeQuestsRemaining,
  isSubscribed,
}: {
  children: React.ReactNode;
  freeQuestsRemaining: number;
  isSubscribed: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ink/12 bg-ink px-6 py-8 lg:flex">
        <Link href="/dashboard" className="font-display text-2xl font-extrabold text-paper">
          {BRAND.name}
        </Link>

        <nav className="mt-12 flex flex-1 flex-col gap-1" aria-label="Main">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-3 text-xs font-semibold tracking-[0.14em] uppercase transition-colors",
                isActive(item.href)
                  ? "bg-paper text-ink"
                  : "text-paper/60 hover:bg-paper/10 hover:text-paper",
              )}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-paper/20 pt-6">
          {isSubscribed ? (
            <p className="kicker text-ember-light">Explorer · unlimited</p>
          ) : (
            <>
              <p className="kicker text-paper/50">
                {freeQuestsRemaining} / 3 free quests left
              </p>
              <Link
                href="/upgrade"
                className="mt-3 inline-block text-xs font-semibold tracking-[0.14em] uppercase text-ember-light hover:underline"
              >
                Go unlimited →
              </Link>
            </>
          )}
        </div>
      </aside>

      <div className="pb-20 lg:pb-0">{children}</div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-paper/15 bg-ink lg:hidden"
        aria-label="Main"
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-3 text-[0.5625rem] font-semibold tracking-[0.14em] uppercase transition-colors",
              isActive(item.href) ? "text-ember-light" : "text-paper/55",
            )}
          >
            <item.icon />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/* Inline icons keep the bundle small and the stroke weight consistent. */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10V20h13V10" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 4h12v16l-6-4-6 4z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  );
}
