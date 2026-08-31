import type { Metadata } from "next";

import { SqOnboarding } from "@/components/sq/onboarding";
import { requireClient } from "@/lib/auth/guards";
import { COUNTRIES } from "@/lib/geo";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getStravaConnection, stravaEnabled } from "@/lib/strava";
import { isStripeEnabled, isUltraEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Getting set up" };
export const dynamic = "force-dynamic";

/**
 * The four things the product needs before it can hand somebody a quest.
 *
 * Deliberately four short answers rather than a questionnaire: where to
 * measure from, how to write figures, what plan, and whether a watch is
 * connected. Everything else the generator needs it decides — being told what
 * to do is the premise, and a long preferences form would quietly undo that.
 *
 * Each step writes as it is answered, so leaving halfway keeps what was said.
 */
export default async function OnboardingPage() {
  const user = await requireClient();

  const [preferences, display, entitlement, connection] = await Promise.all([
    db.userPreferences.findUnique({ where: { userId: user.id }, select: { homeLocation: true } }),
    db.displaySettings.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
    getStravaConnection(user.id),
  ]);

  return (
    <SqOnboarding
      name={user.name.split(" ")[0] || user.name}
      countries={COUNTRIES.map((country) => ({
        name: country.name,
        europe: country.europe,
      }))}
      current={{
        country: preferences?.homeLocation ?? "",
        units: display?.units ?? "METRIC",
        language: display?.language ?? "en",
        plan: entitlement.plan,
        stravaConnected: connection !== null,
      }}
      billingEnabled={isStripeEnabled()}
      ultraEnabled={isUltraEnabled()}
      stravaEnabled={stravaEnabled()}
    />
  );
}
