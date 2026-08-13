import type { Metadata } from "next";
import Link from "next/link";

import { FeaturedQuestView } from "@/components/app/featured-quest-view";
import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getFeaturedQuest, periodEnds } from "@/lib/quest/featured";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Weekly quest" };
export const dynamic = "force-dynamic";

export default async function WeeklyQuestPage() {
  const user = await requireOnboardedUser();
  const featured = await getFeaturedQuest(user.id, "week");

  if (!featured) {
    return (
      <main className="px-5 py-16 sm:px-10">
        <StateBlock
          title="No weekly quest right now."
          message="We couldn't place one inside your current radius and difficulty. Widen either in settings and it'll appear here."
          action={
            <Button asChild variant="outline" size="lg">
              <Link href="/profile">Open settings</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <FeaturedQuestView
      featured={featured}
      label="Weekly quest"
      resetsCopy={`This week's pick — a new one lands ${formatDate(periodEnds("week"))}.`}
    />
  );
}
