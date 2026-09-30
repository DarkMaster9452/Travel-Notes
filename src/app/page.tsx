import { AuthModalProvider } from "@/components/landing/auth-modal";
import { DemoGenerator } from "@/components/landing/demo";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { RevealOnScroll } from "@/components/landing/reveal";
import {
  FaqSection,
  FinalCta,
  HowItWorks,
  LandingFooter,
  PricingSection,
  ProofSection,
  StickersSection,
  TerrainSection,
  TogetherSection,
  WeeklySection,
} from "@/components/landing/sections";
import { homeFor } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * The landing page. Opens on the monthly quest (design/DESIGN-SYSTEM.md §12);
 * the sections below it still use the legacy classes, reskinned by the
 * Trail tokens.
 *
 * The sample generator is untouched and stays fake on purpose — a guest sees
 * three hardcoded loops above Rajecké Teplice and then a hard gate. Real quests
 * are generated server-side against an account's history.
 */
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <AuthModalProvider>
      <LandingNav home={user ? homeFor(user) : null} />

      <main id="main">
        <Hero signedInHome={user ? homeFor(user) : null} />
        <DemoGenerator />
        <HowItWorks />
        <WeeklySection />
        <TogetherSection />
        <TerrainSection />
        <ProofSection />
        <StickersSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>

      <LandingFooter />
      <RevealOnScroll />
    </AuthModalProvider>
  );
}
