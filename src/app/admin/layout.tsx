import { logoutAction } from "@/app/(auth)/actions";
import { AdminShell, type NavItem } from "@/components/app/app-shell";
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
const NAV: readonly NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/revenue", label: "Billing" },
  { href: "/admin/quests", label: "Quests" },
  { href: "/admin/database", label: "Database" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <AdminShell items={NAV} userName={user.name} userEmail={user.email} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
