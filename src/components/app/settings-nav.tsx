"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { IconClose, IconCoin, IconGear, IconShield, IconUsers } from "@/components/field";
import type { IconProps } from "@/components/field/icons";

/**
 * The settings shell's own sidebar.
 *
 * Settings, billing and the rules used to be three destinations spread across
 * the main rail, each guessing at its own layout. They are one window now,
 * in the shape the rest of the product already uses for a window with
 * sections — a slim nav down the left naming the sections, the section itself
 * on the right — rather than three pages that happen to link to each other.
 *
 * A client component for the same reason the app rail is one: the active
 * section is read from the URL with `usePathname`, and a settings shell that
 * can't tell you which section you're looking at is not much of a shell.
 */

const SECTIONS: {
  href: string;
  label: string;
  icon: React.ComponentType<IconProps>;
}[] = [
  { href: "/profile", label: "General", icon: IconGear },
  { href: "/profile/public", label: "Public profile", icon: IconUsers },
  { href: "/profile/plan", label: "Plan & billing", icon: IconCoin },
  { href: "/profile/rules", label: "Rules", icon: IconShield },
];

export function SettingsNav({ logout }: { logout: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <nav className="settings-nav" aria-label="Settings">
      <ul>
        {SECTIONS.map((section) => {
          // Exact match only: `/profile` must not light up for every section
          // under it, or the nav can never say which one you're actually on.
          const active = pathname === section.href;
          const Icon = section.icon;
          return (
            <li key={section.href}>
              <Link href={section.href} aria-current={active ? "page" : undefined}>
                <Icon width={16} height={16} />
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={logout} className="settings-nav-logout">
        <button type="submit">
          <IconClose width={14} height={14} />
          Log out
        </button>
      </form>
    </nav>
  );
}
