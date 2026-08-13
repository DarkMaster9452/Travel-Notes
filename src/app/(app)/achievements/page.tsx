import type { Metadata } from "next";

import { Panel } from "@/components/app/dashboard-panels";
import {
  ActivityRings,
  DifficultySplit,
  DistanceTrend,
  TerrainBreakdown,
} from "@/components/app/stats-charts";
import { Icon } from "@/components/ui/icons";
import { countEarned, getAchievements } from "@/lib/achievements";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getActivitySeries, getUserStats } from "@/lib/quest/service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

/** Monthly targets the rings fill against. Deliberately modest and fixed. */
const MONTHLY_GOALS = { quests: 4, distance: 40, elevation: 1500 };

export default async function AchievementsPage() {
  const user = await requireOnboardedUser();
  const [stats, activity] = await Promise.all([
    getUserStats(user.id),
    getActivitySeries(user.id),
  ]);

  const achievements = getAchievements(stats);
  const earned = countEarned(achievements);

  return (
    <main className="mx-auto max-w-[90rem] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted">
          Achievements & stats
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold normal-case sm:text-4xl">
          {earned} of {achievements.length} earned.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Everything below counts quests you marked as completed. Nobody is checking, but
          you&apos;ll know.
        </p>
      </header>

      {/* ---- Stats --------------------------------------------------- */}
      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Panel title="This month">
          <ActivityRings
            rings={[
              { label: "Quests", value: activity.monthCompleted, goal: MONTHLY_GOALS.quests },
              {
                label: "Distance",
                value: activity.monthDistance,
                goal: MONTHLY_GOALS.distance,
                unit: " km",
              },
              {
                label: "Ascent",
                value: activity.monthElevation,
                goal: MONTHLY_GOALS.elevation,
                unit: " m",
              },
            ]}
          />
        </Panel>

        <Panel title="Distance completed by month">
          <DistanceTrend months={activity.months} />
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="By difficulty">
          <DifficultySplit data={activity.byDifficulty} />
        </Panel>

        <Panel title="By terrain">
          <TerrainBreakdown data={activity.byTerrain} />
        </Panel>
      </section>

      {/* ---- Totals -------------------------------------------------- */}
      <section className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Quests", value: stats.questCount },
          { label: "Completed", value: stats.completedCount },
          { label: "Km explored", value: stats.kmExplored },
          { label: "Metres climbed", value: stats.elevation },
          { label: "Regions", value: stats.regions },
          { label: "Saved", value: stats.savedCount },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-line bg-card px-5 py-4">
            <p className="font-display text-2xl font-extrabold tabular-nums">{item.value}</p>
            <p className="mt-1 text-[0.6875rem] font-medium tracking-wide uppercase text-muted">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      {/* ---- Badges -------------------------------------------------- */}
      <h2 className="mt-12 font-display text-2xl font-extrabold normal-case">Badges</h2>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <li
            key={achievement.id}
            className={cn(
              "flex items-start gap-4 rounded-xl border bg-card p-5 transition-colors",
              achievement.earned ? "border-moss/40" : "border-line",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-14 shrink-0 items-center justify-center border-2",
                "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]",
                achievement.earned
                  ? "border-moss bg-moss/15 text-moss"
                  : "border-line bg-ink/5 text-ink/20",
              )}
            >
              <Icon name={achievement.icon} size={24} />
            </span>

            <div className="min-w-0">
              <h3 className="font-display text-lg font-extrabold normal-case">
                {achievement.label}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{achievement.description}</p>

              <div className="mt-3">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-ink/8"
                  role="progressbar"
                  aria-valuenow={Math.round(achievement.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${achievement.label} progress`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full",
                      achievement.earned ? "bg-moss" : "bg-grade-2",
                    )}
                    style={{ width: `${Math.round(achievement.progress * 100)}%` }}
                  />
                </div>
                <p
                  className={cn(
                    "mt-2 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase",
                    achievement.earned ? "text-moss" : "text-muted",
                  )}
                >
                  {achievement.progressLabel}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
