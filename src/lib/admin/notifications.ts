import "server-only";

import { db } from "@/lib/db";

import { slotLabel, slotOpensLabel, slotRange, type Slot } from "./schedule";

/**
 * What the panel is asking an admin to deal with.
 *
 * Every notice here is a *live condition*, derived on each request from the
 * same tables the rest of the panel counts — never a stored message. That is
 * the whole design: a notice cannot go stale, cannot be about something that
 * was already fixed, and cannot need a background job to clean up. Book the
 * empty week and the notice is gone on the next page load.
 *
 * Which also decides what does *not* belong here. "A submission was filed" is
 * an event, and events want a feed with a read state and a retention policy.
 * "Twenty-two submissions have been waiting three days" is a condition, and a
 * condition is a thing you can be told once and act on. The panel only carries
 * the second kind.
 */

/* ------------------------------------------------------------------ tone -- */

/**
 * How loud a notice is.
 *
 * Four tones, and deliberately not four hues. The product runs on two colours
 * — green is structure, orange is stamp ink and means *look at this* — and
 * inventing an amber for the middle severity would put a third hue into the
 * system for the sake of one list. So severity is carried by weight as well as
 * colour: `critical` is filled stamp ink, `warning` is the same ink outlined,
 * `info` is green, `clear` is paper. At a glance down a list, filled-vs-outlined
 * separates the top two faster than two adjacent oranges would.
 *
 * Every notice also carries an icon and a spelled-out label, so none of this
 * is encoded by colour alone — the same rule the charts follow.
 */
export type NoticeTone = "critical" | "warning" | "info" | "clear";

export type AdminNotice = {
  /**
   * Stable for as long as the condition is. It encodes the thing the notice is
   * about — the slot key, the threshold band — so that when a queue crosses
   * from ten waiting to thirty, it reads as a *new* notice rather than a
   * silently reworded old one.
   */
  id: string;
  tone: NoticeTone;
  /** One line. What is true. */
  title: string;
  /** One sentence. What to do about it, and by when. */
  detail: string;
  /** Where it gets fixed. */
  href: string;
  /** The link's label — a verb, always. */
  action: string;
  /** A figure worth reading before the sentence. Rendered as a chip. */
  count?: number;
};

/* ------------------------------------------------------------ thresholds -- */

/**
 * The numbers this module judges by, in one place because they are policy
 * rather than logic — the point at which a backlog stops being a queue and
 * starts being a problem is a decision about how the product is run, and it
 * should be changed here rather than found inline.
 */
const THRESHOLDS = {
  /** Submissions waiting before the queue is worth mentioning / urgent. */
  queueWarning: 10,
  queueCritical: 25,
  /** Days the oldest pending submission may wait before that alone is urgent. */
  waitWarningDays: 2,
  waitCriticalDays: 4,
  /** Weeks and months ahead the schedule is checked for holes. */
  weeklyHorizon: 4,
  monthlyHorizon: 3,
  /** Days before a slot opens at which an empty one stops being "soon". */
  weeklyUrgentDays: 7,
  monthlyUrgentDays: 14,
  /** Published quests below which the pool is too thin to draw from. */
  poolThin: 12,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / DAY_MS);
}

