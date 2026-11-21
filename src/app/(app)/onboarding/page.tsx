import type { Metadata } from "next";

import { Onboarding } from "@/components/app/onboarding";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { isPaddleEnabled, isUltraEnabled } from "@/lib/env";
import { COUNTRIES, countryForStoredLocation } from "@/lib/geo";
import { getLocale, getT } from "@/lib/i18n/server";
import { getStravaConnection, stravaEnabled } from "@/lib/strava";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).app.onboarding.overline };
}
export const dynamic = "force-dynamic";

/**
 * The four things the product needs before it can hand somebody a quest:
 * where to measure from, how to write figures, what plan, and whether a watch
 * is connected. Everything else the generator decides — being told what to do
 * is the premise, and a long preferences form would quietly undo that.
 *
 * A new account lands here straight after signing up.
 */
export default async function OnboardingPage() {
  const user = await requireClient();

  const [preferences, display, entitlement, connection, locale] = await Promise.all([
    db.userPreferences.findUnique({ where: { userId: user.id }, select: { homeLocation: true } }),
    db.displaySettings.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
    getStravaConnection(user.id),
    getLocale(user.id),
  ]);

  return (
    <Onboarding
      name={user.name.split(" ")[0] || user.name}
      countries={COUNTRIES.map((country) => ({ code: country.code, name: country.name, europe: country.europe }))}
      current={{
        // Stored as written ("Slovensko", "Žilina, Slovakia"); the form needs
        // the code of the country it resolves to.
        country: countryForStoredLocation(preferences?.homeLocation)?.code ?? "",
        units: display?.units ?? "METRIC",
        language: display?.language ?? locale,
        plan: entitlement.plan,
        stravaConnected: connection !== null,
      }}
      billingEnabled={isPaddleEnabled()}
      ultraEnabled={isUltraEnabled()}
      stravaEnabled={stravaEnabled()}
    />
  );
}
