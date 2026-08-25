import { adminFootNav, adminNav } from "@/components/sq/nav";
import { SqShell } from "@/components/sq/shell";
import { SqToastProvider } from "@/components/sq/toast";
import { initialsOf } from "@/components/sq/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { getDeskStatus } from "@/lib/admin/stats";

/**
 * The panel.
 *
 * Guarded by role on every request, read from the database rather than from
 * the cookie. A signed-in non-admin is sent to their own dashboard — they are
 * authenticated, just not entitled. Every screen below this layout is gated by
 * the same guard again in its own right: a layout is a place to put furniture,
 * not a place to put a security boundary.
 *
 * There is no link from here into the customer side, because `requireClient`
 * would refuse it: an admin account has no quests, no allowance, no stickers
 * and no subscription, and a menu offering them would be describing an account
 * that does not exist.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  // The review badge is a number an admin needs before they have chosen where
  // to go, so it belongs to the shell rather than to the page that owns it.
  const desk = await getDeskStatus();

  return (
    <SqToastProvider>
      <SqShell
        flag="Staff panel"
        nav={adminNav(desk.pending)}
        footNav={adminFootNav()}
        account={{
          href: "/admin/staff",
          name: user.name,
          initials: initialsOf(user.name),
          note: user.email,
          avatar: user.avatar ?? null,
        }}
      >
        {children}
      </SqShell>
    </SqToastProvider>
  );
}
