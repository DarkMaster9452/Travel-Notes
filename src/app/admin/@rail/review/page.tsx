import Link from "next/link";

import { RailCard, RailFigure, RailLine } from "@/components/sq/rail";
import { getReviewQueue } from "@/lib/admin/review-queue";
import { getQueueVitals } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/**
 * The column beside the review deck.
 *
 * The deck deliberately shows one card and nothing else — a reader deciding
 * whether somebody went should be looking at their proof, not at a list. But
 * one card in the middle of a wide screen leaves the rest of the window empty,
 * and the things a reader wants *between* cards are all facts about the queue
 * rather than about the card in hand: how deep it is, how long the oldest has
 * waited, and what is behind the one being read.
 *
 * Read once, when the page loads. It does not follow the deck as cards are
 * thrown, because a list that reshuffled under a decision would be a reason to
 * look away from the card.
 */
export default async function ReviewRail() {
  await requireAdmin();

  // One instant for the whole column: asking the clock per row would let two
  // rows disagree about what day it is.
  const now = new Date();

  const [vitals, queue] = await Promise.all([getQueueVitals(), getReviewQueue(6)]);

  const behind = queue.cards.slice(1, 5);

  return (
    <>
      <RailCard
        title="The desk"
        tone="dark"
        index={0}
        foot={
          <>
            <span>Filed this week</span>
            <span>{vitals.filedThisWeek}</span>
          </>
        }
      >
        <RailFigure
          value={vitals.pending}
          note={
            vitals.pending === 0 ? (
              <>Nothing is waiting. The deck is clear.</>
            ) : (
              <>
                waiting on a verdict
                {vitals.oldestWaitDays === null
                  ? "."
                  : vitals.oldestWaitDays === 0
                    ? ", the oldest filed today."
                    : ` the oldest of them ${vitals.oldestWaitDays} ${
                        vitals.oldestWaitDays === 1 ? "day" : "days"
                      } ago.`}
              </>
            )
          }
        />
      </RailCard>

      <RailCard title="How the desk is running" meta="Last 7 days" index={1}>
        <RailLine label="Decided" value={vitals.decidedThisWeek} />
        <RailLine label="Filed" value={vitals.filedThisWeek} />
        <RailLine
          label="Typical wait"
          value={
            vitals.medianWaitHours === null
              ? "—"
              : vitals.medianWaitHours < 24
                ? `${vitals.medianWaitHours}h`
                : `${Math.round(vitals.medianWaitHours / 24)}d`
          }
        />
        <RailLine
          label="Weekly / monthly"
          value={`${queue.cadenced} of ${queue.total}`}
        />
      </RailCard>

      {behind.length > 0 ? (
        <RailCard
          title="Behind this one"
          meta={`${queue.total - 1} more`}
          index={2}
          foot={
            <>
              <span>All submissions</span>
              <Link href="/admin/submissions" style={{ color: "inherit" }}>
                Open →
              </Link>
            </>
          }
        >
          {behind.map((card) => (
            <RailLine
              key={card.id}
              label={
                <span style={{ display: "block", minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                    {card.title}
                  </b>
                  <span className="sq-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                    {card.personName} · {card.plan.toLowerCase()}
                  </span>
                </span>
              }
              value={
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {waited(card.filedAt, now)}
                </span>
              }
            />
          ))}
        </RailCard>
      ) : null}
    </>
  );
}

function waited(filedAt: string, now: Date): string {
  const days = Math.floor((now.getTime() - new Date(filedAt).getTime()) / DAY);
  if (days <= 0) return "today";
  return `${days}d`;
}
