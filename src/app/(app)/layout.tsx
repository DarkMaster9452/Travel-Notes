import { AppShell, type NavItem } from "@/components/app/app-shell";
import { requireClient } from "@/lib/auth/guards";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout is the *customer* product, and requires a
 * customer account. The guard runs on the server on every request — the client
 * never decides whether it is allowed to be here, and an admin is sent to the
 * panel rather than shown a dashboard that would be empty for them.
 *
 * The quest in your hand is still assigned rather than chosen — that has not
 * changed and is still the premise.
 *
 * Six destinations, not twelve. The catalogue browse page, the submissions
 * inbox and the account-wide people directory are still there — nothing that
 * links to them broke — they are just no longer a permanent row in the rail.
 * A sidebar an admin scans in a second and a customer opens six times a day
 * should not carry the same weight of "everything that exists": the second
 * one is read constantly, and the tenth item down is what nobody was reading
 * anyway.
 *
 * Settings, billing and the rules moved out of this list entirely — they live
 * in the settings shell now, reached from the gear beside the account name
 * rather than mixed in with where you actually go to do something.
 *
 * Monthly sits above Weekly because the monthly quest is the headline — the
 * big one, opened on the 1st — and the weekly is the smaller thing alongside
 * it. The order of this list is the only place that hierarchy is stated, so
 * it states it.
 */
function nav(): readonly NavItem[] {
  return [
    { href: "/dashboard", label: "Today", icon: "sun" },
    { href: "/monthly", label: "Monthly", icon: "mountain" },
    { href: "/weekly", label: "Weekly", icon: "calendar" },
    { href: "/leaderboard", label: "Leaderboard", icon: "compass" },
    { href: "/history", label: "History", icon: "book" },
    { href: "/achievements", label: "Stickers", icon: "badge" },
  ];
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  const entitlement = await getEntitlement(user.id);

  return (
    <AppShell
      items={nav()}
      userName={user.name}
      theme={user.theme}
      plan={entitlement.plan}
      planName={
        entitlement.isSubscribed
          ? entitlement.definition.name
          : `${entitlement.definition.name} plan`
      }
    >
      {children}
    </AppShell>
  );
}
