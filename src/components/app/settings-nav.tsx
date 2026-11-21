"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useT } from "@/components/i18n";
import type { Messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The settings rail (design/DESIGN-SYSTEM.md §6.4, "Settings"): a 220 px list
 * beside the pane from `lg`, a row of tabs above it below that.
 *
 * Grouped, because the four groups answer four different questions — how the
 * product behaves, what is published about you, what you pay, and who can get
 * in. A flat list of eleven makes all four look like the same kind of choice.
 */
export type SettingsGroup = {
  label: string;
  items: { href: string; label: string; note?: string }[];
};

export function settingsGroups(t: Messages): SettingsGroup[] {
  return [
    {
      label: t.settings.groups.settings,
      items: [
        { href: "/settings/general", label: t.settings.items.general },
        { href: "/settings/units", label: t.settings.items.units },
      ],
    },
    {
      label: t.settings.groups.you,
      items: [
        { href: "/settings/profile", label: t.settings.items.profile },
        { href: "/settings/address", label: t.settings.items.address },
        { href: "/settings/notifications", label: t.settings.items.notifications },
      ],
    },
    {
      label: t.settings.groups.membership,
      items: [
        { href: "/settings/billing", label: t.settings.items.billing },
        { href: "/settings/invoices", label: t.settings.items.invoices },
        { href: "/settings/cancel", label: t.settings.items.cancel },
      ],
    },
    {
      label: t.settings.groups.account,
      items: [
        { href: "/settings/password", label: t.settings.items.password },
        { href: "/settings/connected", label: t.settings.items.connected, note: "Strava" },
        { href: "/settings/privacy", label: t.settings.items.privacy },
      ],
    },
  ];
}

export function SettingsNav() {
  const pathname = usePathname();
  const t = useT();
  const groups = settingsGroups(t);
  const row = useRef<HTMLUListElement>(null);

  // On a phone the tabs scroll sideways; bring the current one into view so
  // "Privacy" is not the tab you cannot see you are on.
  useEffect(() => {
    row.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav aria-label={t.app.settingsPane.nav}>
      {/* Below lg: one scrolling row of tabs. */}
      <ul ref={row} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 lg:hidden">
        {groups.flatMap((group) => group.items).map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center border-b-2 px-2 text-body-sm no-underline",
                  active ? "border-primary font-semibold text-text" : "border-transparent font-medium text-muted",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* From lg: the grouped list, sticky beside the pane. */}
      <div className="sticky top-8 hidden flex-col gap-5 lg:flex">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-overline font-semibold uppercase text-subtle">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-9 items-center gap-2 rounded-control px-3 text-body-sm no-underline transition-colors duration-fast",
                        active
                          ? "bg-primary-soft font-semibold text-primary-soft-fg"
                          : "font-medium text-muted hover:bg-surface-sunken hover:text-text",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.note ? <span className="shrink-0 text-caption font-normal text-subtle">{item.note}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
