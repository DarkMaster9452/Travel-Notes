import "server-only";

import type { Plan, SchedulePeriod } from "@prisma/client";

import { slotKeyLabel } from "@/lib/admin/schedule";
import { db } from "@/lib/db";

/**
 * The review queue, and the order it is dealt in.
 *
 * The order is fixed rather than chosen, which is the point: a reader who can
 * pick the next card decides who waits, and "who waits" is a promise the
 * product makes rather than a preference the desk holds.
 *
 * Weekly and monthly proof leads, because it is proof of a quest with a
 * closing window and a leaderboard that cannot settle until it is read — the
 * monthly ahead of the weekly for the same reason it leads the dashboard.
 * Then Ultra, Explorer, free. Oldest first inside a tier.
 *
 * Lifted out of the page so the deck, the overview's desk figures and the
 * badge in the rail all count the same queue.
 */

/** How far the claimed figures may drift from the asked before a cell flags. */
export const FLAG_RATIO = 0.3;

/** How far the card has to travel before a drag counts as a verdict. */
export const COMMIT_PX = 110;

const PLAN_RANK: Record<string, number> = { ULTRA: 0, EXPLORER: 1, FREE: 2 };
const CADENCE_RANK: Record<string, number> = { MONTHLY: 0, WEEKLY: 1 };
const UNCADENCED = 2;
const LIVE_STATUSES = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);

export type QueuePlan = "ULTRA" | "EXPLORER" | "FREE";

export type ProofCell = {
  /** The figure the member claimed, already formatted. "—" when missing. */
  value: string;
  /** "km · asked 18" — what the quest asked for, alongside the unit. */
  label: string;
  /** More than FLAG_RATIO away from what was asked. */
  off: boolean;
  /** Nothing was recorded at all. */
  missing: boolean;
};

export type ReviewCardData = {
  id: string;
  questNo: string;
  personName: string;
  personInitials: string;
  plan: QueuePlan;
  cadence: string | null;
  retreated: boolean;
  grade: string;
  hard: boolean;
  title: string;
  where: string;
  note: string;
  photos: string[];
  photoLabel: string | null;
  stravaUrl: string | null;
  cells: ProofCell[];
  flags: string[];
  filedAt: string;
};

function planOf(subscription: { plan: Plan; status: string } | null): QueuePlan {
  if (
    subscription &&
    LIVE_STATUSES.has(subscription.status) &&
    (subscription.plan === "ULTRA" || subscription.plan === "EXPLORER")
  ) {
    return subscription.plan;
  }
  return "FREE";
}

const NUMBER = new Intl.NumberFormat("en-GB");

function minutes(value: number): string {
  const hours = Math.floor(value / 60);
  const rest = Math.round(value % 60);
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest}m`;
}

/** A cell is flagged when the claim differs from the ask by more than 30%. */
function cell(
  claimed: number | null,
  asked: number,
  unit: string,
  format: (value: number) => string,
): ProofCell {
  if (claimed === null || claimed === undefined) {
    return { value: "—", label: `${unit} · asked ${format(asked)}`, off: false, missing: true };
  }
  const drift = asked === 0 ? 0 : Math.abs(claimed - asked) / asked;
  return {
    value: format(claimed),
    label: `${unit} · asked ${format(asked)}`,
    off: drift > FLAG_RATIO,
    missing: false,
  };
}

/**
 * The "worth a second look" lines.
 *
 * Written from what is actually in the row rather than from a reviewer's
 * suspicion: a drifting figure, an account of the day with nothing beside it,
 * a retreat that wants reading as one. They are prompts, never verdicts.
 */
function flagsFor(card: {
  cells: ProofCell[];
  photos: string[];
  stravaUrl: string | null;
  retreated: boolean;
}): string[] {
  const flags: string[] = [];
  const drifting = card.cells.filter((entry) => entry.off);
  for (const entry of drifting) {
    const measure = entry.label.split(" · ")[0];
    flags.push(`${measure === "km" ? "Distance" : measure === "m ↑" ? "Ascent" : "Moving time"} is well off what the quest asked for.`);
  }
  if (card.photos.length === 0 && !card.stravaUrl) {
    flags.push("Written account only — no photos and no Strava.");
  }
  if (card.cells.every((entry) => entry.missing)) {
    flags.push("No recorded figures to compare against the quest.");
  }
  if (card.retreated) {
    flags.push("Filed as an honest retreat — approve it as one if the reason holds.");
  }
  return flags;
}

export type ReviewQueue = {
  cards: ReviewCardData[];
  /** How many of the pending ones are filed against a closing window. */
  cadenced: number;
  total: number;
};

export async function getReviewQueue(limit = 100): Promise<ReviewQueue> {
  const pending = await db.submission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      user: {
        select: { name: true, subscription: { select: { plan: true, status: true } } },
      },
      quest: {
        select: {
          title: true,
          location: true,
          region: true,
          difficulty: true,
          number: true,
          distance: true,
          elevationGain: true,
          duration: true,
        },
      },
    },
  });

  const ordered = [...pending].sort((a, b) => {
    const cadence =
      (a.period ? (CADENCE_RANK[a.period] ?? UNCADENCED) : UNCADENCED) -
      (b.period ? (CADENCE_RANK[b.period] ?? UNCADENCED) : UNCADENCED);
    if (cadence !== 0) return cadence;

    const tier = PLAN_RANK[planOf(a.user.subscription)] - PLAN_RANK[planOf(b.user.subscription)];
    if (tier !== 0) return tier;

    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const cards = ordered.map((submission) => {
    const cells: ProofCell[] = [
      cell(submission.distance, submission.quest.distance, "km", (value) => value.toFixed(1)),
      cell(submission.elevation, submission.quest.elevationGain, "m ↑", (value) =>
        NUMBER.format(Math.round(value)),
      ),
      cell(submission.movingTime, submission.quest.duration, "moving", minutes),
      {
        value: String(submission.photos.length),
        label: "photos",
        off: false,
        missing: false,
      },
    ];

    const hard = submission.quest.difficulty === "HARD" || submission.quest.difficulty === "EXPERT";

    return {
      id: submission.id,
      questNo: submission.quest.number
        ? `Quest № ${String(submission.quest.number).padStart(4, "0")}`
        : "Quest",
      personName: submission.user.name,
      personInitials: initials(submission.user.name),
      plan: planOf(submission.user.subscription),
      cadence: submission.period
        ? cadenceLabel(submission.period, submission.slotKey)
        : null,
      retreated: submission.retreated,
      grade: submission.quest.difficulty,
      hard,
      title: submission.quest.title,
      where: `${submission.quest.location} · ${submission.quest.region}`,
      note: submission.note,
      photos: submission.photos,
      photoLabel:
        submission.photos.length > 3 ? `+${submission.photos.length - 2} more` : null,
      stravaUrl: submission.stravaUrl,
      cells,
      flags: flagsFor({
        cells,
        photos: submission.photos,
        stravaUrl: submission.stravaUrl,
        retreated: submission.retreated,
      }),
      filedAt: submission.createdAt.toISOString(),
    } satisfies ReviewCardData;
  });

  return {
    cards,
    cadenced: pending.filter((submission) => submission.period !== null).length,
    total: pending.length,
  };
}

function cadenceLabel(period: SchedulePeriod, slotKey: string | null): string {
  const label = slotKey ? slotKeyLabel(period, slotKey) : "";
  return period === "MONTHLY" ? `Monthly · ${label}` : `Weekly · ${label}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
