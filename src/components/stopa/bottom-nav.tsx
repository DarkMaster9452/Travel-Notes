"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Dictionary } from "@/lib/i18n/dictionaries/sk";
import { cn } from "@/lib/utils";

/**
 * Bottom navigation, six slots wide, with the Admin tab only rendered for
 * admins. The active tab is marked with the amber underline from the design.
 */
export function BottomNav({ t, isAdmin }: { t: Dictionary; isAdmin: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: "/home", label: t.nav.home, Icon: HomeIcon },
    { href: "/submit", label: t.nav.submit, Icon: CameraIcon },
    { href: "/leaderboard", label: t.nav.leaderboard, Icon: TrophyIcon },
    { href: "/profile", label: t.nav.profile, Icon: UserIcon },
    { href: "/rewards", label: t.nav.rewards, Icon: MedalIcon },
    ...(isAdmin ? [{ href: "/admin", label: t.nav.admin, Icon: ShieldIcon }] : []),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/15 bg-forest-deep pb-[env(safe-area-inset-bottom)]"
      aria-label={t.nav.label}
    >
      <ul
        className="mx-auto grid max-w-3xl"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 pt-2.5 pb-2 transition-colors",
                  active ? "text-amber" : "text-cream/65 hover:text-cream",
                )}
              >
                <Icon />
                <span className="text-[0.6875rem]">{label}</span>
                <span
                  className={cn(
                    "mt-0.5 h-0.5 w-6 rounded-full transition-colors",
                    active ? "bg-amber" : "bg-transparent",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const icon = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function HomeIcon() {
  return (
    <svg {...icon}>
      <path d="M3 19 L10 6 L14 12.5 L16.5 9 L21 19Z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg {...icon}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <circle cx="12" cy="13.5" r="3.5" />
      <path d="M8.5 7 9.6 5h4.8L15.5 7" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg {...icon}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4.5V7A3 3 0 0 0 7 10M17 5.5h2.5V7A3 3 0 0 1 17 10M9.5 20h5M12 14v6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...icon}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg {...icon}>
      <circle cx="12" cy="14" r="5" />
      <path d="M9 4h6l-1.5 5M9 4l1.7 5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...icon}>
      <path d="M12 3.5 19 6v6c0 4.2-3 7.2-7 8.5-4-1.3-7-4.3-7-8.5V6l7-2.5Z" />
      <path d="m9.3 12.2 1.9 1.9 3.6-3.7" />
    </svg>
  );
}
