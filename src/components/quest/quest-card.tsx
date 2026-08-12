import Link from "next/link";

import { QuestImage } from "@/components/quest/quest-image";
import { DIFFICULTY_LABEL } from "@/lib/quest/taxonomy";
import { cn, formatDistance, formatDuration, questNumber } from "@/lib/utils";
import type { QuestSummary } from "@/types/quest";

/**
 * The product's signature object: a full-bleed photograph with the quest
 * number above and oversized type sitting on the image itself.
 */

const SIZE_CLASSES = {
  feature: "aspect-[4/5] sm:aspect-[16/11]",
  default: "aspect-[4/5]",
  wide: "aspect-[3/2]",
} as const;

export function QuestCard({
  quest,
  size = "default",
  priority = false,
  href,
  eyebrow,
  className,
}: {
  quest: QuestSummary;
  size?: keyof typeof SIZE_CLASSES;
  priority?: boolean;
  href?: string;
  eyebrow?: string;
  className?: string;
}) {
  const titleSize =
    size === "feature"
      ? "text-[2.25rem] leading-[0.9] sm:text-6xl lg:text-7xl"
      : "text-[1.75rem] leading-[0.92] sm:text-4xl";

  return (
    <Link
      href={href ?? `/quests/${quest.id}`}
      className={cn(
        "group relative block overflow-hidden text-paper focus-visible:outline-offset-4",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <QuestImage
        src={quest.coverImage}
        alt={quest.title}
        palette={quest.palette}
        priority={priority}
        sizes={size === "feature" ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
      />

      <div className="scrim absolute inset-0" aria-hidden="true" />

      <div className="relative flex h-full flex-col justify-between p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="kicker text-paper/80">{eyebrow ?? questNumber(quest.number)}</span>
          <span className="kicker border border-paper/40 px-2 py-1 text-paper/85">
            {DIFFICULTY_LABEL[quest.difficulty]}
          </span>
        </div>

        <div>
          {quest.completed && (
            <span className="kicker mb-3 inline-block bg-moss px-2 py-1 text-paper">Completed</span>
          )}

          <h3 className={cn("font-display font-extrabold uppercase", titleSize)}>{quest.title}</h3>

          <p className="mt-3 max-w-sm font-serif text-base text-paper/75 italic">{quest.subtitle}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-paper/25 pt-4">
            <QuestMetric value={formatDistance(quest.distance)} />
            <QuestMetric value={formatDuration(quest.duration)} />
            <QuestMetric value={`+${quest.elevationGain} m`} />
            <span className="ml-auto hidden items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase transition-colors group-hover:text-ember-light sm:flex">
              Start quest
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuestMetric({ value }: { value: string }) {
  return (
    <span className="font-display text-lg font-bold tracking-wide uppercase tabular-nums sm:text-xl">
      {value}
    </span>
  );
}

/** Dense row used in history and saved lists. */
export function QuestRow({ quest, href }: { quest: QuestSummary; href?: string }) {
  return (
    <Link
      href={href ?? `/quests/${quest.id}`}
      className="group grid grid-cols-[5.5rem_1fr] items-stretch gap-4 border-b border-ink/12 py-4 transition-colors hover:bg-ink/4 sm:grid-cols-[8rem_1fr_auto] sm:gap-6"
    >
      <div className="relative aspect-square overflow-hidden">
        <QuestImage
          src={quest.coverImage}
          alt={quest.title}
          palette={quest.palette}
          sizes="128px"
          zoomOnHover={false}
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1">
        <span className="kicker text-stone">
          {questNumber(quest.number)}
          {quest.completed && <span className="ml-2 text-moss">· Completed</span>}
        </span>
        <h3 className="truncate font-display text-xl font-extrabold uppercase sm:text-2xl">
          {quest.title}
        </h3>
        <p className="truncate text-sm text-stone">
          {quest.location} · {formatDistance(quest.distance)} · {formatDuration(quest.duration)} ·{" "}
          {DIFFICULTY_LABEL[quest.difficulty]}
        </p>
      </div>

      <span className="hidden items-center self-center pr-2 text-xs font-semibold tracking-[0.16em] uppercase text-stone transition-colors group-hover:text-ember sm:flex">
        Open →
      </span>
    </Link>
  );
}
