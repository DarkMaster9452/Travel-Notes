import { AppShell } from "@/components/app/app-shell";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { PLANS } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout requires an account and finished onboarding.
 * The guard runs on the server on every request — the client never decides
 * whether it is allowed to be here.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser();
  const entitlement = await getEntitlement(user.id);

  const planName =
    PLANS.find((plan) => plan.id === (entitlement.isSubscribed ? "explorer" : "free"))?.name ??
    "Free";

  return (
    <AppShell
      userName={user.name}
      freeQuestsRemaining={entitlement.freeQuestsRemaining}
      isSubscribed={entitlement.isSubscribed}
      planName={`${planName} plan`}
    >
      {children}
    </AppShell>
  );
}
