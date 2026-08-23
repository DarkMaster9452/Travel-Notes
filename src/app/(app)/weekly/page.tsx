import type { Metadata } from "next";

import { FeaturedQuestPage } from "@/components/app/featured-quest-page";
import { requireClient } from "@/lib/auth/guards";
import { getFeaturedSlotCounters } from "@/lib/quest/featured";
import { loadFeaturedSlot } from "@/lib/quest/slot";

export const metadata: Metadata = { title: "Weekly quest" };
export const dynamic = "force-dynamic";

export default async function WeeklyQuestPage() {
  const user = await requireClient();
  const slot = await loadFeaturedSlot(user.id, "week");

  // Real counts, and only for a slot an admin booked — a generated quest is
  // this account's alone, and "everyone else" would be a community of one.
  const counters = await getFeaturedSlotCounters(slot.featured);

  return (
    <FeaturedQuestPage
      {...slot}
      period="week"
      label="This week"
      eyebrow="Same quest, same week, everyone"
      blurb="The whole community gets this one, and it has to be logged before the window shuts."
      counters={counters}
    />
  );
}
