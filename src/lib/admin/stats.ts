import "server-only";

import { PLANS, planIdFromRecord, type PlanId } from "@/lib/config";
import { db } from "@/lib/db";

/**
 * Everything the panel counts.
 *
 * One module, because the figures have to agree with each other: "subscribers"
 * on the overview and "active" on the billing page are the same question, and
 * two pages computing it two ways is how a dashboard starts lying. The
 * definitions live here once and every page reads them.
 *
 * Buckets are built in TypeScript from ordinary Prisma queries rather than in
 * SQL. It costs a little more memory and it means the panel works on any
 * Postgres without a view to maintain — and at the volumes this counts, the
 * query planner was never the problem.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Statuses that mean "this person is paying, or is about to". */
export const LIVE_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE"] as const;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** An empty bucket per day, oldest first, so quiet days stay on the axis. */
function emptyDays(days: number) {
  const series: { key: string; label: string; value: number; part: number }[] = [];
  const index = new Map<string, (typeof series)[number]>();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(start.getTime() - offset * DAY_MS);
    const point = { key: dayKey(date), label: dayLabel(date), value: 0, part: 0 };
    series.push(point);
    index.set(point.key, point);
  }

  return { series, index, from: new Date(start.getTime() - (days - 1) * DAY_MS) };
}

/* ------------------------------------------------------------------------- */
/* Overview                                                                   */
/* ------------------------------------------------------------------------- */

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;

export async function getAdminOverview() {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY_MS);
  const fortnightAgo = new Date(now - 14 * DAY_MS);

  const [
    users,
    admins,
    subscribers,
    issued,
    logged,
    liveSessions,
    newThisWeek,
    newLastWeek,
    issuedThisWeek,
    issuedLastWeek,
    quests,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.subscription.count({ where: { status: { in: [...LIVE_STATUSES] } } }),
    db.questHistory.count(),
    db.questHistory.count({ where: { completed: true } }),
    db.session.count({ where: { expiresAt: { gt: new Date() } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: fortnightAgo, lt: weekAgo } } }),
    db.questHistory.count({ where: { generatedAt: { gte: weekAgo } } }),
    db.questHistory.count({ where: { generatedAt: { gte: fortnightAgo, lt: weekAgo } } }),
    // Counts the whole catalogue. `isShowcase` used to separate seeded demo
    // quests from real ones, but every quest is admin-authored now and is
    // flagged showcase so it can be read without being owned — filtering it
    // out here left these figures permanently at zero.
    db.quest.count(),
  ]);

  return {
    users,
    admins,
    customers: users - admins,
    subscribers,
    issued,
    logged,
    quests,
    liveSessions,
    newThisWeek,
    newLastWeek,
    issuedThisWeek,
    issuedLastWeek,
    /** Share of issued quests that were actually walked and logged. */
    completionRate: issued > 0 ? logged / issued : 0,
    /** Share of non-admin accounts that pay. */
    conversionRate: users - admins > 0 ? subscribers / (users - admins) : 0,
  };
}

/* ------------------------------------------------------------------------- */
/* Series                                                                     */
/* ------------------------------------------------------------------------- */

/** Accounts created per day. */
export async function getSignupSeries(days = 30) {
  const { series, index, from } = emptyDays(days);

  const rows = await db.user.findMany({
    where: { createdAt: { gte: from }, role: "USER" },
    select: { createdAt: true, subscription: { select: { status: true } } },
  });

  for (const row of rows) {
    const point = index.get(dayKey(row.createdAt));
    if (!point) continue;
    point.value += 1;
    // The nested band: of the accounts opened that day, how many now pay.
    if (row.subscription && LIVE_STATUSES.includes(row.subscription.status as "ACTIVE")) {
      point.part += 1;
    }
  }

  return series;
}

/** Quests issued per day, and how many of them have been logged. */
export async function getQuestSeries(days = 30) {
  const { series, index, from } = emptyDays(days);

  const rows = await db.questHistory.findMany({
    where: { generatedAt: { gte: from } },
    select: { generatedAt: true, completed: true },
  });

  for (const row of rows) {
    const point = index.get(dayKey(row.generatedAt));
    if (!point) continue;
    point.value += 1;
    if (row.completed) point.part += 1;
  }

  return series;
}

