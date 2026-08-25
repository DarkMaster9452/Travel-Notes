"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: "Settings",
    items: [
      { href: "/settings/general", label: "General" },
      { href: "/settings/units", label: "Units & language" },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/settings/profile", label: "Profile" },
      { href: "/settings/address", label: "Shipping address" },
      { href: "/settings/notifications", label: "Notifications" },
    ],
  },
  {
    label: "Membership",
    items: [
      { href: "/settings/billing", label: "Plan & billing" },
      { href: "/settings/invoices", label: "Invoices" },
      { href: "/settings/cancel", label: "Pause or cancel" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings/password", label: "Password" },
      { href: "/settings/connected", label: "Connected apps", note: "Strava" },
      { href: "/settings/privacy", label: "Privacy" },
    ],
  },
];

export function SqSettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 24 }}
      aria-label="Settings sections"
    >
      {SETTINGS_GROUPS.map((group) => (
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
