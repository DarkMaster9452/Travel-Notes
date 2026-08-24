import type { Metadata } from "next";

import { Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { CountryForm, DangerZone, NameForm } from "@/components/app/settings-forms";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Eyebrow, Panel, PanelHead } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { countriesFor, countryForStoredLocation } from "@/lib/geo";
import { getEntitlement } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * General.
 *
 * What we call you, where you set out from, how the product looks, and the
 * way out — the four things that are about the account itself rather than
 * about your public page, what you pay, or how the game is played. Those
 * three have their own sections in the shell this page sits in now.
 */
export default async function SettingsPage() {
  const user = await requireClient();

  const [preferences, entitlement] = await Promise.all([
    db.userPreferences.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
  ]);

  // The chooser only offers what the plan can actually set out from, and the
  // stored value is matched back to a code so the current pick shows selected.
  const worldwide = entitlement.can("worldwide");
  const countries = countriesFor(worldwide).map(({ code, name, europe }) => ({
    code,
    name,
    europe,
  }));
  const current = countryForStoredLocation(preferences?.homeLocation);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Your account</Eyebrow>
          <h1>General.</h1>
          <p>What we call you, and where you set out from.</p>
        </div>
      </Reveal>

      <div className="flex flex-col gap-5">
        <Reveal delay={stagger(0)}>
          <Panel flush>
            <PanelHead title="Profile" />
            <NameForm name={user.name} />
          </Panel>
        </Reveal>

        <Reveal delay={stagger(1)}>
          <Panel flush>
            <PanelHead title="Where you set out from" />
            <CountryForm
              country={current?.code ?? ""}
              countries={countries}
              worldwide={worldwide}
            />
          </Panel>
        </Reveal>

        <Reveal delay={stagger(2)}>
          <Panel flush>
            <PanelHead title="Appearance" />
            <div className="flex flex-col gap-3 px-5 py-5">
              <ThemeToggle value={user.theme} className="theme-toggle-wide" />
              <p className="note mt-0">
                Auto follows your device. The choice is saved to your account, so it holds on
                every machine you sign in from.
              </p>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={stagger(3)}>
          <Panel flush>
            <PanelHead title="Danger zone" />
            <DangerZone />
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
