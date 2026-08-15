import { logoutAction } from "@/app/(auth)/actions";
import { AppShell, type NavItem } from "@/components/app/app-shell";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { PLANS } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout requires an account and finished onboarding.
 * The guard runs on the server on every request — the client never decides
 * whether it is allowed to be here.
 *
 * The nav lists the routes that exist today. It moves to the `/app/*` shape
 * from the route plan as each of those pages is built.
 */
const NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Today" },
  { href: "/database", label: "Quests" },
  { href: "/weekly", label: "Weekly" },
  { href: "/history", label: "History" },
  { href: "/achievements", label: "Stickers" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser();
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
