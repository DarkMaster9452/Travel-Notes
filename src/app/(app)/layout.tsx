import { logoutAction } from "@/app/(auth)/actions";
import { AppShell, type NavItem } from "@/components/app/app-shell";
import { requireUser } from "@/lib/auth/guards";
import { PLANS } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout requires an account. The guard runs on the
 * server on every request — the client never decides whether it is allowed to
 * be here.
 *
 * There is nothing to browse and nothing to save: the nav is the product's
 * whole surface, which is the point. You are issued a quest, you log it, and
 * it is retired.
 */
const NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Today" },
  { href: "/weekly", label: "Weekly" },
  { href: "/monthly", label: "Monthly" },
  { href: "/history", label: "History" },
  { href: "/achievements", label: "Stickers" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const entitlement = await getEntitlement(user.id);

  const planName =
    PLANS.find((plan) => plan.id === (entitlement.isSubscribed ? "explorer" : "free"))?.name ??
    "Free";

  return (
    <AppShell
      items={NAV}
      userName={user.name}
      userEmail={user.email}
      planName={`${planName} plan`}
      logout={logoutAction}
    >
      {children}
    </AppShell>
  );
}
