import { logoutAction } from "@/app/(auth)/actions";
import { adminFootNav, adminNav } from "@/components/sq/nav";
import { SqShell } from "@/components/sq/shell";
import { SqSystemsPulse } from "@/components/sq/systems";
import { SqToastProvider } from "@/components/sq/toast";
import { initialsOf } from "@/components/sq/ui";
import { atLeast, ROLE_LABEL, tabsFor } from "@/lib/admin/access";
import { getSystemsPulse } from "@/lib/admin/systems";
import { requireAdmin } from "@/lib/auth/guards";
import { getDeskStatus } from "@/lib/admin/stats";

/**
 * The panel.
 *
 * Guarded by role on every request, read from the database rather than from
 * the cookie. A signed-in member is sent to their own dashboard — they are
 * authenticated, just not entitled. Every screen below this layout is gated by
 * its own minimum rank again: a layout is a place to put furniture, not a
 * place to put a security boundary.
 *
 * The rail is built from `tabsFor(role)`, the same table the guards read, so a
 * reader is not offered Revenue at all rather than offered it and bounced.
 *
 * There is no link from here into the customer side, because `requireClient`
 * would refuse it: a staff account has no quests, no allowance, no stickers
 * and no subscription, and a menu offering them would be describing an account
 * that does not exist.
 *
 * The third column is a parallel route, same as on the member side: a panel
 * screen that has something to put beside itself writes `@rail/<path>`, and
 * everything else falls through to a default that renders nothing.
 */
export default async function AdminLayout({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  const user = await requireAdmin();

  // The review badge is a number the desk needs before it has chosen where to
  // go, so it belongs to the shell rather than to the page that owns it. The
  // systems pulse is there for the same reason and read the same way — and
  // only for the ranks that may open the board it links to, so a reader is not
  // offered a door that would bounce them.
  const watches = atLeast(user.role, "ADMIN");
  const [desk, pulse] = await Promise.all([
    getDeskStatus(),
    watches ? getSystemsPulse() : Promise.resolve(null),
  ]);
  const tabs = tabsFor(user.role);

  return (
    <SqToastProvider>
      <SqShell
        flag={`Staff panel · ${ROLE_LABEL[user.role].toLowerCase()}`}
        nav={adminNav(tabs, desk.pending)}
        footNav={adminFootNav(tabs)}
        account={{
          href: "/admin/staff",
          name: user.name,
          initials: initialsOf(user.name),
          note: user.email,
          avatar: user.avatar ?? null,
        }}
        signOut={logoutAction}
        rail={rail}
        status={pulse ? <SqSystemsPulse pulse={pulse} /> : null}
      >
        {children}
      </SqShell>
    </SqToastProvider>
  );
}
