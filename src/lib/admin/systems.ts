import "server-only";

import { list } from "@vercel/blob";

import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { isDemoPlans, isPaddleEnabled, paddleEnvironment } from "@/lib/env";
import { getPaddle } from "@/lib/paddle";
import { stravaEnabled } from "@/lib/strava";
import { uploadsEnabled } from "@/lib/uploads";

/**
 * Is the product working, and how do we know.
 *
 * One registry, read by the board, by the detail pages and by the scheduled
 * routes, so "which systems exist" has exactly one answer. Each entry owns its
 * own probe — a small async function that returns a status, a duration and one
 * line of English — and everything else on the board is derived from that.
 *
 * Two rules run through the whole file.
 *
 * **A probe must never be able to break the page it is on.** Every one is
 * wrapped in `safely`, every one has a timeout, and a probe that throws
 * reports `down` with the error's message rather than propagating. A systems
 * board that goes down with the system it is monitoring is not a monitor.
 *
 * **Not configured is not the same as broken.** A deployment with no Paddle
 * key is a normal, working deployment — development, a preview branch — and
 * painting it red would train the desk to ignore red. That state is `off`,
 * drawn in grey, and says what it would take to turn it on.
 */

/* -------------------------------------------------------------------------- */
/* The four words                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `ok` — answered, in time, nothing to say.
 * `degraded` — answered, but something is backing up or slow.
 * `down` — did not answer, or answered with a refusal.
 * `off` — not wired up in this deployment. Grey, not red.
 */
export type SystemStatus = "ok" | "degraded" | "down" | "off";

/** Worst-first, so a group's status is `Math.max` over its members. */
const SEVERITY: Record<SystemStatus, number> = { ok: 0, off: 1, degraded: 2, down: 3 };

export function worstOf(statuses: SystemStatus[]): SystemStatus {
  return statuses.reduce<SystemStatus>(
    (worst, status) => (SEVERITY[status] > SEVERITY[worst] ? status : worst),
    "ok",
  );
}

/** The one place a status becomes a colour. Both pages read this. */
export const STATUS_COLOUR: Record<SystemStatus, string> = {
  ok: "var(--moss)",
  degraded: "var(--gold)",
  down: "var(--signal)",
  off: "var(--ink-3)",
};

export const STATUS_LABEL: Record<SystemStatus, string> = {
  ok: "Up",
  degraded: "Degraded",
  down: "Down",
  off: "Not wired up",
};

/* -------------------------------------------------------------------------- */
/* The registry                                                               */
/* -------------------------------------------------------------------------- */

export type Reading = {
  status: SystemStatus;
  /** Round trip in milliseconds, where there was one to measure. */
  latencyMs: number | null;
  /** One line for a human at the desk. Never a key, never an address. */
  detail: string;
};

export type SystemGroup = "core" | "integration" | "job";

export type SystemDefinition = {
  id: string;
  label: string;
  /** What it is, in one line, for somebody who has not seen the codebase. */
  what: string;
  group: SystemGroup;
  /** What the latency figure means here, or null where nothing is timed. */
  measures: string | null;
  probe: () => Promise<Reading>;
};

export const SYSTEMS: SystemDefinition[] = [
  {
    id: "database",
    label: "Database",
    what: "Postgres, through the pooled connection every request uses.",
    group: "core",
    measures: "Round trip of a trivial query",
    probe: probeDatabase,
  },
  {
    id: "auth",
    label: "Sessions",
    what: "Signing in, and the session rows that keep people signed in.",
    group: "core",
    measures: "Time to read the session table",
    probe: probeAuth,
  },
  {
    id: "review",
    label: "Review desk",
    what: "Proof waiting on a reader. Backs up rather than breaks.",
    group: "core",
    measures: null,
    probe: probeReview,
  },
  {
    id: "billing",
    label: "Billing",
    what: "Paddle: the overlay checkout, the portal, and the webhook that writes plans down.",
    group: "integration",
    measures: "Round trip to the Paddle API",
    probe: probeBilling,
  },
  {
    id: "email",
    label: "Email",
    what: "Resend, for verdicts, drops, sealed boards and invitations.",
    group: "integration",
    measures: "Round trip to the Resend API",
    probe: probeEmail,
  },
  {
    id: "storage",
    label: "Photo storage",
    what: "Vercel Blob, where re-encoded proof photographs are kept.",
    group: "integration",
    measures: "Round trip to the blob store",
    probe: probeStorage,
  },
  {
    id: "strava",
    label: "Strava",
    what: "The optional connection that reads a activity back into proof.",
    group: "integration",
    measures: null,
    probe: probeStrava,
  },
  {
    id: "job.quest-drop",
    label: "Quest drop",
    what: "The scheduled route that issues the featured quest and writes out.",
    group: "job",
    measures: "How long the run took",
    probe: () => probeJob("job.quest-drop", 26),
  },
  {
    id: "job.seal-boards",
    label: "Board sealing",
    what: "Seals closed leaderboards and tells the podium.",
    group: "job",
    measures: "How long the run took",
    probe: () => probeJob("job.seal-boards", 26),
  },
  {
    id: "job.envelopes",
    label: "Envelopes",
    what: "Picks the printed stickers that go in the post, monthly.",
    group: "job",
    measures: "How long the run took",
    probe: () => probeJob("job.envelopes", 24 * 32),
  },
];

