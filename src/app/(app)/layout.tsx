import { logoutAction } from "@/app/(auth)/actions";
import { SqI18nProvider } from "@/components/sq/i18n";
import { SqNudge } from "@/components/sq/nudge";
import { PlanSheetProvider } from "@/components/sq/plan-sheet";
import { SqShell } from "@/components/sq/shell";
import { memberFootNav, memberNav } from "@/components/sq/nav";
import { SqToastProvider } from "@/components/sq/toast";
import { initialsOf } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isStripeEnabled, isUltraEnabled } from "@/lib/env";
import { getEntitlement } from "@/lib/entitlements";
import { getLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n";
import { getDueNudges } from "@/lib/nudges";

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
 *
 * `rail` is a parallel route: a screen that wants the third column writes
 * `@rail/<its path>/page.tsx` and gets one, and every screen that does not
 * falls through to `@rail/default.tsx`, which renders nothing. That keeps the
 * column's content beside the screen it belongs to instead of in a switch
 * here, and lets it stream in on its own rather than holding up the page.
 */
export default async function AppLayout({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  const user = await requireClient();

  const [entitlement, pending, profile, preferences, nudges, locale] = await Promise.all([
    getEntitlement(user.id),
    db.submission.count({ where: { userId: user.id, status: "PENDING" } }),
    db.profile.findUnique({ where: { userId: user.id }, select: { handle: true, published: true } }),
    db.userPreferences.findUnique({
      where: { userId: user.id },
      select: { homeLocation: true },
    }),
    getDueNudges(user.id),
    getLocale(user.id),
  ]);

  // Resolved once here and handed down. `getLocale` is React-cached, so a page
  // below that asks again costs nothing; the words themselves are looked up on
  // the client from the locale string, because dictionaries hold functions and
  // functions cannot cross the server boundary.
  const t = getMessages(locale);

  const planName = entitlement.definition.name;
  const region = preferences?.homeLocation?.split(",").pop()?.trim();

  return (
    <SqI18nProvider locale={locale}>
      <SqToastProvider>
        <SqShell
          flag={region ? `${planName} · ${region}` : planName}
          nav={memberNav(pending, t)}
          footNav={memberFootNav(planName, t)}
          lang={locale}
          account={{
            href: profile?.published ? `/people/${profile.handle}` : "/settings/profile",
            name: user.name,
            initials: initialsOf(user.name),
            note: entitlement.isSubscribed ? planName : `${planName} plan`,
            avatar: user.avatar ?? null,
          }}
          signOut={logoutAction}
          rail={rail}
          notice={
            nudges.some((nudge) => nudge.kind === "SHIPPING_ADDRESS") ? (
              <SqNudge
                kind="SHIPPING_ADDRESS"
                title={t.nudge.address.title}
                body={t.nudge.address.body}
                action={t.nudge.address.action}
                href="/settings/address"
              />
            ) : null
          }
        >
          <PlanSheetProvider billingEnabled={isStripeEnabled()} ultraEnabled={isUltraEnabled()}>
            {children}
          </PlanSheetProvider>
        </SqShell>
      </SqToastProvider>
    </SqI18nProvider>
  );
}
