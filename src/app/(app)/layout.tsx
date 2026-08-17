import { logoutAction } from "@/app/(auth)/actions";
import { AppShell, type NavItem } from "@/components/app/app-shell";
import { requireClient } from "@/lib/auth/guards";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout is the *customer* product, and requires a
 * customer account. The guard runs on the server on every request — the client
 * never decides whether it is allowed to be here, and an admin is sent to the
 * panel rather than shown a dashboard that would be empty for them.
 *
 * There is nothing to browse and nothing to save: the nav is the product's
 * whole surface, which is the point. You are issued a quest, you log it, and
 * it is retired.
 */
const NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Today", icon: "sun" },
  { href: "/weekly", label: "Weekly", icon: "calendar" },
  { href: "/monthly", label: "Monthly", icon: "mountain" },
  { href: "/history", label: "History", icon: "book" },
  { href: "/achievements", label: "Stickers", icon: "badge" },

  { section: "Account", href: "/profile", label: "Settings", icon: "gear" },
  { href: "/upgrade", label: "Plan", icon: "sparkle" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  const entitlement = await getEntitlement(user.id);

  return (
    <AppShell
      items={NAV}
      userName={user.name}
      userEmail={user.email}
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
