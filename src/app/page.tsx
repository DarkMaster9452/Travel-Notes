import { Hero } from "@/components/marketing/hero";
import { MarketingNav } from "@/components/marketing/nav";
import {
  Destinations,
  Features,
  FinalCta,
  Footer,
  HowItWorks,
  Pricing,
  QuestPreview,
  Randomness,
} from "@/components/marketing/sections";
import { getCurrentUser } from "@/lib/auth/session";
import { getShowcaseQuests } from "@/lib/quest/showcase";

/**
 * Landing page. Public: visitors can read everything and see real generated
 * examples, but every call to action leads to signup — generation itself is
 * behind an account.
 */
export default async function LandingPage() {
  const [user, quests] = await Promise.all([getCurrentUser(), getShowcaseQuests(6)]);
  const signedIn = Boolean(user);

  return (
    <>
      <MarketingNav signedIn={signedIn} />
      <main id="main">
        <Hero signedIn={signedIn} />
        <HowItWorks />
        <Destinations />
        <QuestPreview quests={quests} />
        <Randomness />
        <Features />
        <Pricing signedIn={signedIn} />
        <FinalCta signedIn={signedIn} />
      </main>
      <Footer />
    </>
  );
}
