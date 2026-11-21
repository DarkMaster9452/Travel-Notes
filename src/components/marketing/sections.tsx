import type { Quest } from "@prisma/client";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Footprints,
  Mail,
  Route,
  ShieldCheck,
  Sticker as StickerIcon,
  Undo2,
  Upload,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { MEDAL_ORDER, MedalDisc } from "@/components/domain/medal";
import { Sticker } from "@/components/domain/sticker";
import { FeaturePanel, MonthlyEmpty, MonthlyHero, QuestCard, QuestGrid, toTrailQuest } from "@/components/domain/trail";
import { Badge, SubmissionBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SegmentedLinks } from "@/components/ui/nav";
import { Overline, type } from "@/components/ui/typography";
import {
  FREE_QUEST_ALLOWANCE,
  PLANS,
  REFUND_WINDOW_DAYS,
  STICKER_ALLOWANCE,
  planCopy,
  type BillingInterval,
} from "@/lib/config";
import type { Locale, Messages } from "@/lib/i18n";
import { formatMoney } from "@/lib/i18n/format";
import type { LandingMonthly } from "@/lib/landing";
import { slotTitle } from "@/lib/quest/labels";
import { cn } from "@/lib/utils";

/**
 * The landing page's sections, in the order design/DESIGN-SYSTEM.md §12 sets:
 * the monthly quest, how it works, weekly quests, proof and the board,
 * stickers, plans, questions, the closing call. Sections alternate the page
 * ground and `surface`; the only colour blocks are the Sun panels that belong
 * to the monthly quest.
 *
 * Everything here is real: the hero and the cards read the live database, the
 * plans read `lib/config`. Nothing is promised that the app does not do.
 */

type Reader = { t: Messages; locale: Locale };

/* --- furniture ------------------------------------------------------------ */

function Band({
  id,
  tone = "ground",
  children,
}: {
  id?: string;
  tone?: "ground" | "surface";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-16 py-16 lg:py-24", tone === "surface" && "border-y border-border bg-surface")}
    >
      <Container>{children}</Container>
    </section>
  );
}

function SectionHead({
  overline,
  title,
  lede,
  center,
}: {
  overline: string;
  title: string;
  lede?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-8 flex max-w-3xl flex-col gap-3 lg:mb-12", center && "mx-auto items-center text-center")}>
      <Overline>{overline}</Overline>
      <h2 className={type.display}>{title}</h2>
      {lede ? <p className="text-body-lg text-muted">{lede}</p> : null}
    </div>
  );
}

/** An icon in a soft circle beside a title and a line of body. */
function Point({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-primary-soft text-primary-soft-fg">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className={type.h4}>{title}</h3>
        <p className="mt-1 text-body-sm text-muted">{children}</p>
      </div>
    </li>
  );
}

/* --- hero: the monthly quest ---------------------------------------------- */

export function Hero({
  t,
  locale,
  monthly,
  home,
}: Reader & { monthly: LandingMonthly | null; home: string | null }) {
  const primary =
    home === "/admin"
      ? { label: t.landing.nav.openPanel, href: "/admin" }
      : home
        ? { label: t.landing.hero.open, href: "/monthly" }
        : { label: t.landing.hero.join, href: "/signup" };

  return (
    <section className="pb-16 pt-8 lg:pb-24 lg:pt-12">
      <Container className="flex flex-col gap-8">
        <div className="flex max-w-3xl flex-col gap-3">
          <Overline>{t.landing.hero.overline}</Overline>
          <h1 className={type.displayXl}>{t.landing.hero.title}</h1>
          <p className="text-body-lg text-muted">{t.landing.hero.lede}</p>
        </div>

        {monthly ? (
          <MonthlyHero
            quest={toTrailQuest(monthly.quest, t)}
            t={t}
            locale={locale}
            monthLabel={monthly.slot ? slotTitle(monthly.slot, locale, t) : t.landing.hero.example}
            closesAt={monthly.closesAt}
            lede={monthly.quest.subtitle}
            primary={primary}
            secondary={{ label: t.landing.hero.how, href: "#how" }}
          />
        ) : (
          <MonthlyEmpty
            t={t}
            title={t.landing.hero.emptyTitle}
            body={t.landing.hero.emptyBody}
            action={home ? null : { label: t.landing.nav.start, href: "/signup" }}
          />
        )}
      </Container>
    </section>
  );
}

/* --- how it works --------------------------------------------------------- */

const STEP_ICONS: LucideIcon[] = [Route, Footprints, Camera, StickerIcon];

export function HowItWorks({ t }: Reader) {
  return (
    <Band id="how" tone="surface">
      <SectionHead overline={t.landing.how.overline} title={t.landing.how.title} lede={t.landing.how.lede} />
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {t.landing.how.steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Route;
          return (
            <li key={step.title} className="flex flex-col gap-3">
              <span className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-pill bg-primary-soft text-primary-soft-fg">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="font-display text-h2 font-bold tabular-nums text-subtle" aria-hidden="true">
                  {index + 1}
                </span>
              </span>
              <h3 className={type.h3}>{step.title}</h3>
              <p className="text-body-sm text-muted">{step.body}</p>
            </li>
          );
        })}
      </ol>
    </Band>
  );
}

