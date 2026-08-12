import Link from "next/link";

import { QuestImage } from "@/components/quest/quest-image";
import { DIFFICULTY_LABEL } from "@/lib/quest/taxonomy";
import { cn, formatDistance, formatDuration } from "@/lib/utils";
import type { Achievement } from "@/lib/achievements";
import type { QuestSummary } from "@/types/quest";

/**
 * The panels the account dashboard is assembled from. All server components —
 * none of them hold state, so none of them need to ship JavaScript.
 */

export function Panel({
  title,
  icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("flex flex-col border border-ink/12 bg-paper-dim/35 rounded-sm", className)}
    >
      <header className="flex items-center gap-3 border-b border-ink/10 px-5 py-3.5">
        {icon && (
          <span className="text-stone" aria-hidden="true">
            {icon}
          </span>
        )}
        <h2 className="kicker text-stone">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[0.625rem] font-semibold tracking-[0.14em] uppercase text-stone transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}

/** Quests completed / favourites / countries — the strip beside the greeting. */
export function StatStrip({
  completed,
  favourites,
  countries,
}: {
  completed: number;
  favourites: number;
  countries: number;
}) {
  const items = [
    { label: "Quests completed", value: completed, icon: <CompassGlyph /> },
    { label: "Favorites", value: favourites, icon: <StarGlyph /> },
    { label: "Countries explored", value: countries, icon: <PeaksGlyph /> },
  ];

  return (
    <div className="grid gap-px overflow-hidden rounded-sm border border-ink/12 bg-ink/10 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 bg-paper-dim/35 px-5 py-4">
          <span className="text-moss" aria-hidden="true">
            {item.icon}
          </span>
          <div>
            <p className="text-[0.625rem] font-semibold leading-tight tracking-[0.12em] uppercase text-stone">
              {item.label}
            </p>
            <p className="font-display text-2xl font-extrabold tabular-nums">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Weekly / monthly featured quest card. */
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
    <Panel title={label} icon={icon} bodyClassName="p-0">
      <div className="relative aspect-[16/7] w-full overflow-hidden">
        <QuestImage
          src={quest.coverImage}
          alt={quest.title}
          palette={quest.palette}
          sizes="(max-width: 1024px) 100vw, 33vw"
          zoomOnHover={false}
        />
      </div>

      <div className="p-5">
        <h3 className="font-display text-2xl font-extrabold sm:text-3xl">{quest.title}</h3>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-stone">
          <PinGlyph />
          {quest.location}
          {quest.region && quest.region !== quest.location ? `, ${quest.region}` : ""}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone">{quest.objective}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-stone">
            Difficulty: <span className="text-ink">{DIFFICULTY_LABEL[quest.difficulty]}</span>
          </span>
          <Link
            href={href}
            className="flex h-10 items-center justify-center rounded-sm bg-ink px-5 text-[0.625rem] font-semibold tracking-[0.14em] uppercase text-paper transition-colors hover:bg-moss"
          >
            View quest
          </Link>
        </div>
      </div>
    </Panel>
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
    <div className="flex flex-col items-center rounded-sm bg-ink p-6 text-center text-paper">
      <p className="kicker text-paper/60">Quests left this week</p>

      <div className="relative mt-5 size-28">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" className="text-paper/15" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
            className="text-ember-light transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-extrabold tabular-nums">
          {isSubscribed ? "∞" : `${remaining}/${allowance}`}
        </span>
      </div>

      <p className="mt-5 max-w-[26ch] text-sm leading-relaxed text-paper/70">
        {isSubscribed
          ? "Unlimited quests are yours. Generate whenever the mood strikes."
          : remaining === 0
            ? "You've used all your free quests. Come back next week or upgrade to unlock unlimited quests."
            : `You have ${remaining} free ${remaining === 1 ? "quest" : "quests"} left. Make them count.`}
      </p>

      {!isSubscribed && (
        <Link
          href="/upgrade"
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-ember-light text-[0.625rem] font-semibold tracking-[0.14em] uppercase text-ink transition-colors hover:bg-paper"
        >
          <CrownGlyph /> Go unlimited
        </Link>
      )}
    </div>
  );
}

/** Hex-badge grid used on the dashboard and the achievements page. */
export function AchievementBadges({
  achievements,
  showLocked = true,
  className,
}: {
  achievements: Achievement[];
  showLocked?: boolean;
  className?: string;
}) {
  const visible = showLocked ? achievements : achievements.filter((a) => a.earned);
  if (visible.length === 0) {
    return <p className="text-sm text-stone">Nothing earned yet — finish a quest to get started.</p>;
  }

  return (
    <ul className={cn("flex flex-wrap gap-3", className)}>
      {visible.map((achievement) => (
        <li key={achievement.id}>
          <span
            title={`${achievement.label} — ${achievement.earned ? "earned" : achievement.progressLabel}`}
            className={cn(
              "flex size-14 items-center justify-center border text-xl transition-colors",
              // A hexagon, so the badges read as badges rather than buttons.
              "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]",
              achievement.earned
                ? "border-moss bg-moss/20 text-ink"
                : "border-ink/10 bg-ink/5 text-ink/25 grayscale",
            )}
          >
            <span aria-hidden="true">{achievement.icon}</span>
            <span className="sr-only">
              {achievement.label}: {achievement.earned ? "earned" : achievement.progressLabel}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---- Small inline glyphs -------------------------------------------- */

const glyph = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CompassGlyph() {
  return (
    <svg {...glyph} width={22} height={22}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-2 4.5L8.5 15l2-4.5z" />
    </svg>
  );
}

export function StarGlyph() {
  return (
    <svg {...glyph} width={22} height={22}>
      <path d="m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z" />
    </svg>
  );
}

export function PeaksGlyph() {
  return (
    <svg {...glyph} width={22} height={22}>
      <path d="m3 18 5.5-9 3.5 5.5L14.5 11 21 18z" />
      <circle cx="17" cy="6.5" r="1.5" />
    </svg>
  );
}

export function PinGlyph() {
  return (
    <svg {...glyph} width={14} height={14}>
      <path d="M12 21s6.5-5.7 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}

export function CrownGlyph() {
  return (
    <svg {...glyph} width={14} height={14}>
      <path d="M4 17h16M4 17 3 7l5 3.5L12 5l4 5.5L21 7l-1 10" />
    </svg>
  );
}

export function CalendarGlyph() {
  return (
    <svg {...glyph}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3.5V6m8-2.5V6" />
    </svg>
  );
}

export function DatabaseGlyph() {
  return (
    <svg {...glyph}>
      <ellipse cx="12" cy="6.5" rx="7.5" ry="3" />
      <path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11" />
      <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    </svg>
  );
}

export function BookmarkGlyph() {
  return (
    <svg {...glyph}>
      <path d="M6 4h12v16l-6-4-6 4z" />
    </svg>
  );
}

export function TrophyGlyph() {
  return (
    <svg {...glyph}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H4.5V7A3.5 3.5 0 0 0 8 10.5M17 5.5h2.5V7a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 14v3m-3.5 3h7" />
    </svg>
  );
}

export function ActivityGlyph() {
  return (
    <svg {...glyph}>
      <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
    </svg>
  );
}

/** Compact metric row used under featured quests. */
export function QuestMeta({ quest }: { quest: QuestSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone">
      <span>{formatDistance(quest.distance)}</span>
      <span>{formatDuration(quest.duration)}</span>
      <span>+{quest.elevationGain} m</span>
    </div>
  );
}
