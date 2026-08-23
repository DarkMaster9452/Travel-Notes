import type { Metadata } from "next";

import { FeaturedQuestPage } from "@/components/app/featured-quest-page";
import { requireClient } from "@/lib/auth/guards";
import { getFeaturedSlotCounters } from "@/lib/quest/featured";
import { loadFeaturedSlot } from "@/lib/quest/slot";

export const metadata: Metadata = { title: "Monthly quest" };
export const dynamic = "force-dynamic";

export default async function MonthlyQuestPage() {
  const user = await requireClient();
  const slot = await loadFeaturedSlot(user.id, "month");

  // Real counts, and only for a slot an admin booked — a generated quest is
  // this account's alone, and "everyone else" would be a community of one.
  const counters = await getFeaturedSlotCounters(slot.featured);

  return (
    <FeaturedQuestPage
      {...slot}
      period="month"
      label="This month"
      eyebrow="The big one"
      blurb="One a month, harder than the weekly, open from the first. Everyone gets the same one, and everyone files it."
      counters={counters}
    />
  );
}
