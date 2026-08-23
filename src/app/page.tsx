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
 * The landing page.
 *
 * A faithful port of `index.html`, which is the design source of truth for the
 * whole product. Two things changed and nothing else: the auth modal now posts
 * to the real signup and login actions, and the nav knows whether you are
 * already signed in.
 *
 * The sample generator is untouched and stays fake on purpose — a guest sees
 * three hardcoded loops above Rajecké Teplice and then a hard gate. Real quests
 * are generated server-side against an account's history.
 */
export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <AuthModalProvider>
      {/* Paper grain over the marketing surfaces. The app interior drops it. */}
      <div className="paper-grain" aria-hidden="true" />

      <LandingNav home={user ? homeFor(user) : null} />

      <main id="main">
        <Hero />
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
