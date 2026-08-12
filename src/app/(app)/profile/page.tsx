import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { TrailRow } from "@/components/stopa/quest-card";
import { Button, Card, SectionLabel } from "@/components/stopa/ui";
import { requireUser } from "@/lib/auth/guards";
import { evaluateAchievements, type QuestCategoryId } from "@/lib/gamification";
import { fill, getTranslations } from "@/lib/i18n";
import {
  getMySubmissions,
  getPlayerStats,
  getRank,
  getUnlockedAchievements,
} from "@/lib/stopa/data";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const { t, locale } = await getTranslations();

  const [stats, rank, trails, unlocked] = await Promise.all([
    getPlayerStats(user.id),
    getRank(user.id),
    getMySubmissions(user.id, 10),
    getUnlockedAchievements(user.id),
  ]);

  const progress = evaluateAchievements(stats);

  return (
    <main className="space-y-9">
      <section>
        <SectionLabel>{t.profile.title}</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl">{user.name}</h1>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <Card solid className="px-4 py-3.5 text-center">
            <p className="font-serif text-3xl tabular-nums">{stats.points}</p>
            <p className="mt-1 text-xs text-moss">{t.profile.points}</p>
          </Card>
          <Card solid className="px-4 py-3.5 text-center">
            <p className="font-serif text-3xl tabular-nums">{rank ?? "—"}</p>
            <p className="mt-1 text-xs text-moss">{t.profile.rank}</p>
          </Card>
          <Card solid className="px-4 py-3.5 text-center">
            <p className="font-serif text-3xl tabular-nums">{stats.approvedQuests}</p>
            <p className="mt-1 text-xs text-moss">{t.profile.completed}</p>
          </Card>
        </div>
      </section>

      <section>
        <SectionLabel>{t.profile.achievements}</SectionLabel>
        <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {progress.map(({ achievement, unlocked: isUnlocked, current, target }) => {
            const copy = t.achievements[achievement.id as keyof typeof t.achievements];
            return (
              <li
                key={achievement.id}
                className={cn(
                  "rounded-[12px] border px-3.5 py-3.5",
                  isUnlocked
                    ? "border-amber/60 bg-amber/10"
                    : "border-cream/12 bg-forest-card/60 opacity-70",
                )}
              >
                <span className={cn("text-2xl", !isUnlocked && "grayscale")} aria-hidden="true">
                  {achievement.icon}
                </span>
                <p className="mt-2 font-serif text-base leading-tight">{copy.name}</p>
                <p className="mt-1 text-xs leading-snug text-moss">
                  {isUnlocked
                    ? unlocked.has(achievement.id)
                      ? t.profile.unlocked
                      : t.profile.unlocked
                    : fill(t.profile.achievementsLocked, { remaining: target - current })}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionLabel>{t.profile.myTrails}</SectionLabel>
        {trails.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {trails.map((trail) => (
              <TrailRow
                key={trail.id}
                title={trail.quest.title}
                points={trail.pointsAwarded}
                category={trail.quest.category as QuestCategoryId}
                status={trail.status}
                t={t}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-moss">{t.profile.noTrails}</p>
        )}
      </section>

      {trails.some((trail) => trail.status === "APPROVED") && (
        <section>
          <SectionLabel>{t.profile.difficultyLog}</SectionLabel>
          <ul className="mt-3 space-y-2">
            {trails
              .filter((trail) => trail.status === "APPROVED")
              .map((trail) => (
                <li key={trail.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-serif text-base">{trail.quest.title}</span>
                  <span className="shrink-0 text-moss">
                    {t.difficulty[trail.difficulty]} · {t.comparison[trail.comparison]}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <SectionLabel>{t.profile.settings}</SectionLabel>
        <Card solid className="mt-3">
          <p className="text-sm text-moss">
            {user.rulesAcceptedAt
              ? fill(t.profile.rulesAccepted, {
                  date: formatDate(user.rulesAcceptedAt, locale),
                })
              : t.profile.rulesNotAccepted}
          </p>
          <div className="mt-4">
            <LanguageToggle current={locale} tone="light" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/rewards#rules">{t.profile.reviewRules}</Link>
            </Button>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                {t.profile.logout}
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </main>
  );
}
