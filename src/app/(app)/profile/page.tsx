import type { Metadata } from "next";
import Link from "next/link";

import { BillingActions } from "@/components/app/billing-actions";
import { Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { PlanChip } from "@/components/app/plan-mark";
import { CountryForm, DangerZone, NameForm } from "@/components/app/settings-forms";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Avatar, Eyebrow, Panel, PanelHead } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { CAPABILITY_COPY, headlineCapabilities } from "@/lib/config";
import { db } from "@/lib/db";
import { countriesFor, countryForStoredLocation } from "@/lib/geo";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireClient();

  const [preferences, entitlement] = await Promise.all([
    db.userPreferences.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
  ]);

  const plan = entitlement.definition;

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
          <h1>Settings.</h1>
          <p>What we call you, where you set out from, and what you pay for.</p>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} className="size-11 flex-[0_0_2.75rem]" />
          <div>
            <b className="block text-[15px] font-semibold">{user.name}</b>
            <span className="meta normal-case tracking-[0.06em]">{user.email}</span>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          <Reveal delay={stagger(0)}>
            <Panel flush>
              <PanelHead title="Profile" />
              <NameForm name={user.name} />
            </Panel>
          </Reveal>

          <Reveal delay={stagger(1)}>
            <Panel flush className={entitlement.isSubscribed ? "member-panel" : undefined}>
              <PanelHead title="Plan" aside={<PlanChip plan={entitlement.plan} />} />
              <div className="flex flex-col gap-4 px-5 py-5">
                <p className="text-[14.5px] leading-[1.55] text-ink-2">{plan.description}</p>

                {entitlement.isSubscribed ? (
                  <>
                    <ul className="held-inline">
                      {headlineCapabilities(plan, Infinity).map((capability, index) => (
                        <li
                          key={capability}
                          className="tick-in"
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          {CAPABILITY_COPY[capability].title}
                        </li>
                      ))}
                    </ul>
                    {entitlement.currentPeriodEnd && (
                      <p className="meta normal-case tracking-[0.06em]">
                        {entitlement.cancelAtPeriodEnd
                          ? `Access until ${formatDate(entitlement.currentPeriodEnd)}, then it stops.`
                          : `Renews ${formatDate(entitlement.currentPeriodEnd)}.`}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <BillingActions enabled={isStripeEnabled()} />
                      {entitlement.plan !== "ultra" && (
                        <Link href="/upgrade" className="btn btn-primary btn-sm">
                          Move up to Ultra
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="credits">
                      Free quests left: <b>{entitlement.freeQuestsRemaining}</b>
                    </p>
                    <Link href="/upgrade" className="btn btn-primary btn-sm">
                      See the plans
                    </Link>
                  </div>
                )}
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={stagger(2)}>
            <Panel flush>
              <PanelHead title="Danger zone" />
              <DangerZone />
            </Panel>
          </Reveal>
        </div>

        <div className="flex flex-col gap-5">
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
        </div>
      </div>
    </>
  );
}