/* ------------------------------------------------------------------------- */
/* Breakdowns                                                                 */
/* ------------------------------------------------------------------------- */

/** Every customer account by the plan it currently holds. */
export async function getPlanSplit() {
  const [customers, live] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.subscription.groupBy({
      by: ["plan"],
      where: { status: { in: [...LIVE_STATUSES] } },
      _count: { _all: true },
    }),
  ]);

  const paid = new Map<PlanId, number>();
  for (const row of live) {
    const id = planIdFromRecord(row.plan);
    if (id === "free") continue;
    paid.set(id, (paid.get(id) ?? 0) + row._count._all);
  }

  const paidTotal = [...paid.values()].reduce((sum, value) => sum + value, 0);

  return PLANS.map((plan) => ({
    key: plan.id,
    label: plan.name,
    value: plan.id === "free" ? Math.max(0, customers - paidTotal) : (paid.get(plan.id) ?? 0),
  }));
}

/** Subscription rows by Stripe status — the billing health check. */
export async function getStatusSplit() {
  const rows = await db.subscription.groupBy({ by: ["status"], _count: { _all: true } });
  const count = (status: string) =>
    rows.find((row) => row.status === status)?._count._all ?? 0;

  return [
    { key: "active", label: "Active", value: count("ACTIVE") },
    { key: "trialing", label: "Trialing", value: count("TRIALING") },
    { key: "past_due", label: "Past due", value: count("PAST_DUE") },
    {
      key: "ended",
      label: "Ended",
      value:
        count("CANCELED") +
        count("UNPAID") +
        count("PAUSED") +
        count("INCOMPLETE") +
        count("INCOMPLETE_EXPIRED"),
    },
  ];
}

const DIFFICULTY_ORDER = ["EASY", "MODERATE", "HARD", "EXPERT"] as const;
const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  HARD: "Hard",
  EXPERT: "Expert",
};

/** What the generator has actually been handing out. */
export async function getDifficultySplit() {
  const rows = await db.quest.groupBy({
    by: ["difficulty"],
    _count: { _all: true },
  });

  return DIFFICULTY_ORDER.map((level) => ({
    key: level,
    label: DIFFICULTY_LABEL[level] ?? level,
    value: rows.find((row) => row.difficulty === level)?._count._all ?? 0,
  }));
}

/** Where quests are being set, most-used first. */
export async function getTopRegions(limit = 6) {
  const rows = await db.quest.groupBy({
    by: ["region"],
    _count: { _all: true },
    orderBy: { _count: { region: "desc" } },
    take: limit,
  });

  return rows.map((row) => ({
    key: row.region,
    label: row.region,
    value: row._count._all,
  }));
}

/** Trailheads, most-used first. Reads as the catalogue's hot spots. */
export async function getTopLocations(limit = 8) {
  const rows = await db.quest.groupBy({
    by: ["location"],
    _count: { _all: true },
    orderBy: { _count: { location: "desc" } },
    take: limit,
  });

  return rows.map((row) => ({
    key: row.location,
    label: row.location,
    value: row._count._all,
  }));
}

/* ------------------------------------------------------------------------- */
/* Revenue                                                                    */
/* ------------------------------------------------------------------------- */

export type RevenueSummary = Awaited<ReturnType<typeof getRevenueSummary>>;

/**
 * Recurring revenue, at list price.
 *
 * Deliberately an estimate, and labelled as one wherever it is shown: we store
 * the plan but not the billing interval, and Stripe is the authority on what
 * anyone was actually charged after discounts, proration and tax. This is the
 * shape of the book, not the books.
 */
