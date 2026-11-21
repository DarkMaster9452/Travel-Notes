import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import {
  FaqSection,
  FinalCta,
  Hero,
  HowItWorks,
  PricingSection,
  ProofSection,
  StickersSection,
  WeeklyQuests,
} from "@/components/marketing/sections";
import { homeFor } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { getLandingMonthly, getLandingWeeklies } from "@/lib/landing";

/**
 * The landing page (design/DESIGN-SYSTEM.md §12).
 *
 * It opens on the real monthly quest, because the product turns around it,
 * and then explains itself in the order somebody deciding whether to sign up
 * asks: how it works, what a quest looks like, how proof and the board work,
 * what the stickers are, what it costs, the questions, and one last invitation.
 *
 * Read in the visitor's language (the switcher in the nav, then the browser,
 * then Slovak) or, signed in, in the account's.
 */
export const dynamic = "force-dynamic";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const [user, locale, params] = await Promise.all([getCurrentUser(), getLocale(), searchParams]);
  const t = getMessages(locale);
  const home = user ? homeFor(user) : null;

  const monthly = await getLandingMonthly();
  const weeklies = await getLandingWeeklies(monthly?.quest.id ?? null);

  const reader = { t, locale };
  const links = [
    { href: "#how", label: t.landing.nav.how },
    { href: "#quests", label: t.landing.nav.quests },
    { href: "#proof", label: t.landing.nav.proof },
    { href: "#stickers", label: t.landing.nav.stickers },
    { href: "#pricing", label: t.landing.nav.pricing },
    { href: "#faq", label: t.landing.nav.faq },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-tooltip rounded-control bg-surface px-4 py-2 text-body-sm font-semibold text-text focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.ui.skipToContent}
      </a>
      <SiteNav home={home} links={links} linksLabel={t.landing.nav.label} />

      <main id="main">
        <Hero {...reader} monthly={monthly} home={home} />
        <HowItWorks {...reader} />
        <WeeklyQuests {...reader} quests={weeklies} home={home} />
        <ProofSection {...reader} />
        <StickersSection {...reader} home={home} />
        <PricingSection {...reader} interval={params.billing === "yearly" ? "yearly" : "monthly"} home={home} />
        <FaqSection {...reader} />
        <FinalCta {...reader} home={home} />
      </main>

      <SiteFooter t={t} />
    </div>
  );
}
