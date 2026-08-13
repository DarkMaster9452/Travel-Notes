import Link from "next/link";

import { QuestImage } from "@/components/quest/quest-image";
import { Icon, IconArrowRight, IconCrown, IconPin } from "@/components/ui/icons";
import type { Achievement } from "@/lib/achievements";
import { DIFFICULTY_LABEL } from "@/lib/quest/taxonomy";
import { cn } from "@/lib/utils";
import type { QuestSummary } from "@/types/quest";

/**
 * The panels the account dashboard is assembled from. All server components —
 * none of them holds state, so none of them ships JavaScript.
 */

export function Panel({
  title,
  icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-line bg-card", className)}>
      {title && (
        <header className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
          {icon && (
            <span className="text-muted" aria-hidden="true">
              {icon}
            </span>
          )}
          <h2 className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted">
            {title}
          </h2>
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[0.625rem] font-semibold tracking-[0.12em] uppercase text-muted transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}

/** The four headline numbers beside the greeting. */
export function StatStrip({
  completed,
  favourites,
  countries,
  distanceKm,
}: {
  completed: number;
  favourites: number;
  countries: number;
  distanceKm: number;
}) {
  const items = [
    { label: "Quests Completed", value: String(completed), icon: "compass" as const },
    { label: "Favorites", value: String(favourites), icon: "star" as const },
    { label: "Countries Explored", value: String(countries), icon: "map" as const },
    { label: "Distance Traveled", value: `${distanceKm} km`, icon: "boot" as const },
  ];

  return (
    <div className="grid grid-cols-2 rounded-xl border border-line bg-card/80 backdrop-blur-sm sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col gap-2 px-5 py-4",
            index > 0 && "sm:border-l sm:border-line",
            index === 1 && "border-l border-line sm:border-l",
            index >= 2 && "border-t border-line sm:border-t-0",
            index === 3 && "border-l border-line",
          )}
        >
          <span className="text-muted" aria-hidden="true">
            <Icon name={item.icon} size={20} />
          </span>
          <div>
            <p className="font-display text-2xl leading-none font-extrabold tabular-nums">
              {item.value}
            </p>
            <p className="mt-1.5 text-[0.6875rem] leading-tight font-medium text-muted">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Weekly / monthly featured quest — photo card with the type over a scrim. */
export function FeaturedQuestCard({
  label,
  quest,
  href,
  icon,
}: {
  label: string;
  quest: QuestSummary;
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <section className="relative flex min-h-[15rem] flex-col overflow-hidden rounded-xl bg-ink text-paper">
      <QuestImage
        src={quest.coverImage}
        alt=""
        palette={quest.palette}
        sizes="(max-width: 1024px) 100vw, 40vw"
        zoomOnHover={false}
      />
      {/* Left-weighted scrim: the type sits on the left, the photo shows on the right. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/25"
      />

      <div className="relative flex flex-1 flex-col p-5">
        <p className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-paper/70">
          {icon}
          {label}
        </p>

        <h3 className="mt-4 max-w-[14ch] font-display text-2xl leading-tight font-extrabold sm:text-3xl">
          {quest.title}
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-paper/75">
          <IconPin size={14} />
          {quest.location}
        </p>

        <p className="mt-3 line-clamp-2 max-w-[38ch] text-sm leading-relaxed text-paper/70">
          {quest.objective}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          <div className="flex items-center gap-2 text-[0.625rem] font-semibold tracking-[0.1em] uppercase text-paper/70">
            <span>{DIFFICULTY_LABEL[quest.difficulty]}</span>
            <span aria-hidden="true" className="text-paper/30">
              |
            </span>
            <span>{quest.duration >= 300 ? "Full-day" : "Half-day"}</span>
          </div>

          <Link
            href={href}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-paper px-4 text-xs font-semibold text-ink transition-colors hover:bg-ember-light"
          >
            View Quest
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The dark "quests left this week" dial. */
export function QuotaDial({
  remaining,
  allowance,
  isSubscribed,
}: {
  remaining: number;
  allowance: number;
  isSubscribed: boolean;
}) {
  const fraction = isSubscribed ? 1 : allowance === 0 ? 0 : remaining / allowance;
  const circumference = 2 * Math.PI * 46;

  return (
    <section className="flex flex-col items-center rounded-xl bg-ink p-6 text-center text-paper">
      <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-paper/70">
        Quests left this week
      </p>

      <div className="relative mt-5 size-28">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-paper/15"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
            className="text-ember-light"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-extrabold tabular-nums">
          {isSubscribed ? "∞" : `${remaining} / ${allowance}`}
        </span>
      </div>

      <p className="mt-5 max-w-[28ch] text-sm leading-relaxed text-paper/70">
        {isSubscribed
          ? "Unlimited quests are yours. Unlock as many as you like."
          : remaining === 0
            ? "You've used all your free quests. Come back next week or upgrade to unlock unlimited quests."
            : `You have ${remaining} free ${remaining === 1 ? "quest" : "quests"} left. Make them count.`}
      </p>

      {!isSubscribed && (
        <Link
          href="/upgrade"
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ember-light text-xs font-semibold tracking-[0.08em] text-ink transition-colors hover:bg-paper"
        >
          <IconCrown size={15} /> Go Unlimited
        </Link>
      )}
    </section>
  );
}

/** Hex-badge grid used on the dashboard and the achievements page. */
export function AchievementBadges({
  achievements,
  className,
}: {
  achievements: Achievement[];
  className?: string;
}) {
  if (achievements.length === 0) {
    return <p className="text-sm text-muted">Nothing earned yet — finish a quest to get started.</p>;
  }

  return (
    <ul className={cn("flex flex-wrap gap-2.5", className)}>
      {achievements.map((achievement) => (
        <li key={achievement.id}>
          <span
            title={`${achievement.label} — ${achievement.earned ? "earned" : achievement.progressLabel}`}
            className={cn(
              "flex size-12 items-center justify-center border-2 transition-colors",
              // A hexagon, so the badges read as badges rather than buttons.
              "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]",
              achievement.earned
                ? "border-moss bg-moss/15 text-moss"
                : "border-line bg-ink/5 text-ink/20",
            )}
          >
            <Icon name={achievement.icon} size={20} />
            <span className="sr-only">
              {achievement.label}: {achievement.earned ? "earned" : achievement.progressLabel}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