export async function getRevenueSummary() {
  const rows = await db.subscription.findMany({
    where: { status: { in: [...LIVE_STATUSES] } },
    select: { plan: true, status: true, cancelAtPeriodEnd: true, currentPeriodEnd: true },
  });

  let monthlyCents = 0;
  let leaving = 0;

  for (const row of rows) {
    const id = planIdFromRecord(row.plan);
    const plan = PLANS.find((candidate) => candidate.id === id);
    if (plan) monthlyCents += plan.price.monthly;
    if (row.cancelAtPeriodEnd) leaving += 1;
  }

  const renewingSoon = rows.filter(
    (row) =>
      row.currentPeriodEnd &&
      row.currentPeriodEnd.getTime() < Date.now() + 7 * DAY_MS &&
      row.currentPeriodEnd.getTime() > Date.now(),
  ).length;

  return {
    live: rows.length,
    monthlyCents,
    yearlyCents: monthlyCents * 12,
    leaving,
    renewingSoon,
    pastDue: rows.filter((row) => row.status === "PAST_DUE").length,
  };
}

/* ------------------------------------------------------------------------- */
/* Database                                                                   */
/* ------------------------------------------------------------------------- */

export type TableSummary = { name: string; model: string; rows: number; description: string };

/**
 * Row counts, table by table.
 *
 * The panel's database page is read-only by construction: it counts and it
 * reads recent rows through Prisma's typed client. There is no raw SQL box and
 * no way to reach a table that isn't listed here, because an admin panel that
 * can run arbitrary statements is a breach waiting for one stolen session.
 */
export async function getTableSummaries(): Promise<TableSummary[]> {
  const [
    users,
    sessions,
    subscriptions,
    preferences,
    quests,
    generations,
    history,
    saved,
    rateLimits,
  ] = await Promise.all([
    db.user.count(),
    db.session.count(),
    db.subscription.count(),
    db.userPreferences.count(),
    db.quest.count(),
    db.questGeneration.count(),
    db.questHistory.count(),
    db.savedQuest.count(),
    db.rateLimit.count(),
  ]);

  return [
    { name: "users", model: "User", rows: users, description: "Accounts, roles, free allowance" },
    { name: "sessions", model: "Session", rows: sessions, description: "Server-side session records" },
    {
      name: "subscriptions",
      model: "Subscription",
      rows: subscriptions,
      description: "Stripe state, one row per account",
    },
    {
      name: "user_preferences",
      model: "UserPreferences",
      rows: preferences,
      description: "What the generator reads",
    },
    { name: "quests", model: "Quest", rows: quests, description: "Every quest ever generated" },
    {
      name: "quest_generations",
      model: "QuestGeneration",
      rows: generations,
      description: "Audit log of generation parameters",
    },
    {
      name: "quest_history",
      model: "QuestHistory",
      rows: history,
      description: "Issued and logged, per account",
    },
    { name: "saved_quests", model: "SavedQuest", rows: saved, description: "Bookmarks" },
    {
      name: "rate_limits",
      model: "RateLimit",
      rows: rateLimits,
      description: "Fixed-window counters",
    },
  ];
}

export type TableName =
  | "users"
  | "sessions"
  | "subscriptions"
  | "quests"
  | "quest_generations"
  | "quest_history"
  | "saved_quests"
  | "rate_limits";

export const BROWSABLE_TABLES: TableName[] = [
  "users",
  "sessions",
  "subscriptions",
  "quests",
  "quest_generations",
  "quest_history",
  "saved_quests",
  "rate_limits",
];

export function isBrowsableTable(value: string | undefined): value is TableName {
  return BROWSABLE_TABLES.includes(value as TableName);
}

export type TableRows = { columns: string[]; rows: (string | number)[][] };

const NONE = "—";

