import { logoutAction } from "@/app/(auth)/actions";
import { appFootNav, appNav } from "@/components/app/nav";
import { Nudge } from "@/components/app/nudge";
import { AppShell } from "@/components/app/shell";
import { requireClient } from "@/lib/auth/guards";
import { planCopy } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getT } from "@/lib/i18n/server";
import { getDueNudges } from "@/lib/nudges";

/**
 * Everything under this layout is the *customer* product, and requires a
 * customer account. The guard runs on the server on every request — the client
 * never decides whether it is allowed to be here, and an admin is sent to the
 * panel rather than shown a dashboard that would be empty for them.
 *
 * Seven destinations and one footer item, which is the whole of the member
 * side. The count in the rail (proof still in review) is read here rather
 * than on the page that owns it: a badge is something you need *before* you
 * have chosen where to go.
 *
 * The account block goes to the member's own public page when they have
 * published one, and to the settings screen that publishes it when they have
 * not — the block always leads somewhere about them.
 *
 * `rail` is a parallel route: a screen that wants the third column writes
 * `@rail/<its path>/page.tsx` and gets one, and every screen that does not
 * falls through to `@rail/default.tsx`, which renders nothing.
 *
 * The language and the theme are set on `<html>` by the root layout, from the
 * same account, so nothing here repeats them.
 */
export default async function AppLayout({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  const user = await requireClient();

  const [entitlement, pending, profile, nudges, t] = await Promise.all([
    getEntitlement(user.id),
    db.submission.count({ where: { userId: user.id, status: "PENDING" } }),
    db.profile.findUnique({ where: { userId: user.id }, select: { handle: true, published: true } }),
    getDueNudges(user.id),
    getT(user.id),
  ]);

  const planName = planCopy(t, entitlement.plan).name;

  return (
    <AppShell
      nav={appNav(pending, t)}
      footNav={appFootNav(planName, t)}
      account={{
        href: profile?.published ? `/people/${profile.handle}` : "/settings/profile",
        name: user.name,
        note: planName,
        avatar: user.avatar ?? null,
      }}
      signOut={logoutAction}
      rail={rail}
      notice={
        nudges.some((nudge) => nudge.kind === "SHIPPING_ADDRESS") ? (
          <Nudge
            kind="SHIPPING_ADDRESS"
            title={t.nudge.address.title}
            body={t.nudge.address.body}
            action={t.nudge.address.action}
            href="/settings/address"
          />
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
