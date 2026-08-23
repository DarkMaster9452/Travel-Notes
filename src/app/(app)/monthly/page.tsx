import type { Metadata } from "next";

import { FeaturedQuestPage } from "@/components/app/featured-quest-page";
import { requireClient } from "@/lib/auth/guards";
import {
  getFeaturedProofStatus,
  getFeaturedQuest,
  getFeaturedSlotCounters,
  periodEnds,
} from "@/lib/quest/featured";

export const metadata: Metadata = { title: "Monthly quest" };
export const dynamic = "force-dynamic";

export default async function MonthlyQuestPage() {
  const user = await requireClient();
  const featured = await getFeaturedQuest(user.id, "month");
  const [proof, counters] = await Promise.all([
    getFeaturedProofStatus(user.id, featured),
    getFeaturedSlotCounters(featured),
  ]);

  return (
    <FeaturedQuestPage
      featured={featured}
      period="month"
      label="This month"
      eyebrow="The big one"
      closesAt={periodEnds("month")}
      blurb="One a month, harder than the weekly, open from the first. Everyone gets the same one."
      counters={counters}
      proof={proof}
    />
  );
}
