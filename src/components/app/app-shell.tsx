"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { BRAND, FREE_QUEST_ALLOWANCE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The account shell: a persistent sidebar on desktop, the same nav as a
 * slide-over drawer on mobile, and a topbar carrying plan state and the user
 * menu. One nav definition drives all three.
 */

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/weekly", label: "Weekly Quest", icon: CompassIcon },
  { href: "/monthly", label: "Monthly Quest", icon: CalendarIcon },
  { href: "/database", label: "Quest Database", icon: DatabaseIcon },
  { href: "/saved", label: "Saved Quests", icon: BookmarkIcon },
  { href: "/achievements", label: "Achievements", icon: TrophyIcon },
  { href: "/profile", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({
  children,
  userName,
  freeQuestsRemaining,
  isSubscribed,
  planName,
}: {
  children: React.ReactNode;
  userName: string;
  freeQuestsRemaining: number;
  isSubscribed: boolean;
  planName: string;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Escape closes the drawer, matching what every other overlay on the web does.
  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          // A followed link should never leave the drawer covering the page it
          // just opened.
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-sm px-3 py-3 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase transition-colors",
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
  );

  const quotaPanel = isSubscribed ? (
    <div className="rounded-sm border border-ember-light/40 bg-ember/25 p-4">
      <p className="kicker text-ember-light">{planName}</p>
      <p className="mt-2 text-xs leading-relaxed text-paper/70">
        Unlimited quests. Generate as often as you like.
      </p>
    </div>
  ) : (
    <>
      <div className="rounded-sm border border-paper/20 p-4">
        <p className="kicker text-paper/50">Quests left</p>
        <p className="mt-1 font-display text-3xl font-extrabold text-paper tabular-nums">
          {freeQuestsRemaining} / {FREE_QUEST_ALLOWANCE}
        </p>
        <Link
          href="/upgrade"
          className="mt-2 inline-block text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-ember-light hover:underline"
        >
          Get unlimited quests →
        </Link>
      </div>

      <div className="mt-3 rounded-sm bg-ember/30 p-4">
        <p className="kicker flex items-center gap-2 text-ember-light">
          <CrownIcon /> Go premium
        </p>
        <p className="mt-2 text-xs leading-relaxed text-paper/70">
          Unlock unlimited quests, advanced filters and more.
        </p>
        <Link
          href="/upgrade"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-sm bg-ember-light text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-ink transition-colors hover:bg-paper"
        >
          Upgrade
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-ink px-4 py-6 lg:flex">
        <Link
          href="/dashboard"
          className="px-2 font-display text-xl font-extrabold text-paper"
        >
          {BRAND.name}
        </Link>

        <div className="mt-8 flex flex-1 flex-col">{nav}</div>

        <div className="pt-6">{quotaPanel}</div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/60"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ink px-4 py-6">
            <div className="flex items-center justify-between px-2">
              <span className="font-display text-xl font-extrabold text-paper">{BRAND.name}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center text-paper"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-8 flex flex-1 flex-col overflow-y-auto">{nav}</div>
            <div className="pt-6">{quotaPanel}</div>
          </aside>
        </div>
      )}

      <div className="flex min-h-dvh flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="flex size-10 items-center justify-center text-ink lg:hidden"
          >
            <MenuIcon />
          </button>

          <Link href="/dashboard" className="font-display text-lg font-extrabold text-ink lg:hidden">
            {BRAND.name}
          </Link>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <Link
              href={isSubscribed ? "/profile" : "/upgrade"}
              className={cn(
                "hidden items-center gap-2 rounded-sm border px-3 py-2 text-[0.625rem] font-semibold tracking-[0.14em] uppercase transition-colors sm:flex",
                isSubscribed
                  ? "border-moss/40 bg-moss/10 text-moss hover:bg-moss/20"
                  : "border-ink/20 text-stone hover:border-ink/40 hover:text-ink",
              )}
            >
              <CrownIcon />
              {planName}
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-sm py-1 pl-1 pr-2 transition-colors hover:bg-ink/5"
            >
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-moss font-display text-sm font-extrabold text-paper"
              >
                {userName.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <span className="hidden text-sm font-medium text-ink sm:inline">
                {userName.split(" ")[0]}
              </span>
            </Link>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

/* Inline icons keep the bundle small and the stroke weight consistent. */

const iconProps = {
  width: 18,
  height: 18,
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

function CompassIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-2 4.5L8.5 15l2-4.5z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3.5V6m8-2.5V6" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg {...iconProps}>
      <ellipse cx="12" cy="6.5" rx="7.5" ry="3" />
      <path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11" />
      <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
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

function TrophyIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H4.5V7A3.5 3.5 0 0 0 8 10.5M17 5.5h2.5V7a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 14v3m-3.5 3h7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2m0 13v2M3.5 12h2m13 0h2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="M4 17h16M4 17 3 7l5 3.5L12 5l4 5.5L21 7l-1 10" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...iconProps} width={22} height={22}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps} width={20} height={20}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
