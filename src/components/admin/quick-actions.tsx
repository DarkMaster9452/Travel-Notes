import Link from "next/link";

import {
  IconCompass,
  IconMarker,
  IconPencil,
  IconUsers,
  Panel,
  PanelHead,
  type IconProps,
} from "@/components/field";

/**
 * The four things an admin does most, one press away.
 *
 * Deliberately short: a list of every route is the sidebar, and repeating it
 * here would make the panel twice as long without making anything faster.
 */
export function QuickActions({ pending }: { pending: number }) {
  const actions: {
    href: string;
    icon: React.ComponentType<IconProps>;
    label: string;
    count?: number;
  }[] = [
    { href: "/admin/review", icon: IconCompass, label: "Review submissions", count: pending || undefined },
    { href: "/admin/quests/new", icon: IconPencil, label: "Write a new quest" },
    { href: "/admin/users", icon: IconUsers, label: "Manage an account" },
    { href: "/admin/locations", icon: IconMarker, label: "See the map" },
  ];

  return (
    <Panel flush>
      <PanelHead title="Quick actions" />
      <div className="quick-actions">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <action.icon className="qa-icon" />
            {action.label}
            {action.count ? <span className="qa-count">{action.count} waiting</span> : null}
          </Link>
        ))}
      </div>
    </Panel>
  );
}
