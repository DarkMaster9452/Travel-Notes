import { logoutAction } from "@/app/(auth)/actions";
import { CheatMenu } from "@/components/admin/cheat-menu";
import { NotificationCenter } from "@/components/admin/notification-center";
import { AdminShell, type NavItem } from "@/components/app/app-shell";
import { getAdminNotices } from "@/lib/admin/notifications";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

/**
 * The admin panel.
 *
 * Guarded by role on every request, read from the database rather than the
 * cookie. A signed-in non-admin is sent to their own dashboard — they are
 * authenticated, just not entitled.
 *
 * This is the whole of an admin's product. There is no link from here into the
 * customer side, because `requireClient` would refuse it: an admin account has
 * no quests, no allowance, no stickers and no subscription, and a menu offering
 * them would be describing an account that doesn't exist.
 */
function nav(pending: number): readonly NavItem[] {
  return [
    { href: "/admin", label: "Dashboard", icon: "grid" },
    { href: "/admin/review", label: "Review", icon: "compass", badge: pending },
    { href: "/admin/submissions", label: "Submissions", icon: "inbox" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/quests", label: "Quests", icon: "map" },
    { href: "/admin/quests/all", label: "All quests", icon: "book" },
    { href: "/admin/schedule", label: "Schedule", icon: "calendar" },
    { href: "/admin/locations", label: "Locations", icon: "marker" },

    { section: "Analytics", href: "/admin/leaderboard", label: "Leaderboards", icon: "badge" },
    { href: "/admin/revenue", label: "Revenue", icon: "coin" },
    { href: "/admin/database", label: "Database", icon: "database" },
  ];
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  // Both of these belong to the shell rather than to any one page: the review
  // badge is the number an admin needs before they have chosen where to go,
  // and the notices are the panel saying what is wrong on whichever page they
  // happen to be standing on.
  const [pending, notices] = await Promise.all([
    db.submission.count({ where: { status: "PENDING" } }),
    getAdminNotices(),
  ]);

  return (
    <AdminShell
      items={nav(pending)}
      userName={user.name}
      userEmail={user.email}
      theme={user.theme}
      notices={<NotificationCenter notices={notices} />}
      logout={logoutAction}
    >
      {children}
      {/* F7, anywhere in the panel. Mounted from the layout rather than a
          page so the shortcut works wherever an admin happens to be — and
          only inside this layout, which is guarded by role. */}
      <CheatMenu />
    </AdminShell>
  );
}
