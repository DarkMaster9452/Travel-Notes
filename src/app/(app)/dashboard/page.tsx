import type { Metadata } from "next";
import Link from "next/link";

import { GenerateQuest } from "@/components/app/generate-quest";
import { QuestCard, QuestRow } from "@/components/quest/quest-card";
import { Button } from "@/components/ui/button";
import { Kicker, Stat, StateBlock } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { FREE_QUEST_ALLOWANCE } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getUserStats } from "@/lib/quest/service";
import { formatDate, pluralise } from "@/lib/utils";
import { toQuestSummary } from "@/types/quest";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();

  const [entitlement, stats, history, saved] = await Promise.all([
    getEntitlement(user.id),
    getUserStats(user.id),
    db.questHistory.findMany({
      where: { userId: user.id },
      orderBy: { generatedAt: "desc" },
      take: 5,
      include: { quest: true },
    }),
    db.savedQuest.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: "desc" },
      take: 3,
      include: { quest: true },
    }),
  ]);

  const latest = history[0];
  const previous = history.slice(1);
  const firstName = user.name.split(" ")[0];

  return (
    <main className="px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14">
      {/* ---- Header ---------------------------------------------------- */}
      <section className="border-b border-ink/12 pb-10">
        <Kicker>{firstName}&apos;s adventure hub</Kicker>

        <h1 className="display-lg mt-4 max-w-[14ch]">Ready for your next quest?</h1>

        <div className="mt-9 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <GenerateQuest
            disabled={!entitlement.canGenerate}
            label={entitlement.canGenerate ? "Generate quest" : "Out of free quests"}
          />

          <div className="sm:text-right">
            {entitlement.isSubscribed ? (
              <>
                <p className="font-display text-2xl font-extrabold uppercase text-moss">
                  Explorer · unlimited
                </p>
                <p className="mt-1 text-xs text-stone">
                  {entitlement.cancelAtPeriodEnd && entitlement.currentPeriodEnd
                    ? `Ends ${formatDate(entitlement.currentPeriodEnd)}`
                    : "Generate as often as you like."}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl font-extrabold uppercase">
                  {entitlement.freeQuestsRemaining} / {FREE_QUEST_ALLOWANCE} free quests remaining
                </p>
                <p className="mt-1 text-xs text-stone">
                  {entitlement.freeQuestsRemaining === 0 ? (
                    <Link href="/upgrade" className="text-ember underline underline-offset-4">
                      Unlock unlimited quests →
                    </Link>
                  ) : (
                    "No card needed until they're gone."
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---- Latest quest ---------------------------------------------- */}
      <section className="py-12">
        {latest ? (
          <>
            <Kicker>Your latest quest</Kicker>
            <div className="mt-6">
              <QuestCard
                quest={toQuestSummary(latest.quest, {
                  generatedAt: latest.generatedAt,
                  completed: latest.completed,
                  saved: latest.saved,
                })}
                size="feature"
                priority
              />
            </div>
          </>
        ) : (
          <StateBlock
            title="No quests yet."
            message="Hit generate and we'll find you somewhere to be. It takes about four seconds."
            action={<GenerateQuest disabled={!entitlement.canGenerate} label="Generate my first quest" size="lg" />}
          />
        )}
      </section>

      {/* ---- Recent ----------------------------------------------------- */}
      {previous.length > 0 && (
        <section className="border-t border-ink/12 py-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="display-md">Your recent quests</h2>
            <Link
              href="/history"
              className="text-xs font-semibold tracking-[0.14em] uppercase text-stone hover:text-ember"
            >
              All {pluralise(stats.questCount, "quest")} →
            </Link>
          </div>

          <div className="mt-6">
            {previous.map((entry) => (
              <QuestRow
                key={entry.id}
                quest={toQuestSummary(entry.quest, {
                  generatedAt: entry.generatedAt,
                  completed: entry.completed,
                  saved: entry.saved,
                })}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- Saved ------------------------------------------------------ */}
      <section className="border-t border-ink/12 py-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display-md">Saved</h2>
          {saved.length > 0 && (
            <Link
              href="/saved"
              className="text-xs font-semibold tracking-[0.14em] uppercase text-stone hover:text-ember"
            >
              All saved →
            </Link>
          )}
        </div>

        {saved.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((entry) => (
              <QuestCard key={entry.id} quest={toQuestSummary(entry.quest)} className="h-full" />
            ))}
          </div>
        ) : (
          <StateBlock
            className="mt-6"
            title="Nothing saved yet."
            message="Your next adventure could go here. Open a quest and hit save to keep it."
            action={
              <Button asChild variant="outline">
                <Link href="/history">Browse your quests</Link>
              </Button>
            }
          />
        )}
      </section>

      {/* ---- Stats ------------------------------------------------------ */}
      <section className="border-t border-ink/12 py-12">
        <h2 className="display-md">Your adventure stats</h2>
        <p className="mt-3 max-w-md text-sm text-stone">
          Counted from quests you marked as completed. Nobody is checking, but you&apos;ll know.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Quests" value={stats.questCount} />
          <Stat label="Completed" value={stats.completedCount} />
          <Stat label="Km explored" value={stats.kmExplored} />
          <Stat label="Metres climbed" value={stats.elevation} />
          <Stat label="Regions" value={stats.regions} />
          <Stat label="Waterfalls" value={stats.waterfalls} />
        </div>
      </section>
    </main>
  );
}
