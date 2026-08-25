import { logoutAction } from "@/app/(auth)/actions";
import { DeskStatus } from "@/components/admin/desk-status";
import { NotificationCenter } from "@/components/admin/notification-center";
import { AdminShell, type NavItem } from "@/components/app/app-shell";
import { countUnreadMessages } from "@/lib/admin/chat";
import { getAdminNotices } from "@/lib/admin/notifications";
import { getDeskStatus } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";

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
function nav(pending: number, unread: number): readonly NavItem[] {
  return [
    { href: "/admin", label: "Dashboard", icon: "grid" },
    { href: "/admin/review", label: "Review", icon: "compass", badge: pending },
    // Staff only, and the one place in the panel that is about the people
    // running it rather than about the product.
    { href: "/admin/chat", label: "Back office", icon: "chat", badge: unread },
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

  // These belong to the shell rather than to any one page: the review badge
  // and the chat badge are numbers an admin needs before they have chosen
  // where to go, the desk card is the state of the queue on every page, and
  // the notices are the panel saying what is wrong on whichever page they
  // happen to be standing on.
  const [desk, notices, unread] = await Promise.all([
    getDeskStatus(),
    getAdminNotices(),
    countUnreadMessages(user.id),
  ]);

  return (
    <AdminShell
      items={nav(desk.pending, unread)}
      userName={user.name}
      userEmail={user.email}
      theme={user.theme}
      notices={<NotificationCenter notices={notices} />}
      status={<DeskStatus pending={desk.pending} oldestWaitDays={desk.oldestWaitDays} />}
      logout={logoutAction}
    >
      {children}
    </AdminShell>
  );
}
