import { logoutAction } from "@/app/(auth)/actions";
import { AppShell, type NavItem } from "@/components/app/app-shell";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout is the *customer* product, and requires a
 * customer account. The guard runs on the server on every request — the client
 * never decides whether it is allowed to be here, and an admin is sent to the
 * panel rather than shown a dashboard that would be empty for them.
 *
 * The quest in your hand is still assigned rather than chosen — that has not
 * changed and is still the premise. What is browsable is the *record*: the
 * database of everything we have written, and the boards showing who has done
 * what this week and this month. Both exist because the alternative was that
 * a quest you actually walked could not be logged unless the generator had
 * happened to hand it to you.
 *
 * Monthly sits above Weekly because the monthly quest is the headline — the
 * big one, opened on the 1st — and the weekly is the smaller thing alongside
 * it. The order of this list is the only place that hierarchy is stated, so
 * it states it.
 */
function nav(awaiting: number): readonly NavItem[] {
  return [
    { href: "/dashboard", label: "Today", icon: "sun" },
    { href: "/monthly", label: "Monthly", icon: "mountain" },
    { href: "/weekly", label: "Weekly", icon: "calendar" },
    { href: "/quests", label: "Database", icon: "map" },
    { href: "/leaderboard", label: "Leaderboard", icon: "compass" },
    { href: "/submissions", label: "Submissions", icon: "inbox", badge: awaiting },
    { href: "/history", label: "History", icon: "book" },
    { href: "/achievements", label: "Stickers", icon: "badge" },
    { href: "/people", label: "People", icon: "users" },

    { section: "Account", href: "/profile", label: "Settings", icon: "gear" },
    { href: "/upgrade", label: "Plan", icon: "sparkle" },
    { href: "/rules", label: "Rules", icon: "shield" },
  ];
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  const [entitlement, awaiting] = await Promise.all([
    getEntitlement(user.id),
    // The one number worth carrying in the chrome: proof you filed that
    // nobody has read yet is the only thing on this side you are waiting on.
    db.submission.count({ where: { userId: user.id, status: "PENDING" } }),
  ]);

  return (
    <AppShell
      items={nav(awaiting)}
      userName={user.name}
      userEmail={user.email}
      theme={user.theme}
      plan={entitlement.plan}
      planName={
        entitlement.isSubscribed
          ? entitlement.definition.name
          : `${entitlement.definition.name} plan`
      }
      logout={logoutAction}
    >
      {children}
    </AppShell>
  );
}
