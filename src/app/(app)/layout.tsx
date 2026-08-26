import { logoutAction } from "@/app/(auth)/actions";
import { SqShell } from "@/components/sq/shell";
import { memberFootNav, memberNav } from "@/components/sq/nav";
import { SqToastProvider } from "@/components/sq/toast";
import { initialsOf } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";

/**
 * Everything under this layout is the *customer* product, and requires a
 * customer account. The guard runs on the server on every request — the client
 * never decides whether it is allowed to be here, and an admin is sent to the
 * panel rather than shown a dashboard that would be empty for them.
 *
 * Seven destinations and one footer item, which is the whole of the member
 * side. The counts in the rail (proof still in review) are read here rather
 * than on the page that owns them: a badge is something you need *before*
 * you have chosen where to go.
 *
 * The account block at the bottom goes to the member's own public page when
 * they have published one, and to the settings screen that publishes it when
 * they have not — the block always leads somewhere about them.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();

  const [entitlement, pending, profile, preferences] = await Promise.all([
    getEntitlement(user.id),
    db.submission.count({ where: { userId: user.id, status: "PENDING" } }),
    db.profile.findUnique({ where: { userId: user.id }, select: { handle: true, published: true } }),
    db.userPreferences.findUnique({
      where: { userId: user.id },
      select: { homeLocation: true },
    }),
  ]);

  const planName = entitlement.definition.name;
  const region = preferences?.homeLocation?.split(",").pop()?.trim();

  return (
    <SqToastProvider>
      <SqShell
        flag={region ? `${planName} · ${region}` : planName}
        nav={memberNav(pending)}
        footNav={memberFootNav(planName)}
        account={{
          href: profile?.published ? `/people/${profile.handle}` : "/settings/profile",
          name: user.name,
          initials: initialsOf(user.name),
          note: entitlement.isSubscribed ? planName : `${planName} plan`,
          avatar: user.avatar ?? null,
        }}
        signOut={logoutAction}
      >
        {children}
      </SqShell>
    </SqToastProvider>
  );
}
