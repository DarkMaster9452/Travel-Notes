import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { QuestCard } from "@/components/quest/quest-card";
import { QuestImage } from "@/components/quest/quest-image";
import { Button } from "@/components/ui/button";
import { Kicker, SectionHeading } from "@/components/ui/primitives";
import { EXPLORER_PLAN, formatPrice, PLANS } from "@/lib/config";
import { IMAGES } from "@/lib/images";
import type { QuestSummary } from "@/types/quest";

// ---------------------------------------------------------------------------

const STEPS = [
  {
    index: "01",
    title: "Tell us what you like",
    body: "Where you are, how far you'll travel, what kind of ground you want under your boots. Six questions, two minutes.",
  },
  {
    index: "02",
    title: "We create your quest",
    body: "Your preferences go in, randomised adventure criteria go in, and everything you've already been sent gets ruled out.",
  },
  {
    index: "03",
    title: "Go outside",
    body: "An objective, a bonus challenge and a place to be. No itinerary, no group chat, no planning spiral.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-paper px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[100rem]">
        <SectionHeading index="How it works" title={<>Three steps.<br />No planning spiral.</>} />

        <ol className="mt-16 grid gap-px bg-ink/12 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.index} delay={i * 0.08} className="bg-paper p-8 sm:p-10">
              <span className="font-display text-6xl font-extrabold text-ember">{step.index}</span>
              <h3 className="mt-6 font-display text-2xl font-extrabold uppercase sm:text-3xl">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-stone">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function QuestPreview({ quests }: { quests: QuestSummary[] }) {
  const [feature, ...rest] = quests;
  if (!feature) return null;

  return (
    <section id="quests" className="bg-ink px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[100rem]">
        <SectionHeading
          index="Real output"
          tone="light"
          title={<>This is what turns up.</>}
          lede="Every card below came out of the generator, not a copywriter. Different places, different distances, different reasons to go."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <QuestCard quest={feature} size="feature" href="/signup" priority />
          </Reveal>
          {rest.slice(0, 1).map((quest) => (
            <Reveal key={quest.id} delay={0.08}>
              <QuestCard quest={quest} href="/signup" className="h-full" />
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rest.slice(1, 5).map((quest, i) => (
            <Reveal key={quest.id} delay={i * 0.06}>
              <QuestCard quest={quest} href="/signup" className="h-full" />
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="light" size="lg">
            <Link href="/signup">Get mine →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const PARAMETERS = [
  "waterfall", "ridge line", "8–12 km", "before sunset", "public transport", "forest",
  "medium", "hidden place", "castle ruin", "off the beaten path", "+900 m", "solo",
  "cave", "lake", "sunrise start", "full day", "photography", "old growth",
];

export function Randomness() {
  return (
    <section className="overflow-hidden bg-paper-dim py-24 sm:py-32">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <Reveal>
          <h2 className="display-lg max-w-[14ch]">
            You don&apos;t need an itinerary.
          </h2>
          <p className="mt-8 max-w-lg font-serif text-2xl leading-snug text-ink/70 italic sm:text-3xl">
            You need a reason to leave the house.
          </p>
        </Reveal>
      </div>

      {/* Parameter ticker: the raw material the generator draws from. */}
      <div className="mt-16 flex overflow-hidden border-y border-ink/12 py-5" aria-hidden="true">
        <ul className="animate-ticker flex shrink-0 items-center gap-4 pr-4">
          {[...PARAMETERS, ...PARAMETERS].map((param, i) => (
            <li
              key={`${param}-${i}`}
              className="flex items-center gap-4 whitespace-nowrap font-display text-2xl font-bold uppercase text-ink/70 sm:text-3xl"
            >
              {param}
              <span className="text-ember">✦</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-16 grid max-w-[100rem] gap-8 px-5 sm:px-8 md:grid-cols-3">
        {[
          { k: "Randomised", v: "Every quest draws a fresh combination of terrain, distance, timing and objective." },
          { k: "Personal", v: "Your radius, your transport, your difficulty. The dice only roll inside your limits." },
          { k: "Never repeated", v: "Your entire history is checked before anything is offered to you again." },
        ].map((item, i) => (
          <Reveal key={item.k} delay={i * 0.08}>
            <Kicker className="text-ember">{item.k}</Kicker>
            <p className="mt-3 text-sm leading-relaxed text-stone">{item.v}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const FEATURES = [
  { title: "Personalised quests", body: "Built from your answers, not a generic trail list." },
  { title: "Randomised discoveries", body: "A wildcard parameter you didn't ask for, one quest in three." },
  { title: "No repeated quests", body: "Location, objective, difficulty and title are all checked against your history." },
  { title: "Difficulty selection", body: "Easy to serious — or surprise me, if you'd rather not decide." },
  { title: "Distance selection", body: "Set the route length and the travel radius from your front door." },
  { title: "Saved quests", body: "Keep the ones you want for a better weekend." },
  { title: "Quest history", body: "Everything you've been sent, with what you finished." },
  { title: "Location-based", body: "Travel time estimated from where you actually live." },
  { title: "Adventure objectives", body: "Reach it before sunset. Find the thing nobody photographs." },
];

export function Features() {
  return (
    <section className="bg-paper px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[100rem]">
        <SectionHeading index="What you get" title="Everything, no dashboard nonsense." />

        <div className="mt-16 grid gap-px bg-ink/12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.05} className="bg-paper p-7 sm:p-8">
              <h3 className="font-display text-xl font-extrabold uppercase sm:text-2xl">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone">{feature.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function Pricing({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="pricing" className="bg-ink px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[100rem]">
        <SectionHeading
          index="Pricing"
          tone="light"
          title="Three quests free. Then decide."
          lede="No trial countdown, no card up front. Use your three, and if you're still bored, there are a few hundred more places waiting."
        />

        <div className="mt-16 grid gap-px bg-paper/15 lg:grid-cols-2">
          {PLANS.map((plan) => (
            <div key={plan.id} className="flex flex-col bg-ink p-8 sm:p-12">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-4xl font-extrabold uppercase text-paper sm:text-5xl">
                  {plan.name}
                </h3>
                {plan.highlight && (
                  <span className="kicker bg-ember px-2 py-1 text-paper">Unlimited</span>
                )}
              </div>

              <p className="mt-4 text-sm text-paper/60">{plan.description}</p>

              <p className="mt-8 font-display text-6xl font-extrabold text-paper">
                {formatPrice(plan.price.monthly, plan.currency)}
                {plan.price.monthly > 0 && (
                  <span className="ml-2 font-sans text-sm font-medium tracking-normal text-paper/50 normal-case">
                    / month
                  </span>
                )}
              </p>

              <ul className="mt-8 flex flex-1 flex-col gap-3 border-t border-paper/15 pt-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-paper/75">
                    <span aria-hidden="true" className="text-ember">
                      —
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.highlight ? "ember" : "outlineLight"}
                size="lg"
                className="mt-10"
              >
                <Link href={signedIn ? (plan.highlight ? "/upgrade" : "/dashboard") : "/signup"}>
                  {plan.highlight ? "Unlock unlimited" : "Start free"}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-paper/45">
          Prices are configured centrally and billed through Stripe. Cancel any time from your
          profile — {EXPLORER_PLAN.name} stays active until the end of the period you paid for.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative min-h-[80svh] overflow-hidden bg-ink">
      <QuestImage
        src={IMAGES.sunsetRidge.src}
        alt={IMAGES.sunsetRidge.alt}
        palette={IMAGES.sunsetRidge.palette}
        sizes="100vw"
        zoomOnHover={false}
      />
      <div className="scrim absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[80svh] max-w-[100rem] flex-col justify-end px-5 pb-16 pt-24 sm:px-8 sm:pb-24">
        <h2 className="display-xl max-w-[10ch] text-paper">
          Bored? Go find something.
        </h2>
        <div className="mt-10">
          <Button asChild variant="light" size="xl">
            <Link href={signedIn ? "/dashboard" : "/signup"}>
              Start your first quest
              <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-[100rem] flex-col gap-6 border-t border-paper/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-2xl font-extrabold text-paper">SIDEQUEST</p>
        <p className="text-xs text-paper/45">
          Go carefully. Check the weather, tell someone your plan, and turn back when it stops being
          fun.
        </p>
      </div>
    </footer>
  );
}
