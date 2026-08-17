import type { Metadata } from "next";

import { FeaturedQuestPage } from "@/components/app/featured-quest-page";
import { requireUser } from "@/lib/auth/guards";
import { getFeaturedQuest, periodEnds } from "@/lib/quest/featured";

export const metadata: Metadata = { title: "Weekly quest" };
export const dynamic = "force-dynamic";

export default async function WeeklyQuestPage() {
  const user = await requireUser();
  const featured = await getFeaturedQuest(user.id, "week");

  return (
    <FeaturedQuestPage
      featured={featured}
      label="This week"
      eyebrow="Same quest, same week, everyone"
      closesAt={periodEnds("week")}
      blurb="The whole community gets this one. Same objective, same window, same bonus challenge."
      counters={{ accepted: 347, logged: 128 }}
    />
  );
}