function daysSince(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

/** "in 3 days" / "tomorrow" / "today". Slot openings are always near. */
function whenLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/* --------------------------------------------------------------- notices -- */

/**
 * Everything that currently wants an admin's attention, most urgent first.
 *
 * One round of queries for the whole set. This runs in the admin layout, on
 * every page of the panel, so it is deliberately a handful of counts and two
 * small `findMany`s over indexed columns rather than anything that grows with
 * the size of the tables.
 */
export async function getAdminNotices(now = new Date()): Promise<AdminNotice[]> {
  const weeklySlots = slotRange("WEEKLY", now, { back: 0, forward: THRESHOLDS.weeklyHorizon });
  const monthlySlots = slotRange("MONTHLY", now, { back: 0, forward: THRESHOLDS.monthlyHorizon });

  const [booked, pending, oldestPending, published, drafts, pastDue] = await Promise.all([
    db.questSchedule.findMany({
      where: {
        OR: [
          { period: "WEEKLY", slotKey: { in: weeklySlots.map((slot) => slot.key) } },
          { period: "MONTHLY", slotKey: { in: monthlySlots.map((slot) => slot.key) } },
        ],
      },
      select: { period: true, slotKey: true },
    }),
    db.submission.count({ where: { status: "PENDING" } }),
    db.submission.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    db.quest.count({ where: { published: true } }),
    db.quest.count({ where: { published: false } }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
  ]);

  const bookedKeys = new Set(booked.map((row) => `${row.period}:${row.slotKey}`));

  const notices = [
    ...scheduleNotices("MONTHLY", monthlySlots, bookedKeys, now),
    ...scheduleNotices("WEEKLY", weeklySlots, bookedKeys, now),
    ...queueNotices(pending, oldestPending?.createdAt ?? null, now),
    ...catalogueNotices(published, drafts),
    ...billingNotices(pastDue),
  ];

  // Most urgent first, and stable within a tone: the order notices are built in
  // is itself meaningful — what is live before what is merely upcoming, the
  // headline monthly before the weekly alongside it.
  const rank: Record<NoticeTone, number> = { critical: 0, warning: 1, info: 2, clear: 3 };
  return notices.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

/* ------------------------------------------------------------- schedule -- */

/**
 * Holes in the calendar.
 *
 * Two notices at most per cadence — the slot that is live now, and the next
 * empty one — rather than one per empty week. A panel that lists four
 * identical "week 37 is empty" rows is a panel an admin learns to scroll past,
 * and the count of the rest belongs in the sentence instead.
 */
function scheduleNotices(
  period: "WEEKLY" | "MONTHLY",
  slots: Slot[],
  booked: Set<string>,
  now: Date,
): AdminNotice[] {
  const [live, ...upcoming] = slots;
  const isEmpty = (slot: Slot) => !booked.has(`${period}:${slot.key}`);
  const noun = period === "WEEKLY" ? "week" : "month";
  const cadence = period === "WEEKLY" ? "weekly" : "monthly";
  const href = `/admin/schedule?period=${period}`;
  const notices: AdminNotice[] = [];

  // Nothing is running right now. The strongest thing this panel can say:
  // every reader who opens the app this week has an empty shelf where the
  // headline quest should be.
  if (live && isEmpty(live)) {
    notices.push({
      id: `schedule:${period}:live:${live.key}`,
      tone: "critical",
      title: `No ${cadence} quest is live`,
      detail: `${slotLabel(live)} opened on ${slotOpensLabel(live)} with nothing booked into it. Everyone who looks at their ${noun} sees an empty slot until one is.`,
      href,
      action: `Book ${slotLabel(live)}`,
    });
  }

  const empties = upcoming.filter(isEmpty);
  const next = empties[0];

  if (next) {
    const days = daysUntil(next.openAt, now);
    const urgentWithin =
      period === "WEEKLY" ? THRESHOLDS.weeklyUrgentDays : THRESHOLDS.monthlyUrgentDays;
    const rest = empties.length - 1;

    notices.push({
      id: `schedule:${period}:next:${next.key}`,
      tone: days <= urgentWithin ? "critical" : "warning",
      title: `${slotLabel(next)} has no ${cadence} quest`,
      detail:
        `It opens ${whenLabel(days)}, ${slotOpensLabel(next)}.` +
        (rest > 0
          ? ` ${rest} further ${rest === 1 ? `${noun} is` : `${noun}s are`} also empty in the next ${slots.length - 1}.`
          : ""),
      href,
      action: "Open the calendar",
      count: empties.length > 1 ? empties.length : undefined,
    });
  }

  return notices;
}

/* ---------------------------------------------------------------- queue -- */

/**
 * The review queue, judged on two axes.
 *
 * Size and age are different failures and the second is the one that matters:
 * fifty submissions filed this morning is a busy day, while three that have sat
 * for a week is somebody who logged a real climb and heard nothing back. So the
 * oldest one can raise the tone on its own, whatever the count.
 */
function queueNotices(pending: number, oldest: Date | null, now: Date): AdminNotice[] {
  if (pending === 0) return [];

  const waited = oldest ? daysSince(oldest, now) : 0;
  const big = pending >= THRESHOLDS.queueCritical;
  const stale = waited >= THRESHOLDS.waitCriticalDays;

  if (!big && !stale && pending < THRESHOLDS.queueWarning && waited < THRESHOLDS.waitWarningDays) {
    return [];
  }

  const band = big || stale ? "critical" : "warning";

  return [
    {
      id: `queue:${band}:${big ? "size" : stale ? "age" : "soft"}`,
      tone: band,
      title:
        pending === 1 ? "A submission is waiting" : `${pending} submissions are waiting`,
      detail:
        waited >= 1
          ? `The oldest has been in the queue ${waited} ${waited === 1 ? "day" : "days"}. Somebody went out, filed their proof, and is still waiting to hear.`
          : "Filed today, none of them decided yet.",
      href: "/admin/review",
      action: "Review the queue",
      count: pending,
    },
  ];
}

/* ------------------------------------------------------------ catalogue -- */

/** What there is to schedule and issue from. */
function catalogueNotices(published: number, drafts: number): AdminNotice[] {
  const notices: AdminNotice[] = [];

  if (published < THRESHOLDS.poolThin) {
    notices.push({
      id: `catalogue:thin:${published}`,
      tone: published === 0 ? "critical" : "warning",
      title:
        published === 0
          ? "Nothing is published"
          : `Only ${published} published quests to draw from`,
      detail:
        published === 0
          ? "No quest can be issued or scheduled until at least one is published."
          : `The generator picks from these and never repeats one for an account, so a thin catalogue runs people out of quests before it runs out of quests.`,
      href: "/admin/quests",
      action: "Write a quest",
      count: published,
    });
  }

  if (drafts > 0) {
    notices.push({
      id: `catalogue:drafts:${drafts}`,
      tone: "info",
      title: drafts === 1 ? "A quest is unpublished" : `${drafts} quests are unpublished`,
      detail: "Written but not published, so nothing can be issued or scheduled from them yet.",
      href: "/admin/quests",
      action: "Open the catalogue",
      count: drafts,
    });
  }

  return notices;
}

/* -------------------------------------------------------------- billing -- */

/** Money that was meant to arrive and didn't. */
function billingNotices(pastDue: number): AdminNotice[] {
  if (pastDue === 0) return [];

  return [
    {
      id: `billing:past-due:${pastDue}`,
      tone: "warning",
      title: pastDue === 1 ? "A subscription is past due" : `${pastDue} subscriptions are past due`,
      detail:
        "Paddle could not take the payment. The account keeps its plan while it retries, and loses it if the retries run out.",
      href: "/admin/revenue",
      action: "See billing",
      count: pastDue,
    },
  ];
}
