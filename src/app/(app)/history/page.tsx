import type { Metadata } from "next";
import Link from "next/link";

import { GenerateQuest } from "@/components/app/generate-quest";
import { QuestRow } from "@/components/quest/quest-card";
import { Kicker, StateBlock } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { cn, formatDate, pluralise } from "@/lib/utils";
import { toQuestSummary } from "@/types/quest";

export const metadata: Metadata = { title: "Quest history" };
export const dynamic = "force-dynamic";

type Filter = "all" | "completed" | "todo";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "todo", label: "Still to do" },
];

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { filter: rawFilter } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.id === rawFilter) ? (rawFilter as Filter) : "all";

  const [entries, entitlement] = await Promise.all([
    db.questHistory.findMany({
      where: {
        userId: user.id,
        ...(filter === "completed" ? { completed: true } : {}),
        ...(filter === "todo" ? { completed: false } : {}),
      },
      orderBy: { generatedAt: "desc" },
      include: { quest: true },
    }),
    getEntitlement(user.id),
  ]);

  return (
    <main className="px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14">
      <header className="border-b border-ink/12 pb-8">
        <Kicker>Everything you&apos;ve been sent</Kicker>
        <h1 className="display-lg mt-4">Quest history</h1>
        <p className="mt-5 max-w-lg text-sm text-stone">
          This list is also what the generator reads before it builds anything new — the longer it
          gets, the further off the beaten track you end up.
        </p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter quests">
          {FILTERS.map((option) => (
            <Link
              key={option.id}
              href={option.id === "all" ? "/history" : `/history?filter=${option.id}`}
              aria-current={filter === option.id ? "true" : undefined}
              className={cn(
                "border px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition-colors",
                filter === option.id
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/25 text-stone hover:border-ink hover:text-ink",
              )}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </header>

      {entries.length > 0 ? (
        <>
          <p className="pt-8 text-xs tracking-[0.14em] uppercase text-stone">
            {pluralise(entries.length, "quest")}
          </p>
          <div className="mt-2">
            {entries.map((entry) => (
              <div key={entry.id} className="relative">
                <QuestRow
                  quest={toQuestSummary(entry.quest, {
                    generatedAt: entry.generatedAt,
                    completed: entry.completed,
                    saved: entry.saved,
                  })}
                />
                <span className="pointer-events-none absolute right-0 top-4 hidden text-xs text-stone lg:block">
                  {formatDate(entry.generatedAt)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <StateBlock
          className="mt-10"
          title={filter === "all" ? "Nothing here yet." : "Nothing matches that filter."}
          message={
            filter === "all"
              ? "Generate your first quest and it'll show up here, along with everything that comes after it."
              : "Try a different filter, or go and finish something."
          }
          action={
            filter === "all" ? (
              <GenerateQuest disabled={!entitlement.canGenerate} size="lg" />
            ) : (
              <Link
                href="/history"
                className="text-xs font-semibold tracking-[0.14em] uppercase text-ember hover:underline"
              >
                Show all quests →
              </Link>
            )
          }
        />
      )}
    </main>
  );
}
