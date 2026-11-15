import { DifficultyMeter, QuestFigures, TrailMarks, TrailPhoto, toTrailQuest } from "@/components/domain/trail";
import { Badge } from "@/components/ui/badge";
import { type } from "@/components/ui/typography";
import type { Locale, Messages } from "@/lib/i18n";
import { getLandingMonthly } from "@/lib/landing";
import { slotTitle } from "@/lib/quest/labels";

/**
 * The right half of the split auth layout (design/DESIGN-SYSTEM.md §12): the
 * monthly quest's photograph and its facts on the Sun panel. Somebody about to
 * sign in sees what is waiting on the other side.
 */
export async function AuthSide({ t, locale }: { t: Messages; locale: Locale }) {
  const monthly = await getLandingMonthly();

  return (
    <aside className="hidden bg-feature text-feature-fg lg:flex lg:flex-col lg:justify-center lg:p-12">
      <div className="mx-auto flex w-full max-w-narrow flex-col gap-6">
        {monthly ? (
          <>
            <TrailPhoto
              src={monthly.quest.coverImage}
              alt=""
              eager
              tone="feature"
              className="aspect-4/3 rounded-card"
            />
            <div className="flex flex-col gap-3">
              <div>
                <Badge tone="monthly">
                  {monthly.slot
                    ? `${t.trail.monthly} · ${slotTitle(monthly.slot, locale, t)}`
                    : t.auth.side.overline}
                </Badge>
              </div>
              <p className={type.display}>{monthly.quest.title}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <TrailMarks marks={monthly.quest.trailMarks} t={t} ground="feature" />
                <DifficultyMeter level={monthly.quest.difficulty} t={t} ground="feature" />
              </div>
              <QuestFigures
                quest={toTrailQuest(monthly.quest, t)}
                t={t}
                locale={locale}
                className="divide-feature-fg/15 bg-feature-soft [&_dt]:text-feature-fg"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Badge tone="monthly">{t.auth.side.overline}</Badge>
            </div>
            <p className={type.display}>{t.auth.side.fallbackTitle}</p>
            <p className="text-body-lg">{t.auth.side.fallbackBody}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
