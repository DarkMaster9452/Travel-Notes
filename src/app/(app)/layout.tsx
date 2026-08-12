import { AppShell } from "@/components/app/app-shell";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout requires an account and finished onboarding.
 * The guard runs on the server on every request — the client never decides
 * whether it is allowed to be here.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser();
  const entitlement = await getEntitlement(user.id);

  return (
    <AppShell
      freeQuestsRemaining={entitlement.freeQuestsRemaining}
      isSubscribed={entitlement.isSubscribed}
    >
      {children}
    </AppShell>
  );
}
