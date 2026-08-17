import { logoutAction } from "@/app/(auth)/actions";
import { AdminShell, type NavItem } from "@/components/app/app-shell";
import { requireAdmin } from "@/lib/auth/guards";

/**
 * The admin panel.
 *
 * Guarded by role on every request, read from the database rather than the
 * cookie. A signed-in non-admin is sent to their own dashboard — they are
 * authenticated, just not entitled.
 */
const NAV: readonly NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <AdminShell items={NAV} userName={user.name} userEmail={user.email} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
