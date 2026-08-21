import * as React from "react";

import { cn } from "@/lib/utils";

import { IconBonus, IconPin, Seal } from "./icons";
import { StatRow, type StatItem } from "./stat";
import { DifficultyTag, Tag } from "./tag";

/**
 * A quest, rendered as an issued document.
 *
 * Every quest in the product goes through this component — the hero sample,
 * the demo generator, the quest sheet, the weekly, the mail preview — so the
 * rules from the landing page hold everywhere without being re-decided:
 * a quest number, dashed rules top and bottom, a difficulty tag, the seal
 * watermarked into the corner, and an expiry in the footer.
 */
export type QuestCardProps = {
  /** Left of the header. "Quest № 0417 · Issued 06:00". */
  documentId: React.ReactNode;
  /** Right of the header. Pass `difficulty` instead for the usual case. */
  headerAside?: React.ReactNode;
  difficulty?: string;
  /** "Malá Fatra · Slovakia" */
  region?: React.ReactNode;
  title: React.ReactNode;
  objective?: React.ReactNode;
  stats?: StatItem[];
  bonus?: React.ReactNode;
  /** Lower word on the seal. Omit to leave the document unstamped. */
  seal?: string | null;
  footLeft?: React.ReactNode;
  footRight?: React.ReactNode;
  /** Party block, actions, proof state — anything below the bonus. */
  children?: React.ReactNode;
  /**
   * The quest's own engraved landscape, behind the type. Optional because a
   * card is also used for samples and locked states that are not a quest
   * anybody holds, and those should not wear somebody's mark.
   */
  art?: React.ReactNode;
  className?: string;
  /** Set while a value is being rolled, to soften the type mid-animation. */
  rolling?: boolean;
};

export function QuestCard({
  documentId,
  headerAside,
  difficulty,
  region,
  title,
  objective,
  stats,
  bonus,
  seal = "ISSUED",
  footLeft,
  footRight,
  children,
  art,
  className,
  rolling,
}: QuestCardProps) {
  const aside =
    headerAside ?? (difficulty ? <DifficultyTag difficulty={difficulty} /> : null);

  return (
    <article className={cn("quest-card", art && "has-art", rolling && "rolling", className)}>
      {art}
      <div className="qc-head">
        <span className="qc-id">{documentId}</span>
        {aside}
      </div>

      <div className="qc-body">
        {region && (
          <span className="qc-loc">
            <IconPin />
            {region}
          </span>
        )}

        <h3 className="qc-title">{title}</h3>
        {objective && <p className="qc-obj">{objective}</p>}
        {stats && stats.length > 0 && <StatRow items={stats} />}
        {bonus && <QuestBonus>{bonus}</QuestBonus>}
        {children}
      </div>

      {seal && <Seal label={seal} />}

      {(footLeft || footRight) && (
        <div className="qc-foot">
          <span>{footLeft}</span>
          <span>{footRight}</span>
        </div>
      )}
    </article>
  );
}

/** The bonus challenge. Stamp ink, dashed border, wry rather than motivational. */
export function QuestBonus({
  label = "Bonus challenge",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="qc-bonus">
      <IconBonus />
      <p>
        <b>{label}</b>
        {children}
      </p>
    </div>
  );
}

/**
 * The safety notice every quest sheet carries. Copy fixed here rather than
 * passed in — it is a promise the landing page makes, not a per-quest string.
 */
export function QuestSafetyNotice({ className }: { className?: string }) {
  return (
    <p className={cn("note", className)}>
      Routes are publicly documented and marked. A map, a weather check and your own
      judgement are still yours to bring.
    </p>
  );
}

/** The party block — who else is on this quest. */
export function QuestParty({
  title,
  children,
  footnote,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="qc-party">
      <b>{title}</b>
      {children}
      {footnote && <p className="note mt-2">{footnote}</p>}
    </div>
  );
}

/** A locked document — the demo wall, and the free-tier quest wall. */
export function QuestLocked({
  documentId = "Samples finished",
  title,
  children,
  action,
  footnote,
}: {
  documentId?: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="quest-card">
      <div className="qc-head">
        <span className="qc-id">{documentId}</span>
        <Tag tone="ghost">Demo</Tag>
      </div>
      <div className="lock">
        <LockIcon />
        <h3>{title}</h3>
        <p>{children}</p>
        {action && <div className="capture justify-center">{action}</div>}
        {footnote && <p className="note">{footnote}</p>}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="lock-ico" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="9" y="19" width="26" height="19" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M15 19v-5a7 7 0 0114 0v5" stroke="currentColor" strokeWidth="2" />
      <circle cx="22" cy="28" r="2.4" fill="currentColor" />
    </svg>
  );
}
