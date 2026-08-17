import { logoutAction } from "@/app/(auth)/actions";
import { AdminShell, type NavItem } from "@/components/app/app-shell";
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
    { href: "/admin/locations", label: "Locations", icon: "marker" },

    { section: "Analytics", href: "/admin/revenue", label: "Revenue", icon: "coin" },
    { href: "/admin/database", label: "Database", icon: "database" },
  ];
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  // The review badge is the one number an admin needs before they have chosen
  // a page, so it is fetched with the shell rather than inside it.
  const pending = await db.submission.count({ where: { status: "PENDING" } });

  return (
    <AdminShell
      items={nav(pending)}
      userName={user.name}
      userEmail={user.email}
      logout={logoutAction}
    >
      {children}
    </AdminShell>
  );
}