/* --- weekly quests -------------------------------------------------------- */

export function WeeklyQuests({ t, locale, quests, home }: Reader & { quests: Quest[]; home: string | null }) {
  const member = home === "/dashboard";
  return (
    <Band id="quests">
      <SectionHead
        overline={t.landing.weekly.overline}
        title={t.landing.weekly.title}
        lede={t.landing.weekly.lede}
      />
      {quests.length === 0 ? (
        <p className="text-body text-muted">{t.landing.weekly.empty}</p>
      ) : (
        <QuestGrid>
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={toTrailQuest(quest, t)}
              t={t}
              locale={locale}
              period="WEEKLY"
              href={member ? `/quests/${quest.id}` : "/signup"}
              foot={
                <>
                  <span>{member ? t.landing.weekly.cardFootSignedIn : t.landing.weekly.cardFoot}</span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </>
              }
            />
          ))}
        </QuestGrid>
      )}
      <div className="mt-4">
        <ButtonLink href={member ? "/quests" : "/signup"} variant="secondary" size="lg">
          {t.landing.weekly.cta}
        </ButtonLink>
      </div>
    </Band>
  );
}

/* --- proof and the board -------------------------------------------------- */

const PROOF_ICONS: LucideIcon[] = [Camera, UserCheck, Undo2];

