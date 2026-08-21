import type { Metadata } from "next";

import { FeaturedQuestPage } from "@/components/app/featured-quest-page";
import { requireClient } from "@/lib/auth/guards";
import { loadFeaturedSlot } from "@/lib/quest/slot";

export const metadata: Metadata = { title: "Monthly quest" };
export const dynamic = "force-dynamic";

export default async function MonthlyQuestPage() {
  const user = await requireClient();
  const slot = await loadFeaturedSlot(user.id, "month");

  return (
    <FeaturedQuestPage
      {...slot}
      label="This month"
      eyebrow="The big one"
      blurb="One a month, harder than the weekly, open from the first. Everyone gets the same one, and everyone files it."
      counters={{ accepted: 61, logged: 14 }}
    />
  );
}
