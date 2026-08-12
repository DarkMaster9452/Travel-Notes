import type { Metadata } from "next";
import Link from "next/link";

import {
  AchievementBadges,
  ActivityGlyph,
  BookmarkGlyph,
  CalendarGlyph,
  DatabaseGlyph,
  FeaturedQuestCard,
  Panel,
  PanelLink,
  QuotaDial,
  StatStrip,
  TrophyGlyph,
} from "@/components/app/dashboard-panels";
import { GenerateQuest } from "@/components/app/generate-quest";
import { QuestDatabase } from "@/components/app/quest-database";
import { QuestImage } from "@/components/quest/quest-image";
import { StateBlock } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { getAchievements } from "@/lib/achievements";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { FREE_QUEST_ALLOWANCE } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getCatalogue, getCatalogueFilters } from "@/lib/quest/catalogue";
import { getFeaturedQuests } from "@/lib/quest/featured";
import { getUserStats } from "@/lib/quest/service";
import { formatDate } from "@/lib/utils";
import { toQuestSummary } from "@/types/quest";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();

  const [entitlement, stats, history, saved, featured] = await Promise.all([
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
      take: 4,
      include: { quest: true },
    }),
    getFeaturedQuests(user.id),
  ]);

  const catalogue = getCatalogue();
  const filters = getCatalogueFilters(catalogue);
  const achievements = getAchievements(stats);

  const weekly = featured.find((f) => f.period === "week");
  const monthly = featured.find((f) => f.period === "month");
  const firstName = user.name.split(" ")[0];

  return (
    <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-10">
      {/* ---- Greeting + headline stats --------------------------------- */}
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          {/* Deliberately not `display-md`: the global heading rule uppercases
              everything, and shouting someone's own name at them is a bit much. */}
          <h1 className="font-display text-4xl leading-[1.05] font-bold normal-case sm:text-5xl">
            Welcome back,
            <br />
            <span className="font-extrabold">{firstName}</span>
          </h1>
          <p className="mt-3 text-sm text-stone">
            Adventure is out there. Let&apos;s find your next one.
          </p>
        </div>

        <div className="w-full xl:max-w-2xl">
          <StatStrip
            completed={stats.completedCount}
            favourites={stats.savedCount}
            countries={stats.countries}
          />
        </div>
      </section>

      {/* ---- Featured quests + quota ----------------------------------- */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {weekly ? (
          <FeaturedQuestCard
            label="Weekly quest"
            quest={weekly.summary}
            href="/weekly"
            icon={<CalendarGlyph />}
          />
        ) : (
          <Panel title="Weekly quest" icon={<CalendarGlyph />}>
            <p className="text-sm text-stone">
              We couldn&apos;t place a quest for your current preferences. Widen your radius in
              settings and it&apos;ll show up here.
            </p>
          </Panel>
        )}

        {monthly ? (
          <FeaturedQuestCard
            label="Monthly quest"
            quest={monthly.summary}
            href="/monthly"
            icon={<CalendarGlyph />}
          />
        ) : (
          <Panel title="Monthly quest" icon={<CalendarGlyph />}>
            <p className="text-sm text-stone">
              Nothing to feature this month yet — adjust your preferences in settings.
            </p>
          </Panel>
        )}

        <div className="flex flex-col gap-4">
          <QuotaDial
            remaining={entitlement.freeQuestsRemaining}
            allowance={FREE_QUEST_ALLOWANCE}
            isSubscribed={entitlement.isSubscribed}
          />
          <GenerateQuest
            disabled={!entitlement.canGenerate}
            label={entitlement.canGenerate ? "Generate quest" : "Out of free quests"}
          />
        </div>
      </section>

      {/* ---- Database + side rail -------------------------------------- */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.75fr_1fr]">
        <Panel
          title="Quest database"
          icon={<DatabaseGlyph />}
          action={<PanelLink href="/database">View all</PanelLink>}
        >
          <QuestDatabase
            entries={catalogue}
            countries={filters.countries}
            difficulties={filters.difficulties}
            durations={filters.durations}
            limit={4}
            compact
          />
        </Panel>

        <div className="flex flex-col gap-4">
          {/* Saved quests */}
          <Panel
            title="Saved quests"
            icon={<BookmarkGlyph />}
            action={saved.length > 0 ? <PanelLink href="/saved">View all</PanelLink> : undefined}
          >
            {saved.length > 0 ? (
              <div className="flex gap-2">
                {saved.slice(0, 3).map((entry) => {
                  const quest = toQuestSummary(entry.quest);
                  return (
                    <Link
                      key={entry.id}
                      href={`/quests/${quest.id}`}
                      title={quest.title}
                      className="relative aspect-[4/3] flex-1 overflow-hidden rounded-sm"
                    >
                      <QuestImage
                        src={quest.coverImage}
                        alt={quest.title}
                        palette={quest.palette}
                        sizes="120px"
                        zoomOnHover={false}
                      />
                    </Link>
                  );
                })}
                {stats.savedCount > 3 && (
                  <Link
                    href="/saved"
                    className="flex aspect-[4/3] flex-1 items-center justify-center rounded-sm bg-ink/10 font-display text-lg font-extrabold text-stone transition-colors hover:bg-ink/15"
                  >
                    +{stats.savedCount - 3}
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone">
                Nothing saved yet. Open a quest and hit save to keep it.
              </p>
            )}
          </Panel>

          {/* Achievements */}
          <Panel
            title="Achievements"
            icon={<TrophyGlyph />}
            action={<PanelLink href="/achievements">View all</PanelLink>}
          >
            <AchievementBadges achievements={achievements.slice(0, 4)} />
          </Panel>

          {/* Recent activity */}
          <Panel
            title="Recent activity"
            icon={<ActivityGlyph />}
            action={history.length > 0 ? <PanelLink href="/history">View all</PanelLink> : undefined}
          >
            {history.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {history.slice(0, 3).map((entry) => {
                  const quest = toQuestSummary(entry.quest);
                  return (
                    <li key={entry.id}>
                      <Link
                        href={`/quests/${quest.id}`}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                      >
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-sm">
                          <QuestImage
                            src={quest.coverImage}
                            alt=""
                            palette={quest.palette}
                            sizes="40px"
                            zoomOnHover={false}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink">
                            {entry.completed ? "You completed" : "New quest:"} {quest.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-stone">
                          {formatDate(entry.generatedAt)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-stone">
                Nothing yet. Generate your first quest and it&apos;ll appear here.
              </p>
            )}
          </Panel>
        </div>
      </section>

      {/* ---- Empty state for brand-new accounts ------------------------- */}
      {history.length === 0 && (
        <StateBlock
          className="mt-8"
          title="No quests yet."
          message="Hit generate and we'll find you somewhere to be. It takes about four seconds."
          action={
            <div className="flex flex-wrap gap-3">
              <GenerateQuest
                disabled={!entitlement.canGenerate}
                label="Generate my first quest"
                size="lg"
              />
              <Button asChild variant="outline" size="lg">
                <Link href="/database">Browse the database</Link>
              </Button>
            </div>
          }
        />
      )}
    </main>
  );
}