function short(value: string | null | undefined, length = 12): string {
  if (!value) return NONE;
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function stamp(date: Date | null | undefined): string {
  if (!date) return NONE;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The most recent rows of one table.
 *
 * Every column is chosen by hand. Password hashes, Stripe secrets and the raw
 * generation JSON are not projected — an admin needs to see that a row exists
 * and roughly what is in it, and nothing here needs the hash to do that.
 */
export async function getTableRows(table: TableName, take = 25): Promise<TableRows> {
  switch (table) {
    case "users": {
      const rows = await db.user.findMany({
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          freeQuestsUsed: true,
          createdAt: true,
        },
      });
      return {
        columns: ["id", "email", "name", "role", "free used", "created"],
        rows: rows.map((row) => [
          short(row.id),
          row.email,
          row.name,
          row.role,
          row.freeQuestsUsed,
          stamp(row.createdAt),
        ]),
      };
    }

    case "sessions": {
      const rows = await db.session.findMany({
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          user: { select: { email: true } },
        },
      });
      return {
        columns: ["id", "account", "created", "expires", "state"],
        rows: rows.map((row) => [
          short(row.id),
          row.user.email,
          stamp(row.createdAt),
          stamp(row.expiresAt),
          row.expiresAt.getTime() > Date.now() ? "live" : "expired",
        ]),
      };
    }

    case "subscriptions": {
      const rows = await db.subscription.findMany({
        orderBy: { updatedAt: "desc" },
        take,
        select: {
          id: true,
          plan: true,
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
          stripeCustomerId: true,
          user: { select: { email: true } },
        },
      });
      return {
        columns: ["account", "plan", "status", "cancels", "period end", "stripe customer"],
        rows: rows.map((row) => [
          row.user.email,
          row.plan,
          row.status,
          row.cancelAtPeriodEnd ? "yes" : "no",
          stamp(row.currentPeriodEnd),
          short(row.stripeCustomerId, 18),
        ]),
      };
    }

    case "quests": {
      const rows = await db.quest.findMany({
        orderBy: { createdAt: "desc" },
        take,
        select: {
          number: true,
          title: true,
          location: true,
          region: true,
          difficulty: true,
          distance: true,
          elevationGain: true,
          isShowcase: true,
          createdAt: true,
        },
      });
      return {
        columns: ["№", "title", "location", "region", "grade", "km", "m ↑", "kind", "created"],
        rows: rows.map((row) => [
          row.number ?? NONE,
          row.title,
          row.location,
          row.region,
          row.difficulty,
          row.distance.toFixed(1),
          Math.round(row.elevationGain),
          row.isShowcase ? "showcase" : "issued",
          stamp(row.createdAt),
        ]),
      };
    }

    case "quest_generations": {
      const rows = await db.questGeneration.findMany({
        orderBy: { generatedAt: "desc" },
        take,
        select: {
          generationNumber: true,
          generatedAt: true,
          user: { select: { email: true } },
          quest: { select: { title: true, location: true } },
        },
      });
      return {
        columns: ["#", "account", "quest", "location", "generated"],
        rows: rows.map((row) => [
          row.generationNumber,
          row.user.email,
          row.quest.title,
          row.quest.location,
          stamp(row.generatedAt),
        ]),
      };
    }

    case "quest_history": {
      const rows = await db.questHistory.findMany({
        orderBy: { generatedAt: "desc" },
        take,
        select: {
          completed: true,
          completedAt: true,
          generatedAt: true,
          user: { select: { email: true } },
          quest: { select: { title: true, region: true } },
        },
      });
      return {
        columns: ["account", "quest", "region", "state", "issued", "logged"],
        rows: rows.map((row) => [
          row.user.email,
          row.quest.title,
          row.quest.region,
          row.completed ? "logged" : "open",
          stamp(row.generatedAt),
          stamp(row.completedAt),
        ]),
      };
    }

    case "saved_quests": {
      const rows = await db.savedQuest.findMany({
        orderBy: { savedAt: "desc" },
        take,
        select: {
          savedAt: true,
          user: { select: { email: true } },
          quest: { select: { title: true } },
        },
      });
      return {
        columns: ["account", "quest", "saved"],
        rows: rows.map((row) => [row.user.email, row.quest.title, stamp(row.savedAt)]),
      };
    }

    case "rate_limits": {
      const rows = await db.rateLimit.findMany({
        orderBy: { windowStart: "desc" },
        take,
        select: { key: true, count: true, windowStart: true },
      });
      return {
        columns: ["key", "count", "window start"],
        rows: rows.map((row) => [row.key, row.count, stamp(row.windowStart)]),
      };
    }
  }
}
