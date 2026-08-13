import type { Metadata } from "next";
import Link from "next/link";

import {
  AchievementBadges,
  FeaturedQuestCard,
  Panel,
  PanelLink,
  QuotaDial,
  StatStrip,
} from "@/components/app/dashboard-panels";
import { QuestDatabase } from "@/components/app/quest-database";
import { SurpriseMeBar } from "@/components/app/unlock-actions";
import { QuestImage } from "@/components/quest/quest-image";
import {
  IconActivity,
  IconArrowRight,
  IconBookmark,
  IconCalendar,
  IconDatabase,
  IconSettings,
  IconTrophy,
} from "@/components/ui/icons";
import { getAchievements } from "@/lib/achievements";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { FREE_QUEST_ALLOWANCE } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getCatalogue, getCatalogueFilters } from "@/lib/quest/catalogue";
import { getFeaturedQuests } from "@/lib/quest/featured";
import { getUserStats } from "@/lib/quest/service";
import { formatRelativeDate } from "@/lib/utils";
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
      take: 4,
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
    <main className="pb-12">
      {/* ---- Hero band ------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-[#f6f2e6] to-canvas">
        {/* Layered ridgeline, drawn rather than photographed so it stays crisp
            at any width and costs no network request. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 260"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] w-full"
        >
          <path d="M0 260 L0 170 L180 92 L340 168 L470 120 L640 210 L760 150 L900 205 L1050 138 L1200 196 L1200 260Z" className="fill-moss/12" />
          <path d="M0 260 L0 205 L150 150 L320 214 L520 168 L700 232 L880 186 L1060 226 L1200 190 L1200 260Z" className="fill-moss/20" />
        </svg>

        <div className="relative mx-auto flex max-w-[90rem] flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-12">
          <div>
            {/* Not `display-*`: the global heading rule uppercases everything,
                and shouting someone's own name at them is a bit much. */}
            <h1 className="font-display text-3xl leading-[1.1] font-medium normal-case sm:text-4xl">
              Good to see you,
              <br />
              <span className="font-extrabold">{firstName}.</span>
            </h1>
            <p className="mt-3 text-sm text-muted">Adventure is calling. Where will you go next?</p>

            <Link
              href="/database"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-moss"
            >
              Find My Next Quest
              <IconArrowRight size={16} />
            </Link>
          </div>

          <div className="w-full lg:max-w-2xl">
            <StatStrip
              completed={stats.completedCount}
              favourites={stats.savedCount}
              countries={stats.countries}
              distanceKm={stats.kmExplored}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-4 pt-6 sm:px-6 lg:px-8">
        {/* ---- Featured quests + quota --------------------------------- */}
        <section className="grid gap-4 lg:grid-cols-3">
          {weekly ? (
            <FeaturedQuestCard
              label="Weekly quest"
              quest={weekly.summary}
              href="/weekly"
              icon={<IconCalendar size={15} />}
            />
          ) : (
            <Panel title="Weekly quest" icon={<IconCalendar size={16} />}>
              <p className="text-sm text-muted">
                We couldn&apos;t place a quest for your current preferences. Widen your radius in
                your profile and it&apos;ll show up here.
              </p>
            </Panel>
          )}

          {monthly ? (
            <FeaturedQuestCard
              label="Monthly quest"
              quest={monthly.summary}
              href="/monthly"
              icon={<IconCalendar size={15} />}
            />
          ) : (
            <Panel title="Monthly quest" icon={<IconCalendar size={16} />}>
              <p className="text-sm text-muted">
                Nothing to feature this month yet — adjust your preferences in your profile.
              </p>
            </Panel>
          )}

          <QuotaDial
            remaining={entitlement.freeQuestsRemaining}
            allowance={FREE_QUEST_ALLOWANCE}
            isSubscribed={entitlement.isSubscribed}
          />
        </section>

        {/* ---- Database + side rail ------------------------------------ */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1.75fr_1fr]">
          <Panel
            title="Quest database"
            icon={<IconDatabase size={16} />}
            bodyClassName="p-5 pt-4"
          >
            <QuestDatabase
              entries={catalogue}
              countries={filters.countries}
              difficulties={filters.difficulties}
              durations={filters.durations}
              canUnlock={entitlement.canUnlock}
              limit={3}
              compact
            />
            <div className="mt-4 border-t border-line pt-4 text-center">
              <Link
                href="/database"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-moss"
              >
                View all quests
                <IconArrowRight size={15} />
              </Link>
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            {/* Saved quests */}
            <Panel
              title="Saved quests"
              icon={<IconBookmark size={16} />}
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
                        className="relative aspect-[4/3] flex-1 overflow-hidden rounded-lg"
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
                      className="flex aspect-[4/3] flex-1 items-center justify-center rounded-lg bg-ink/5 font-display text-lg font-extrabold text-muted transition-colors hover:bg-ink/10"
                    >
                      +{stats.savedCount - 3}
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Nothing saved yet. Open a quest and hit save to keep it.
                </p>
              )}
            </Panel>

            {/* Achievements */}
            <Panel
              title="Achievements"
              icon={<IconTrophy size={16} />}
              action={<PanelLink href="/achievements">View all</PanelLink>}
            >
              <AchievementBadges achievements={achievements.slice(0, 4)} />
            </Panel>

            {/* Recent activity */}
            <Panel
              title="Recent activity"
              icon={<IconActivity size={16} />}
              action={
                history.length > 0 ? <PanelLink href="/history">View all</PanelLink> : undefined
              }
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
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg">
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
                              {entry.completed ? "You completed " : "Unlocked "}
                              <span className="font-medium">{quest.title}</span>
                            </span>
                          </span>
                          <span className="shrink-0 text-xs whitespace-nowrap text-muted">
                            {formatRelativeDate(entry.generatedAt)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  Nothing yet. Unlock your first quest and it&apos;ll appear here.
                </p>
              )}
            </Panel>

            {/* Settings & account */}
            <Panel title="Settings & account" icon={<IconSettings size={16} />}>
              <div className="grid grid-cols-2 gap-2">
                <QuickLink href="/profile">Profile</QuickLink>
                <QuickLink href="/upgrade">Billing</QuickLink>
              </div>
            </Panel>
          </div>
        </section>

        {/* ---- Surprise me --------------------------------------------- */}
        <div className="mt-4">
          <SurpriseMeBar disabled={!entitlement.canUnlock} />
        </div>
      </div>
    </main>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-11 items-center justify-center rounded-lg border border-line text-sm font-medium text-ink transition-colors hover:bg-ink/5"
    >
      {children}
    </Link>
  );
}
