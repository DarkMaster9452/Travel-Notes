import type { Metadata } from "next";

import { FeaturedQuestPage } from "@/components/app/featured-quest-page";
import { requireUser } from "@/lib/auth/guards";
import { getFeaturedQuest, periodEnds } from "@/lib/quest/featured";

export const metadata: Metadata = { title: "Monthly quest" };
export const dynamic = "force-dynamic";

export default async function MonthlyQuestPage() {
  const user = await requireUser();
  const featured = await getFeaturedQuest(user.id, "month");

  return (
    <FeaturedQuestPage
      featured={featured}
      label="This month"
      eyebrow="The big one"
      closesAt={periodEnds("month")}
      blurb="One a month, harder than the weekly, open from the first. Everyone gets the same one."
      counters={{ accepted: 61, logged: 14 }}
    />
  );
}
