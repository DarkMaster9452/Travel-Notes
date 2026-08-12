import Link from "next/link";

import { LanguageToggle } from "@/components/i18n/language-toggle";
import { Button, Card, Marker, SectionLabel } from "@/components/stopa/ui";
import { WaveHeader } from "@/components/stopa/wave-header";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORIES, PRIZES } from "@/lib/gamification";
import { fill, getTranslations } from "@/lib/i18n";
import { getActiveQuest } from "@/lib/stopa/data";

export const dynamic = "force-dynamic";

/**
 * Public landing page. Visitors can read the rules, see the live challenge and
 * what's on offer — but submitting anything requires an account.
 */
export default async function LandingPage() {
  const [user, { t, locale }] = await Promise.all([getCurrentUser(), getTranslations()]);
  const quest = await getActiveQuest().catch(() => null);

  return (
    <div className="min-h-dvh bg-forest">
      <div className="relative">
        <WaveHeader points={user?.points ?? 0} href="/" />
        <div className="absolute right-5 top-[4.6rem] z-10">
          <LanguageToggle current={locale} tone="light" />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-10">
        <p className="text-sm uppercase tracking-[0.14em] text-amber">{t.landing.eyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.05]">{t.landing.headline}</h1>
        <p className="mt-5 max-w-lg font-serif text-lg leading-relaxed text-cream/85">
          {t.landing.sub}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={user ? "/home" : "/signup"}>{t.landing.cta}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={user ? "/home" : "/login"}>{t.landing.login}</Link>
          </Button>
        </div>

        {quest && (
          <section className="mt-12">
            <SectionLabel>{t.home.weeklyChallenge}</SectionLabel>
            <Card className="mt-3 flex items-center gap-4">
              <Marker color={CATEGORIES[quest.category].marker} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-2xl">{quest.title}</p>
                <p className="truncate text-sm text-moss">
                  {quest.location} · {t.categories[quest.category]}
                </p>
              </div>
              <span className="shrink-0 font-serif text-xl tabular-nums">
                {quest.points} {t.common.points}
              </span>
            </Card>
          </section>
        )}

        <section className="mt-12">
          <SectionLabel>{t.landing.how}</SectionLabel>
          <ol className="mt-4 space-y-3">
            {t.landing.steps.map((step) => (
              <li key={step.n} className="card-solid p-5">
                <span className="font-serif text-xl text-amber">{step.n}</span>
                <p className="mt-2 font-serif text-xl">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-moss">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <SectionLabel>{t.landing.featuresTitle}</SectionLabel>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {t.landing.features.map((feature) => (
              <li
                key={feature}
                className="rounded-[10px] border border-cream/12 px-4 py-3 font-serif text-cream/90"
              >
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <SectionLabel>{t.rewards.title}</SectionLabel>
          <ul className="mt-4 space-y-2.5">
            {PRIZES.map((prize) => (
              <li
                key={prize.id}
                className="flex items-center gap-3.5 rounded-[12px] border border-cream/15 bg-forest-card px-4 py-3.5"
              >
                <Marker color={prize.marker} size="sm" />
                <span className="min-w-0 flex-1 truncate font-serif text-lg">
                  {t.prizes[prize.id as keyof typeof t.prizes]}
                </span>
                <span className="shrink-0 text-sm text-moss">
                  {fill(t.rewards.from, { points: prize.points })}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <SectionLabel>{t.rewards.rules}</SectionLabel>
          <ul className="mt-4 space-y-3">
            {t.rulesList.map((rule) => (
              <li key={rule} className="flex gap-3 font-serif leading-relaxed">
                <span aria-hidden="true" className="text-moss">
                  ·
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          <Button asChild size="block">
            <Link href={user ? "/home" : "/signup"}>{t.landing.cta}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
