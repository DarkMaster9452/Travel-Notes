import { acceptRulesAction } from "@/app/(app)/actions";
import { Button, Marker, SectionLabel } from "@/components/stopa/ui";
import { requireUser } from "@/lib/auth/guards";
import { PRIZES } from "@/lib/gamification";
import { fill, getTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const user = await requireUser();
  const { t } = await getTranslations();

  return (
    <main className="space-y-9">
      <section>
        <SectionLabel>{t.rewards.title}</SectionLabel>
        <ul className="mt-3 space-y-2.5">
          {PRIZES.map((prize) => {
            const unlocked = user.points >= prize.points;
            const missing = prize.points - user.points;
            return (
              <li
                key={prize.id}
                className={cn(
                  "flex items-center gap-3.5 rounded-[12px] border px-4 py-3.5",
                  unlocked ? "border-olive bg-olive/15" : "border-cream/15 bg-forest-card",
                )}
              >
                <Marker color={prize.marker} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg leading-tight">
                    {t.prizes[prize.id as keyof typeof t.prizes]}
                  </p>
                  <p className="mt-0.5 text-sm text-moss">
                    {fill(t.rewards.from, { points: prize.points })}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm",
                    unlocked ? "uppercase tracking-[0.12em] text-cream" : "text-moss",
                  )}
                >
                  {unlocked ? t.rewards.done : fill(t.rewards.missing, { points: missing })}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="rules" className="scroll-mt-6">
        <SectionLabel>{t.rewards.rules}</SectionLabel>
        <ul className="mt-4 space-y-3">
          {t.rulesList.map((rule) => (
            <li key={rule} className="flex gap-3 font-serif text-base leading-relaxed">
              <span aria-hidden="true" className="text-moss">
                ·
              </span>
              {rule}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {user.rulesAcceptedAt ? (
            <p className="text-sm text-moss">{t.rewards.accepted}</p>
          ) : (
            <form action={acceptRulesAction}>
              <Button type="submit" size="block">
                {t.rewards.accept}
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
