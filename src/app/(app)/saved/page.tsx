import type { Metadata } from "next";
import Link from "next/link";

import { QuestCard } from "@/components/quest/quest-card";
import { Button } from "@/components/ui/button";
import { Kicker, StateBlock } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cn, pluralise } from "@/lib/utils";
import { toQuestSummary } from "@/types/quest";

export const metadata: Metadata = { title: "Saved quests" };
export const dynamic = "force-dynamic";

type Sort = "recent" | "distance" | "difficulty";

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: "recent", label: "Recently saved" },
  { id: "distance", label: "Shortest first" },
  { id: "difficulty", label: "Hardest first" },
];

const DIFFICULTY_RANK = { EASY: 0, MODERATE: 1, HARD: 2, EXPERT: 3 } as const;

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { sort: rawSort } = await searchParams;
  const sort: Sort = SORTS.some((s) => s.id === rawSort) ? (rawSort as Sort) : "recent";

  const saved = await db.savedQuest.findMany({
    where: { userId: user.id },
    orderBy: { savedAt: "desc" },
    include: { quest: true },
  });

  const quests = saved.map((entry) => toQuestSummary(entry.quest, { saved: true }));

  if (sort === "distance") quests.sort((a, b) => a.distance - b.distance);
  if (sort === "difficulty") {
    quests.sort((a, b) => DIFFICULTY_RANK[b.difficulty] - DIFFICULTY_RANK[a.difficulty]);
  }

  return (
    <main className="px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14">
      <header className="border-b border-ink/12 pb-8">
        <Kicker>Kept for later</Kicker>
        <h1 className="display-lg mt-4">Saved</h1>

        {quests.length > 0 && (
          <>
            <p className="mt-5 text-sm text-stone">{pluralise(quests.length, "quest")} waiting.</p>
            <nav className="mt-8 flex flex-wrap gap-2" aria-label="Sort saved quests">
              {SORTS.map((option) => (
                <Link
                  key={option.id}
                  href={option.id === "recent" ? "/saved" : `/saved?sort=${option.id}`}
                  aria-current={sort === option.id ? "true" : undefined}
                  className={cn(
                    "border px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition-colors",
                    sort === option.id
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/25 text-stone hover:border-ink hover:text-ink",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </header>

      {quests.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} className="h-full" />
          ))}
        </div>
      ) : (
        <StateBlock
          className="mt-10"
          title="Nothing saved yet."
          message="Your next adventure could go here. Open any quest and hit save — it'll wait for you."
          action={
            <Button asChild variant="outline">
              <Link href="/history">Look through your quests</Link>
            </Button>
          }
        />
      )}
    </main>
  );
}
