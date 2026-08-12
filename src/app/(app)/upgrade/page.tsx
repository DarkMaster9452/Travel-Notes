import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/app/billing-actions";
import { QuestImage } from "@/components/quest/quest-image";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { EXPLORER_PLAN, formatPrice } from "@/lib/config";
import { getEntitlement } from "@/lib/entitlements";
import { isStripeEnabled } from "@/lib/env";
import { IMAGES } from "@/lib/images";
import { LOCATIONS } from "@/lib/quest/locations";

export const metadata: Metadata = { title: "Go unlimited" };
export const dynamic = "force-dynamic";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireOnboardedUser();
  const [entitlement, { checkout }] = await Promise.all([getEntitlement(user.id), searchParams]);

  if (entitlement.isSubscribed) redirect("/profile");

  const exhausted = entitlement.freeQuestsRemaining === 0;

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-45">
          <QuestImage
            src={IMAGES.summitFog.src}
            alt=""
            palette={IMAGES.summitFog.palette}
            sizes="100vw"
            zoomOnHover={false}
            priority
          />
        </div>
        <div className="scrim absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-10 sm:py-28">
          <Kicker className="text-ember">
            {exhausted ? "That's your three" : `${entitlement.freeQuestsRemaining} free quests left`}
          </Kicker>

          <h1 className="display-lg mt-5 max-w-[16ch] text-paper">
            {exhausted ? (
              <>Your free quests are gone.</>
            ) : (
              <>Never run out of somewhere to go.</>
            )}
          </h1>

          <p className="mt-7 max-w-xl font-serif text-2xl leading-snug text-paper/80 italic">
            But there are still {LOCATIONS.length} places in the catalogue waiting for you, and the
            generator can build thousands of different days out of them.
          </p>

          {checkout === "cancelled" && (
            <p className="mt-8 border-l-2 border-paper/40 pl-4 text-sm text-paper/70">
              Checkout cancelled — nothing was charged. Your free quests and history are untouched.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-10">
        <div className="grid gap-px bg-paper/15 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-ink p-8 sm:p-12">
            <h2 className="font-display text-5xl font-extrabold uppercase">{EXPLORER_PLAN.name}</h2>
            <p className="mt-4 text-sm text-paper/60">{EXPLORER_PLAN.description}</p>

            <p className="mt-8 font-display text-6xl font-extrabold">
              {formatPrice(EXPLORER_PLAN.price.monthly, EXPLORER_PLAN.currency)}
              <span className="ml-2 font-sans text-sm font-medium tracking-normal text-paper/50 normal-case">
                / month
              </span>
            </p>

            <ul className="mt-8 space-y-3 border-t border-paper/15 pt-8">
              {EXPLORER_PLAN.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-paper/80">
                  <span aria-hidden="true" className="text-ember">
                    —
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <CheckoutButton enabled={isStripeEnabled()} className="mt-10" />

            <p className="mt-6 text-xs text-paper/45">
              Cancel any time from your profile. Your history and saved quests stay yours either
              way.
            </p>
          </div>

          <div className="flex flex-col justify-between bg-ink p-8 sm:p-12">
            <div>
              <Kicker className="text-paper/50">Still yours on the free plan</Kicker>
              <ul className="mt-6 space-y-3 text-sm text-paper/70">
                <li>Everything you&apos;ve already been sent</li>
                <li>Your saved quests</li>
                <li>Your full quest history</li>
                <li>Marking quests as completed</li>
              </ul>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <Button asChild variant="outlineLight" size="lg">
                <Link href="/history">Browse your history</Link>
              </Button>
              <Button asChild variant="ghostLight" size="lg">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
