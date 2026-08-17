import Link from "next/link";

import { Panel, PanelHead } from "@/components/field";

/**
 * The four things an admin does most, one press away.
 *
 * Deliberately short: a list of every route is the sidebar, and repeating it
 * here would make the panel twice as long without making anything faster.
 */
export function QuickActions({ pending }: { pending: number }) {
  const actions = [
    { href: "/admin/review", emoji: "🧭", label: "Review submissions", count: pending || undefined },
    { href: "/admin/quests/new", emoji: "✍️", label: "Write a new quest" },
    { href: "/admin/users", emoji: "👥", label: "Manage an account" },
    { href: "/admin/locations", emoji: "📍", label: "See the map" },
  ];

  return (
    <Panel flush>
      <PanelHead title="Quick actions" />
      <div className="quick-actions">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <span className="qa-emoji" aria-hidden="true">
              {action.emoji}
            </span>
            {action.label}
            {action.count ? <span className="qa-count">{action.count} waiting</span> : null}
          </Link>
        ))}
      </div>
    </Panel>
  );
}