export function ProofSection({ t }: Reader) {
  const copy = t.landing.proof;
  const medalNames = { GOLD: copy.board.gold, SILVER: copy.board.silver, BRONZE: copy.board.bronze };

  return (
    <Band id="proof" tone="surface">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHead overline={copy.overline} title={copy.title} lede={copy.lede} />
          <ul className="flex flex-col gap-6">
            {copy.points.map((point, index) => (
              <Point key={point.title} icon={PROOF_ICONS[index] ?? Camera} title={point.title}>
                {point.body}
              </Point>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Card tone="ground" pad="lg">
            <h3 className={type.h3}>{copy.card.title}</h3>
            <ol className="mt-4 flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-surface-sunken text-muted">
                  <Upload className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold">{copy.card.sent}</p>
                  <p className="text-caption text-muted">{copy.card.sentNote}</p>
                </div>
              </li>
              <li className="flex flex-col items-start gap-1 border-t border-border pt-4">
                <SubmissionBadge status="PENDING">{copy.card.review}</SubmissionBadge>
                <p className="text-caption text-muted">{copy.card.reviewNote}</p>
              </li>
              <li className="flex flex-col items-start gap-1 border-t border-border pt-4">
                <SubmissionBadge status="APPROVED">{copy.card.approved}</SubmissionBadge>
                <p className="text-caption text-muted">{copy.card.approvedNote}</p>
              </li>
            </ol>
          </Card>

          <Card tone="ground" pad="lg">
            <h3 className={type.h3}>{copy.board.title}</h3>
            <p className="mt-1 text-body-sm text-muted">{copy.board.body}</p>
            <ul className="mt-4 flex flex-wrap gap-6">
              {MEDAL_ORDER.map((medal) => (
                <li key={medal} className="flex items-center gap-2 text-body-sm font-medium">
                  <MedalDisc medal={medal} />
                  {medalNames[medal]}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Band>
  );
}

/* --- stickers ------------------------------------------------------------- */

const SHEET = [
  "first-light",
  "thousand-metres",
  "cartographer",
  "ten-logged",
  "first-ridge",
  "lake-district",
  "long-hauler",
  "twelve-months",
];

export function StickersSection({ t, home }: Reader & { home: string | null }) {
  const copy = t.landing.stickers;
  return (
    <Band id="stickers">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Card pad="lg" role="img" aria-label={copy.sheetLabel} className="order-last lg:order-first">
          <div className="grid grid-cols-4 place-items-center gap-4 sm:gap-6">
            {SHEET.map((key) => (
              <Sticker key={key} sticker={key} size="md" className="sm:size-20 lg:size-24" />
            ))}
          </div>
        </Card>

        <div>
          <SectionHead overline={copy.overline} title={copy.title} lede={copy.lede} />
          <ul className="flex flex-col gap-6">
            <Point icon={StickerIcon} title={copy.points.count.title(STICKER_ALLOWANCE.ultra)}>
              {copy.points.count.body}
            </Point>
            <Point icon={Mail} title={copy.points.post.title}>
              {copy.points.post.body}
            </Point>
            <Point icon={Users} title={copy.points.show.title}>
              {copy.points.show.body}
            </Point>
          </ul>
          <div className="mt-8">
            <ButtonLink href={home === "/dashboard" ? "/stickers" : "/signup"} variant="secondary" size="lg">
              {copy.cta}
            </ButtonLink>
          </div>
        </div>
      </div>
    </Band>
  );
}

/* --- plans ---------------------------------------------------------------- */

export function PricingSection({
  t,
  locale,
  interval,
  home,
}: Reader & { interval: BillingInterval; home: string | null }) {
  const copy = t.landing.pricing;
  const href = home === "/dashboard" ? "/settings/billing" : "/signup";

  return (
    <Band id="pricing" tone="surface">
      <SectionHead overline={copy.overline} title={copy.title} lede={copy.lede(REFUND_WINDOW_DAYS)} center />

      <div className="mb-8 flex justify-center">
        <SegmentedLinks
          label={copy.billing}
          active={interval}
          options={[
            { key: "monthly", label: copy.monthly, href: "/?billing=monthly#pricing" },
            { key: "yearly", label: copy.yearly, href: "/?billing=yearly#pricing" },
          ]}
        />
      </div>

      <ul className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {PLANS.map((plan) => {
          const words = planCopy(t, plan.id);
          const featured = Boolean(plan.badge);
          const price = plan.price[interval];
          const saving =
            interval === "yearly" && plan.price.monthly > 0
              ? Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100)
              : 0;

          return (
            <li key={plan.id} className="flex">
              <Card
                tone="ground"
                pad="lg"
                className={cn("flex w-full flex-col gap-4", featured && "border-primary ring-1 ring-primary")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className={type.h3}>{words.name}</h3>
                  {words.badge ? <Badge tone="primary">{words.badge}</Badge> : null}
                </div>

                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-display text-display font-bold tabular-nums">
                    {price === 0 ? copy.free : formatMoney(locale, price)}
                  </span>
                  <span className="text-body-sm text-muted">
                    {price === 0 ? copy.forever : interval === "yearly" ? copy.perYear : copy.perMonth}
                  </span>
                  {saving > 0 ? <Badge tone="success">{copy.save(saving)}</Badge> : null}
                </p>

                <p className="text-body-sm text-muted">{words.description}</p>

                <ul className="flex flex-col gap-2 text-body-sm" aria-label={copy.includes}>
                  {words.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {words.missing.length > 0 ? (
                  <ul className="flex flex-col gap-2 text-body-sm text-subtle" aria-label={copy.notIncluded}>
                    {words.missing.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-auto flex flex-col gap-2 pt-2">
                  <ButtonLink href={href} variant={featured ? "primary" : "secondary"} size="lg" block>
                    {copy.cta[plan.id]}
                  </ButtonLink>
                  <p className="text-center text-caption text-subtle">
                    {plan.id === "free" ? copy.noteFree : copy.note}
                  </p>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}

/* --- questions ------------------------------------------------------------ */

export function FaqSection({ t }: Reader) {
  const items = t.landing.faq.items;
  const entries: { key: string; q: string; a: string; link?: { href: string; label: string } }[] = [
    { key: "picker", q: items.picker.q, a: items.picker.a },
    { key: "free", q: items.free.q, a: items.free.a(FREE_QUEST_ALLOWANCE, STICKER_ALLOWANCE.free) },
    { key: "proof", q: items.proof.q, a: items.proof.a },
    { key: "weather", q: items.weather.q, a: items.weather.a },
    {
      key: "safety",
      q: items.safety.q,
      a: items.safety.a,
      link: { href: "/legal/safety", label: t.landing.footer.safety },
    },
    { key: "stickers", q: items.stickers.q, a: items.stickers.a },
    { key: "company", q: items.company.q, a: items.company.a },
    { key: "cancel", q: items.cancel.q, a: items.cancel.a(REFUND_WINDOW_DAYS) },
  ];

  return (
    <Band id="faq">
      <SectionHead overline={t.landing.faq.overline} title={t.landing.faq.title} />
      <div className="flex max-w-3xl flex-col gap-3">
        {entries.map((entry, index) => (
          <details
            key={entry.key}
            open={index === 0}
            className="group rounded-card border border-border bg-surface"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-4 text-h4 font-semibold">
              {entry.q}
              <ChevronDown
                className="size-5 shrink-0 text-subtle transition-transform duration-base group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="flex flex-col items-start gap-3 px-5 pb-5 text-body text-muted">
              <p>{entry.a}</p>
              {entry.link ? (
                <Link href={entry.link.href} className="inline-flex items-center gap-1 text-primary underline underline-offset-2">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {entry.link.label}
                </Link>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </Band>
  );
}

/* --- the closing call: join the monthly quest ------------------------------ */

export function FinalCta({ t, home }: Reader & { home: string | null }) {
  const copy = t.landing.cta;
  const primary =
    home === "/admin"
      ? { label: t.landing.nav.openPanel, href: "/admin" }
      : home
        ? { label: t.landing.hero.open, href: "/monthly" }
        : { label: copy.primary, href: "/signup" };

  return (
    <section className="pb-16 lg:pb-24">
      <Container>
        <FeaturePanel className="flex flex-col items-center gap-4 text-center lg:py-16">
          <h2 className={cn(type.display, "max-w-3xl")}>{copy.title}</h2>
          <p className="max-w-text text-body-lg">{copy.lede}</p>
          <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href={primary.href} variant="monthly" size="lg">
              {primary.label}
            </ButtonLink>
            <ButtonLink href="#pricing" variant="onFeature" size="lg">
              {copy.secondary}
            </ButtonLink>
          </div>
        </FeaturePanel>
      </Container>
    </section>
  );
}
