import type { Metadata } from "next";

import { Kicker } from "@/components/ui/primitives";
import { countEarned, getAchievements } from "@/lib/achievements";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getUserStats } from "@/lib/quest/service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await requireOnboardedUser();
  const stats = await getUserStats(user.id);
  const achievements = getAchievements(stats);
  const earned = countEarned(achievements);

  return (
    <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-10">
      <header className="border-b border-ink/12 pb-8">
        <Kicker>Achievements</Kicker>
        <h1 className="display-md mt-4 max-w-[18ch]">
          {earned} of {achievements.length} earned.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone">
          Counted from quests you marked as completed. Nobody is checking, but you&apos;ll know.
        </p>
      </header>

      <ul className="grid gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <li
            key={achievement.id}
            className={cn(
              "flex items-start gap-4 rounded-sm border p-5 transition-colors",
              achievement.earned
                ? "border-moss/40 bg-moss/8"
                : "border-ink/12 bg-paper-dim/30",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-14 shrink-0 items-center justify-center border text-2xl",
                "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]",
                achievement.earned
                  ? "border-moss bg-moss/20"
                  : "border-ink/10 bg-ink/5 opacity-40 grayscale",
              )}
            >
              {achievement.icon}
            </span>

            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold uppercase">{achievement.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-stone">{achievement.description}</p>

              <div className="mt-3">
                <div
                  className="h-1 w-full overflow-hidden rounded-full bg-ink/10"
                  role="progressbar"
                  aria-valuenow={Math.round(achievement.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${achievement.label} progress`}
                >
                  <div
                    className={cn("h-full rounded-full", achievement.earned ? "bg-moss" : "bg-ember")}
                    style={{ width: `${Math.round(achievement.progress * 100)}%` }}
                  />
                </div>
                <p
                  className={cn(
                    "mt-2 text-[0.6875rem] font-semibold tracking-[0.12em] uppercase",
                    achievement.earned ? "text-moss" : "text-stone",
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
