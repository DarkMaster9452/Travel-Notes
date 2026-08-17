import type { Metadata } from "next";
import Link from "next/link";

import { BillingActions } from "@/components/app/billing-actions";
import { Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { DeleteAccount, NameForm, PreferencesForm } from "@/components/app/settings-forms";
import { Avatar, Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { requireUser } from "@/lib/auth/guards";
import { PLANS } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled } from "@/lib/env";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const [preferences, entitlement] = await Promise.all([
    db.userPreferences.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
  ]);

  const plan = PLANS.find((item) => item.id === entitlement.plan.toLowerCase()) ?? PLANS[0];

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Your account</Eyebrow>
          <h1>Settings.</h1>
          <p>What we call you, what the generator reads, and what you pay for.</p>
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
            <Panel flush>
              <PanelHead
                title="Plan"
                aside={
                  <Tag tone={entitlement.isSubscribed ? "pine" : "ghost"}>{plan.name}</Tag>
                }
              />
              <div className="flex flex-col gap-4 px-5 py-5">
                <p className="text-[14.5px] leading-[1.55] text-ink-2">{plan.description}</p>

                {entitlement.isSubscribed ? (
                  <>
                    {entitlement.currentPeriodEnd && (
                      <p className="meta normal-case tracking-[0.06em]">
                        {entitlement.cancelAtPeriodEnd
                          ? `Access until ${formatDate(entitlement.currentPeriodEnd)}, then it stops.`
                          : `Renews ${formatDate(entitlement.currentPeriodEnd)}.`}
                      </p>
                    )}
                    <BillingActions enabled={isStripeEnabled()} />
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
              <PanelHead title="Leaving" />
              <DeleteAccount />
            </Panel>
          </Reveal>
        </div>

        <Reveal delay={stagger(1)}>
          <Panel flush>
            <PanelHead title="What the generator reads" />
            <PreferencesForm
              homeLocation={preferences?.homeLocation ?? DEFAULT_PREFERENCES.homeLocation}
              difficulty={preferences?.difficulty ?? DEFAULT_PREFERENCES.difficulty}
              maxDistance={preferences?.maxDistance ?? DEFAULT_PREFERENCES.maxDistance}
              timeAvailable={preferences?.timeAvailable ?? DEFAULT_PREFERENCES.timeAvailable}
            />
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
