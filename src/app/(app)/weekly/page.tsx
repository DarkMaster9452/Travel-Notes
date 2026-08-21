import type { Metadata } from "next";

import { FeaturedQuestPage } from "@/components/app/featured-quest-page";
import { requireClient } from "@/lib/auth/guards";
import { loadFeaturedSlot } from "@/lib/quest/slot";

export const metadata: Metadata = { title: "Weekly quest" };
export const dynamic = "force-dynamic";

export default async function WeeklyQuestPage() {
  const user = await requireClient();
  const slot = await loadFeaturedSlot(user.id, "week");

  return (
    <FeaturedQuestPage
      {...slot}
      label="This week"
      eyebrow="Same quest, same week, everyone"
      blurb="The whole community gets this one, and it has to be logged before the window shuts."
      counters={{ accepted: 347, logged: 128 }}
    />
  );
}
