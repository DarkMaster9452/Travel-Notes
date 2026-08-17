import Link from "next/link";

import { QuestCard, Tag, formatMetres } from "@/components/field";
import type { QuestSummary } from "@/types/quest";
import { formatDuration } from "@/lib/utils";

/**
 * A quest, rendered as the issued document it is.
 *
 * Everything in the app that shows a quest comes through here, so a quest on
 * Today, in history and on its own page are the same object rather than three
 * near-misses. The mapping from the database projection to the document — what
 * counts as the number, what goes in the footer — is decided once, here.
 */

const DIFFICULTY_LABEL: Record<QuestSummary["difficulty"], string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  HARD: "Hard",
  EXPERT: "Brutal",
};

/** "Quest № 0417" — four digits, like the landing page. */
export function questDocumentId(number: number | null): string {
  if (number == null) return "Quest — unnumbered";
  return `Quest № ${String(number).padStart(4, "0")}`;
}

export function questStats(quest: QuestSummary) {
  return [
    { value: quest.distance.toFixed(1), label: "Kilometres" },
    { value: formatMetres(quest.elevationGain), label: "Metres up" },
    { value: formatDuration(quest.duration), label: "Est. moving" },
  ];
}

export function QuestSheet({
  quest,
  issuedAt,
  seal,
  href,
  children,
}: {
  quest: QuestSummary;
  /** Overrides the header's right-hand side of the document id. */
  issuedAt?: string;
  seal?: string | null;
  /** When set, the title links through to the full sheet. */
  href?: string;
  children?: React.ReactNode;
}) {
  const title = href ? <Link href={href}>{quest.title}</Link> : quest.title;

  return (
    <QuestCard
      documentId={
        issuedAt ? `${questDocumentId(quest.number)} · ${issuedAt}` : questDocumentId(quest.number)
      }
      headerAside={
        <span className="flex items-center gap-2">
          {quest.completed && <Tag tone="ghost">Logged</Tag>}
          <Tag tone={quest.difficulty === "HARD" || quest.difficulty === "EXPERT" ? "warm" : "pine"}>
            {DIFFICULTY_LABEL[quest.difficulty]}
          </Tag>
        </span>
      }
      region={`${quest.location} · ${quest.region}`}
      title={title}
      objective={quest.objective}
      stats={questStats(quest)}
      seal={seal === undefined ? (quest.completed ? "LOGGED" : "ISSUED") : seal}
      footLeft={quest.subtitle}
      footRight={quest.travelTime ? `${Math.round(quest.travelTime)} min from you` : undefined}
    >
      {children}
    </QuestCard>
  );
}