export function findSystem(id: string | undefined): SystemDefinition | null {
  return SYSTEMS.find((system) => system.id === id) ?? null;
}

export const GROUP_LABEL: Record<SystemGroup, string> = {
  core: "The product itself",
  integration: "Things we call out to",
  job: "Runs on a clock",
};

/* -------------------------------------------------------------------------- */
/* Running a probe safely                                                     */
/* -------------------------------------------------------------------------- */

/** Slower than this and a probe is reported degraded rather than waited on. */
const SLOW_MS = 1_200;
/** Longer than this and it is reported down. Nothing on this page hangs. */
const TIMEOUT_MS = 4_000;

/**
 * The wrapper every probe goes through.
 *
 * Races the work against a timer and converts any throw into a `down` reading
 * carrying the error's message. `Promise.race` does not cancel the loser, so a
 * genuinely hung socket keeps running in the background — that is fine and
 * deliberate: it is detached from the request, and the alternative is a panel
 * that hangs for as long as the thing it is reporting on.
 */
async function safely(work: () => Promise<Reading>): Promise<Reading> {
  const started = Date.now();
  try {
    return await Promise.race([
      work(),
      new Promise<Reading>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`No answer in ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS),
      ),
    ]);
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - started,
      detail: messageOf(error),
    };
  }
}

/**
 * An error's message, and only its message.
 *
 * Stack traces name file paths and connection strings quote credentials, and
 * this line is rendered on a page and written to a table. One sentence, capped.
 */
function messageOf(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const first = raw.split("\n")[0].trim();
  return first.length > 180 ? `${first.slice(0, 177)}…` : first || "Failed with no message";
}

/** `ok` under the slow line, `degraded` over it. */
function bySpeed(ms: number, detail: string): Reading {
  return {
    status: ms > SLOW_MS ? "degraded" : "ok",
    latencyMs: ms,
    detail: ms > SLOW_MS ? `${detail} — slow, ${ms} ms` : detail,
  };
}

/* -------------------------------------------------------------------------- */
/* The probes                                                                 */
/* -------------------------------------------------------------------------- */

async function probeDatabase(): Promise<Reading> {
  const started = Date.now();
  // `SELECT 1` rather than a count: this is asking whether the connection
  // answers, and a count's duration is a property of the table, not the link.
  await db.$queryRaw`SELECT 1`;
  const ms = Date.now() - started;

  const [users, submissions] = await Promise.all([db.user.count(), db.submission.count()]);
  return bySpeed(ms, `Answering · ${users.toLocaleString("en-GB")} accounts, ${submissions.toLocaleString("en-GB")} submissions`);
}

async function probeAuth(): Promise<Reading> {
  const now = new Date();
  const started = Date.now();
  const [live, stale] = await Promise.all([
    db.session.count({ where: { expiresAt: { gt: now } } }),
    db.session.count({ where: { expiresAt: { lte: now } } }),
  ]);
  const ms = Date.now() - started;

  // Expired rows are harmless — the guard checks the date, it does not trust
  // the row's existence — but a big pile of them means nothing is sweeping,
  // and that is worth saying out loud before the table is mostly rubbish.
  if (stale > 5_000) {
    return {
      status: "degraded",
      latencyMs: ms,
      detail: `${live} live · ${stale.toLocaleString("en-GB")} expired rows never swept`,
    };
  }
  return bySpeed(ms, `${live} signed in · ${stale} expired rows`);
}

async function probeReview(): Promise<Reading> {
  const [pending, oldest] = await Promise.all([
    db.submission.count({ where: { status: "PENDING" } }),
    db.submission.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  if (pending === 0) return { status: "ok", latencyMs: null, detail: "Nothing waiting" };

  const days = Math.floor((Date.now() - oldest!.createdAt.getTime()) / 86_400_000);
  // A queue is not an outage, so it never reads `down`. Four days is where a
  // member starts wondering whether anybody read it.
  if (days >= 4) {
    return {
      status: "degraded",
      latencyMs: null,
      detail: `${pending} waiting · oldest filed ${days} days ago`,
    };
  }
  return {
    status: "ok",
    latencyMs: null,
    detail: `${pending} waiting · oldest ${days === 0 ? "today" : `${days}d`}`,
  };
}

async function probeBilling(): Promise<Reading> {
  if (!isPaddleEnabled()) {
    return {
      status: "off",
      latencyMs: null,
      detail: isDemoPlans()
        ? "Paddle not wired up — plans are handed over free by demo activation"
        : "Set PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and a price id to sell",
    };
  }

  const paddle = getPaddle()!;
  const started = Date.now();
  // The cheapest authenticated call there is. It proves the key is live and
  // accepted without touching a customer or writing anything. `list` returns a
  // lazy collection, so `next()` is what actually performs the request —
  // without it this would time nothing and prove nothing.
  await paddle.prices.list({ perPage: 1 }).next();
  const ms = Date.now() - started;

  const environment = paddleEnvironment();

  // A past-due subscription is Paddle working correctly and a card failing,
  // but it is money not arriving, so the board says so.
  const pastDue = await db.subscription.count({ where: { status: "PAST_DUE" } });
  if (pastDue > 0) {
    return {
      status: "degraded",
      latencyMs: ms,
      detail: `Key accepted (${environment}) · ${pastDue} subscription${pastDue === 1 ? "" : "s"} past due`,
    };
  }

  // Sandbox is the safe default and the right one nearly everywhere, but a
  // deployment that is *meant* to be taking money and is quietly pointed at
  // sandbox takes no money at all and looks perfectly healthy while doing it.
  // Amber is the honest colour for that: working, and probably not what
  // somebody intended.
  if (environment === "sandbox" && !isDemoPlans()) {
    return {
      status: "degraded",
      latencyMs: ms,
      detail: "Key accepted, but pointed at sandbox — no real money can be taken",
    };
  }

  return bySpeed(ms, `Key accepted (${environment})`);
}

async function probeEmail(): Promise<Reading> {
  if (!emailEnabled()) {
    return {
      status: "off",
      latencyMs: null,
      detail: "No Resend key — messages are logged, never sent",
    };
  }

  const started = Date.now();
  // Listing domains is read-only and does not cost a send. A 401 here is the
  // failure worth catching: a revoked key looks fine until a verdict is filed.
  const response = await fetch("https://api.resend.com/domains", {
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    cache: "no-store",
  });
  const ms = Date.now() - started;

  if (response.status === 401 || response.status === 403) {
    return { status: "down", latencyMs: ms, detail: "Resend refused the key" };
  }
  if (!response.ok) {
    return { status: "down", latencyMs: ms, detail: `Resend answered ${response.status}` };
  }
  return bySpeed(ms, "Key accepted");
}

async function probeStorage(): Promise<Reading> {
  if (!uploadsEnabled()) {
    return {
      status: "off",
      latencyMs: null,
      detail: "No blob token — filing proof with a photograph is refused",
    };
  }

  const started = Date.now();
  const page = await list({ limit: 1 });
  const ms = Date.now() - started;
  return bySpeed(ms, page.blobs.length > 0 ? "Store answering, has objects" : "Store answering, empty");
}

async function probeStrava(): Promise<Reading> {
  if (!stravaEnabled()) {
    return {
      status: "off",
      latencyMs: null,
      detail: "No client id — the connect button is hidden",
    };
  }

  const now = new Date();
  const [connected, expired] = await Promise.all([
    db.stravaAccount.count(),
    db.stravaAccount.count({ where: { expiresAt: { lte: now } } }),
  ]);

  // Strava has no cheap unauthenticated health endpoint, and calling it with
  // somebody's token to find out would be spending their rate limit on our
  // dashboard. What we *can* honestly report is our side of the connection.
  if (connected === 0) {
    return { status: "ok", latencyMs: null, detail: "Configured · nobody connected yet" };
  }
  if (expired === connected) {
    return {
      status: "degraded",
      latencyMs: null,
      detail: `${connected} connected · every token expired, refresh has not run`,
    };
  }
  return {
    status: "ok",
    latencyMs: null,
    detail: `${connected} connected · ${expired} token${expired === 1 ? "" : "s"} awaiting refresh`,
  };
}

/**
 * A scheduled route's health, read from what it wrote when it last ran.
 *
 * This is the one group whose status cannot be measured on demand — asking
 * "is the envelope job up?" means "did it run when it was supposed to", and
 * the only honest source for that is the row it writes on the way out.
 *
 * A job that has never reported is `off`, not `down`: on a fresh deployment,
 * or one where the cron secret was never set, nothing has failed yet.
 */
async function probeJob(system: string, graceHours: number): Promise<Reading> {
  const last = await db.systemEvent.findFirst({
    where: { system, ran: true },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true, detail: true, latencyMs: true },
  });

  if (!last) {
    return {
      status: "off",
      latencyMs: null,
      detail: (process.env.CRON_SECRET ?? "").length === 0
        ? "Never run · no CRON_SECRET, so the route refuses every call"
        : "Never run · waiting for its first firing",
    };
  }

  const hours = (Date.now() - last.createdAt.getTime()) / 3_600_000;
  const ago = hours < 1 ? `${Math.round(hours * 60)} min ago` : `${Math.round(hours)}h ago`;

  if (last.status === "down") {
    return { status: "down", latencyMs: last.latencyMs, detail: `Last run failed ${ago} · ${last.detail ?? ""}`.trim() };
  }
  // Overdue by its own cadence. Twice the grace is long enough that a missed
  // firing is a fault rather than a clock skew.
  if (hours > graceHours * 2) {
    return { status: "down", latencyMs: last.latencyMs, detail: `Silent for ${Math.round(hours)}h · last ran ${ago}` };
  }
  if (hours > graceHours) {
    return { status: "degraded", latencyMs: last.latencyMs, detail: `Overdue · last ran ${ago}` };
  }
  return { status: "ok", latencyMs: last.latencyMs, detail: `Ran ${ago} · ${last.detail ?? "no detail"}` };
}

/* -------------------------------------------------------------------------- */
/* Reading the board                                                          */
/* -------------------------------------------------------------------------- */

export type SystemReading = SystemDefinition & Reading & { history: SparkPoint[] };

export type SparkPoint = { at: Date; value: number | null; status: SystemStatus };

/**
 * How long a set of probes is reused before the next load re-runs them.
 *
 * Two loads of the panel in the same breath — clicking through to a page and
 * straight back — should not mean two rounds of calls to Paddle, Resend and
 * the blob store, and should not write twenty rows into the log to say the
 * same thing twice. Fifteen seconds is short enough that the board is still
 * answering "now" and long enough to absorb ordinary navigation.
 *
 * Module scope, so it is per warm instance and disappears on a cold start.
 * That is the right shape for this: it is an optimisation, never a source of
 * truth, and a fresh instance simply probes.
 */
const FRESH_MS = 15_000;
let lastRead: { at: number; board: SystemReading[] } | null = null;

/**
 * Every system, probed in parallel, with its recent history attached.
 *
 * Parallel because these are ten independent network waits and running them in
 * sequence would make the page as slow as their sum. The whole set is bounded
 * by `TIMEOUT_MS` rather than by ten times it.
 */
export async function readSystems(): Promise<SystemReading[]> {
  if (lastRead && Date.now() - lastRead.at < FRESH_MS) return lastRead.board;

  const [readings, histories] = await Promise.all([
    Promise.all(SYSTEMS.map((system) => safely(system.probe))),
    getHistories(SYSTEMS.map((system) => system.id), 24, 24),
  ]);

  const board = SYSTEMS.map((system, index) => ({
    ...system,
    ...readings[index],
    history: histories.get(system.id) ?? [],
  }));

  lastRead = { at: Date.now(), board };

  // Fire-and-forget, exactly like `lib/activity`: the desk asked what the
  // state of things is, and a failure to *write that down* must not turn into
  // a failure to answer.
  void recordProbes(board).catch(() => undefined);

  return board;
}

/**
 * One system, probed through the same wrapper and recorded the same way.
 *
 * The detail page needs this: it must never show a status older than the
 * moment it rendered, and it must not be the thing that breaks when the system
 * it is reporting on is the broken one. Sharing `safely` rather than
 * re-implementing it is what keeps the timeout and the message-only error
 * handling identical on both pages.
 */
export async function probeOne(system: SystemDefinition): Promise<Reading> {
  const reading = await safely(system.probe);
  void db.systemEvent
    .create({
      data: {
        system: system.id,
        status: reading.status,
        latencyMs: reading.latencyMs,
        detail: reading.detail,
        ran: false,
      },
    })
    .catch(() => undefined);
  return reading;
}

async function recordProbes(board: SystemReading[]): Promise<void> {
  await db.systemEvent.createMany({
    data: board.map((system) => ({
      system: system.id,
      status: system.status,
      latencyMs: system.latencyMs,
      detail: system.detail,
      ran: false,
    })),
  });
}

export type SystemsPulse = {
  status: SystemStatus;
  up: number;
  degraded: number;
  down: number;
  off: number;
  total: number;
};

/**
 * The whole board reduced to what fits in a sidebar.
 *
 * Reads `readSystems` rather than probing separately, so the strip in the rail
 * and the board on its own page can never disagree — and because that call is
 * memoised for fifteen seconds, having it on every panel screen costs one set
 * of probes a quarter-minute rather than one per navigation.
 *
 * Worst-of, not an average: nine up and one down is an outage, and a rail that
 * rounded that away would be worse than no rail at all. `off` is excluded from
 * the verdict — an integration this deployment was never given a key for is not
 * a fault.
 */
export async function getSystemsPulse(): Promise<SystemsPulse> {
  return pulseOf(await readSystems());
}

/**
 * The same reduction over a board already in hand.
 *
 * `/admin/systems` has the full readings and would otherwise round-trip
 * `readSystems` a second time just to count them.
 */
export function pulseOf(board: SystemReading[]): SystemsPulse {
  const counted: Record<SystemStatus, number> = { ok: 0, degraded: 0, down: 0, off: 0 };
  for (const system of board) counted[system.status] += 1;

  // Everything unwired is not "up" — it is a deployment with nothing hooked
  // to it, and `worstOf` over an empty list would cheerfully say ok.
  const judged = board.map((system) => system.status).filter((status) => status !== "off");

  return {
    status: judged.length === 0 ? "off" : worstOf(judged),
    up: counted.ok,
    degraded: counted.degraded,
    down: counted.down,
    off: counted.off,
    total: board.length,
  };
}

/**
 * What a scheduled route writes when it finishes, and the only thing that
 * makes the `job.*` entries mean anything.
 *
 * Deliberately swallows its own failure. A job that did its work and then
 * could not file its paperwork has still done its work, and turning that into
 * a 500 would make the monitor the thing that breaks the run.
 */
export async function recordRun(
  system: string,
  reading: { status: SystemStatus; latencyMs?: number | null; detail: string },
): Promise<void> {
  try {
    await db.systemEvent.create({
      data: {
        system,
        status: reading.status,
        latencyMs: reading.latencyMs ?? null,
        detail: reading.detail,
        ran: true,
      },
    });
  } catch {
    // Nothing to do and nowhere to say it. The run itself already succeeded.
  }
}

/**
 * Bucketed history, for the graphs.
 *
 * One query for every system asked about rather than one per system, then
 * bucketed in memory: at 24 buckets over 24 hours this is a few hundred rows,
 * and ten round trips to Postgres to draw ten sparklines would cost more than
 * the arithmetic does.
 *
 * A bucket with no rows is `null` rather than `0`. Zero would draw a line to
 * the floor and read as "it went down"; null is "nobody looked", which is what
 * an hour with no probe in it actually means.
 */
export async function getHistories(
  ids: string[],
  hours: number,
  buckets: number,
): Promise<Map<string, SparkPoint[]>> {
  const span = hours * 3_600_000;
  const since = new Date(Date.now() - span);
  const width = span / buckets;

  const rows = await db.systemEvent.findMany({
    where: { system: { in: ids }, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { system: true, status: true, latencyMs: true, createdAt: true },
  });

  const grouped = new Map<string, { total: number; count: number; status: SystemStatus }[]>();
  for (const id of ids) {
    grouped.set(
      id,
      Array.from({ length: buckets }, () => ({ total: 0, count: 0, status: "ok" as SystemStatus })),
    );
  }

  for (const row of rows) {
    const slot = Math.min(buckets - 1, Math.floor((row.createdAt.getTime() - since.getTime()) / width));
    const bucket = grouped.get(row.system)?.[slot];
    if (!bucket) continue;
    if (row.latencyMs !== null) {
      bucket.total += row.latencyMs;
      bucket.count += 1;
    } else {
      // Counted so the bucket is not empty, but contributes no latency: a
      // system with nothing to time still has a status worth drawing.
      bucket.count += 1;
    }
    bucket.status = worstOf([bucket.status, asStatus(row.status)]);
  }

  const out = new Map<string, SparkPoint[]>();
  for (const [id, list] of grouped) {
    out.set(
      id,
      list.map((bucket, index) => ({
        at: new Date(since.getTime() + index * width + width / 2),
        value: bucket.count === 0 ? null : bucket.total === 0 ? 0 : bucket.total / bucket.count,
        status: bucket.count === 0 ? "off" : bucket.status,
      })),
    );
  }
  return out;
}

function asStatus(raw: string): SystemStatus {
  return raw === "ok" || raw === "degraded" || raw === "down" || raw === "off" ? raw : "down";
}

/* -------------------------------------------------------------------------- */
/* The log                                                                    */
/* -------------------------------------------------------------------------- */

export type SystemLogEntry = {
  id: string;
  status: SystemStatus;
  latencyMs: number | null;
  detail: string | null;
  ran: boolean;
  at: Date;
};

/**
 * One system's timeline, newest first.
 *
 * `onlyFaults` is what the desk actually wants most of the time: a probe every
 * page load means the happy path is thousands of identical "answering" lines,
 * and the four that say otherwise are the ones worth reading.
 */
export async function getSystemLog(
  system: string,
  { limit = 60, onlyFaults = false }: { limit?: number; onlyFaults?: boolean } = {},
): Promise<SystemLogEntry[]> {
  const rows = await db.systemEvent.findMany({
    where: {
      system,
      ...(onlyFaults ? { status: { in: ["down", "degraded"] } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, status: true, latencyMs: true, detail: true, ran: true, createdAt: true },
  });

  return rows.map((row) => ({
    id: row.id,
    status: asStatus(row.status),
    latencyMs: row.latencyMs,
    detail: row.detail,
    ran: row.ran,
    at: row.createdAt,
  }));
}

export type SystemSummary = {
  /** Share of recorded readings that were `ok`, over the window. */
  uptime: number | null;
  checks: number;
  faults: number;
  medianMs: number | null;
  slowestMs: number | null;
  lastFaultAt: Date | null;
};

/** The figures printed beside a system's graph. */
export async function getSystemSummary(system: string, hours = 24): Promise<SystemSummary> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const rows = await db.systemEvent.findMany({
    where: { system, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { status: true, latencyMs: true, createdAt: true },
  });

  if (rows.length === 0) {
    return { uptime: null, checks: 0, faults: 0, medianMs: null, slowestMs: null, lastFaultAt: null };
  }

  const faults = rows.filter((row) => row.status === "down" || row.status === "degraded");
  // Median rather than mean: one four-second timeout would drag an average
  // far enough to hide what the other nine hundred readings actually did.
  const timings = rows
    .map((row) => row.latencyMs)
    .filter((ms): ms is number => ms !== null)
    .sort((a, b) => a - b);

  return {
    uptime: rows.filter((row) => row.status === "ok").length / rows.length,
    checks: rows.length,
    faults: faults.length,
    medianMs: timings.length > 0 ? timings[Math.floor(timings.length / 2)] : null,
    slowestMs: timings.length > 0 ? timings[timings.length - 1] : null,
    lastFaultAt: faults[0]?.createdAt ?? null,
  };
}

/**
 * Drop events past the retention window.
 *
 * Called from the scheduled routes rather than from a page: a probe runs on
 * every load of the board, so sweeping there would mean a delete on every
 * load. Fourteen days is longer than the widest graph and short enough that
 * the table stays small.
 */
export async function pruneSystemEvents(days = 14): Promise<number> {
  const { count } = await db.systemEvent.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - days * 86_400_000) } },
  });
  return count;
}

/* -------------------------------------------------------------------------- */
/* What else there is to say about one system                                 */
/* -------------------------------------------------------------------------- */

export type Fact = { label: string; value: string; tone?: "plain" | "warn" | "good" };

/**
 * The figures on a system's own page that its tile has no room for.
 *
 * Deliberately hand-written per system rather than derived from a generic
 * shape: what is worth knowing about the blob store ("how many photographs,
 * how big") has nothing in common with what is worth knowing about the review
 * desk ("how many waiting, how old"), and a schema general enough to cover
 * both would say nothing useful about either.
 *
 * Configuration is reported as present or absent, never echoed. `PADDLE_API_KEY`
 * being set is worth knowing at the desk; its value is not, and this page is
 * one stolen session away from anybody who gets in.
 */
export async function getSystemFacts(id: string): Promise<Fact[]> {
  switch (id) {
    case "database":
      return factsForDatabase();
    case "auth":
      return factsForAuth();
    case "review":
      return factsForReview();
    case "billing":
      return factsForBilling();
    case "email":
      return factsForEmail();
    case "storage":
      return factsForStorage();
    case "strava":
      return factsForStrava();
    default:
      return id.startsWith("job.") ? factsForJob(id) : [];
  }
}

function set(value: string | undefined): Fact["value"] {
  return (value ?? "").length > 0 ? "set" : "not set";
}

async function factsForDatabase(): Promise<Fact[]> {
  const [users, quests, submissions, events] = await Promise.all([
    db.user.count(),
    db.quest.count(),
    db.submission.count(),
    db.systemEvent.count(),
  ]);
  return [
    { label: "Accounts", value: users.toLocaleString("en-GB") },
    { label: "Quests in the catalogue", value: quests.toLocaleString("en-GB") },
    { label: "Submissions filed", value: submissions.toLocaleString("en-GB") },
    { label: "Rows in this log", value: events.toLocaleString("en-GB") },
    { label: "Direct URL configured", value: set(process.env.DIRECT_URL) },
  ];
}

async function factsForAuth(): Promise<Fact[]> {
  const now = new Date();
  const [live, stale, staff, today] = await Promise.all([
    db.session.count({ where: { expiresAt: { gt: now } } }),
    db.session.count({ where: { expiresAt: { lte: now } } }),
    db.user.count({ where: { role: { not: "USER" } } }),
    db.session.count({ where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);
  return [
    { label: "Signed in now", value: live.toLocaleString("en-GB") },
    { label: "Expired rows", value: stale.toLocaleString("en-GB"), tone: stale > 5_000 ? "warn" : "plain" },
    { label: "Signed in today", value: today.toLocaleString("en-GB") },
    { label: "Accounts with a desk role", value: staff.toLocaleString("en-GB") },
  ];
}

async function factsForReview(): Promise<Fact[]> {
  const [pending, approved, rejected, oldest] = await Promise.all([
    db.submission.count({ where: { status: "PENDING" } }),
    db.submission.count({ where: { status: "APPROVED" } }),
    db.submission.count({ where: { status: "REJECTED" } }),
    db.submission.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);
  const days = oldest ? Math.floor((Date.now() - oldest.createdAt.getTime()) / 86_400_000) : null;
  return [
    { label: "Waiting on a reader", value: pending.toLocaleString("en-GB"), tone: pending > 0 ? "warn" : "good" },
    { label: "Oldest has waited", value: days === null ? "—" : `${days} day${days === 1 ? "" : "s"}` },
    { label: "Approved, all time", value: approved.toLocaleString("en-GB") },
    { label: "Rejected, all time", value: rejected.toLocaleString("en-GB") },
  ];
}

async function factsForBilling(): Promise<Fact[]> {
  const [live, pastDue, paused, cancelling, demo] = await Promise.all([
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
    db.subscription.count({ where: { status: "PAUSED" } }),
    db.subscription.count({ where: { cancelAtPeriodEnd: true } }),
    db.subscription.count({ where: { demo: true } }),
  ]);

  const environment = paddleEnvironment();
  return [
    {
      label: "Environment",
      value: environment,
      // Not a fault, but the one setting on this page whose being wrong is
      // silent, so it is coloured rather than left as plain text.
      tone: environment === "sandbox" && !isDemoPlans() ? "warn" : "plain",
    },
    { label: "API key", value: set(process.env.PADDLE_API_KEY) },
    { label: "Client token", value: set(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) },
    { label: "Webhook secret", value: set(process.env.PADDLE_WEBHOOK_SECRET) },
    { label: "Explorer price id", value: set(process.env.PADDLE_PRICE_ID_EXPLORER_MONTHLY) },
    { label: "Ultra price id", value: set(process.env.PADDLE_PRICE_ID_ULTRA_MONTHLY) },
    { label: "Demo activation", value: isDemoPlans() ? "on" : "off" },
    { label: "Live subscriptions", value: live.toLocaleString("en-GB") },
    { label: "Handed over free", value: demo.toLocaleString("en-GB") },
    { label: "Past due", value: pastDue.toLocaleString("en-GB"), tone: pastDue > 0 ? "warn" : "plain" },
    { label: "Paused", value: paused.toLocaleString("en-GB") },
    { label: "Cancelling at period end", value: cancelling.toLocaleString("en-GB") },
  ];
}

async function factsForEmail(): Promise<Fact[]> {
  const [optedOutVerdict, optedOutDrop] = await Promise.all([
    db.notificationSettings.count({ where: { verdict: false } }),
    db.notificationSettings.count({ where: { questDrop: false } }),
  ]);
  return [
    { label: "API key", value: set(process.env.RESEND_API_KEY) },
    { label: "From address", value: process.env.EMAIL_FROM ?? "the default" },
    { label: "Turned verdicts off", value: optedOutVerdict.toLocaleString("en-GB") },
    { label: "Turned drops off", value: optedOutDrop.toLocaleString("en-GB") },
  ];
}

async function factsForStorage(): Promise<Fact[]> {
  const withPhoto = await db.submission.count({ where: { photos: { isEmpty: false } } });
  return [
    { label: "Blob token", value: set(process.env.BLOB_READ_WRITE_TOKEN) },
    { label: "Submissions with a photograph", value: withPhoto.toLocaleString("en-GB") },
    { label: "Longest edge stored", value: "1600 px, re-encoded" },
    { label: "Largest accepted upload", value: "12 MB" },
  ];
}

async function factsForStrava(): Promise<Fact[]> {
  const now = new Date();
  const [connected, expired] = await Promise.all([
    db.stravaAccount.count(),
    db.stravaAccount.count({ where: { expiresAt: { lte: now } } }),
  ]);
  return [
    { label: "Client id", value: set(process.env.STRAVA_CLIENT_ID) },
    { label: "Client secret", value: set(process.env.STRAVA_CLIENT_SECRET) },
    { label: "Accounts connected", value: connected.toLocaleString("en-GB") },
    { label: "Tokens awaiting refresh", value: expired.toLocaleString("en-GB"), tone: expired > 0 ? "warn" : "plain" },
  ];
}

async function factsForJob(id: string): Promise<Fact[]> {
  const [last, lastOk, runs, failures] = await Promise.all([
    db.systemEvent.findFirst({
      where: { system: id, ran: true },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true },
    }),
    db.systemEvent.findFirst({
      where: { system: id, ran: true, status: "ok" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.systemEvent.count({ where: { system: id, ran: true } }),
    db.systemEvent.count({ where: { system: id, ran: true, status: "down" } }),
  ]);

  return [
    { label: "Cron secret", value: set(process.env.CRON_SECRET) },
    { label: "Runs recorded", value: runs.toLocaleString("en-GB") },
    { label: "Failed runs", value: failures.toLocaleString("en-GB"), tone: failures > 0 ? "warn" : "plain" },
    { label: "Last run", value: last ? last.createdAt.toISOString().replace("T", " ").slice(0, 16) : "never" },
    {
      label: "Last clean run",
      value: lastOk ? lastOk.createdAt.toISOString().replace("T", " ").slice(0, 16) : "never",
      tone: lastOk ? "plain" : "warn",
    },
    {
      label: "Route",
      value: `/api/cron/${id.slice("job.".length)}`,
    },
  ];
}
