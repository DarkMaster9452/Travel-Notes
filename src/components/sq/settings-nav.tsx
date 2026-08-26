"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useT } from "@/components/sq/i18n";
import type { Messages } from "@/lib/i18n";

/**
 * The settings rail.
 *
 * Grouped rather than flat because the four groups answer four different
 * questions — how the product behaves, what is published about you, what you
 * pay, and who can get in. A flat list of eleven items makes all four look
 * like the same kind of decision.
 */
export type SettingsGroup = {
  label: string;
  items: { href: string; label: string; note?: string }[];
};

/**
 * The settings rail.
 *
 * A function of the dictionary rather than a constant, because the labels are
 * the only part that changes with the reader — the hrefs, the grouping and the
 * order are the same in every language and are the actual structure.
 */
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

export function SqSettingsNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 24 }}
      aria-label={t.settings.heading}
    >
      {settingsGroups(t).map((group) => (
        <div key={group.label}>
          <p
            className="sq-kicker-sm"
            style={{ margin: "0 0 6px", padding: "0 10px", fontSize: 9.5, letterSpacing: "0.1em" }}
          >
            {group.label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 10px",
                    borderRadius: 6,
                    fontSize: 13.5,
                    background: active ? "var(--paper-2)" : "transparent",
                    color: active ? "var(--color-text)" : "var(--ink-2)",
                    borderLeft: `2px solid ${active ? "var(--signal)" : "transparent"}`,
                    transition: "background var(--dur-tint) var(--ease-move)",
                  }}
                >
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.note ? (
                    <span className="sq-mono" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>
                      {item.note}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
