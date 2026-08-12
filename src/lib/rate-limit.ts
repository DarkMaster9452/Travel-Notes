import "server-only";

import { db } from "@/lib/db";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
};

/**
 * Fixed-window rate limiter backed by Postgres.
 *
 * A database counter (rather than an in-memory map) is deliberate: serverless
 * instances don't share memory, so an in-memory limiter is trivially bypassed
 * by spreading requests across cold starts.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    // Reset the window and increment in a single statement so concurrent
    // requests can't both read a stale count.
    const rows = await db.$queryRaw<Array<{ count: number; window_start: Date }>>`
      INSERT INTO "rate_limits" ("id", "key", "count", "window_start")
      VALUES (gen_random_uuid()::text, ${key}, 1, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limits"."window_start" < ${windowStart} THEN 1
          ELSE "rate_limits"."count" + 1
        END,
        "window_start" = CASE
          WHEN "rate_limits"."window_start" < ${windowStart} THEN ${now}
          ELSE "rate_limits"."window_start"
        END
      RETURNING "count", "window_start";
    `;

    const row = rows[0];
    if (!row) return { ok: true, remaining: max - 1, retryAfter: 0 };

    const resetsAt = new Date(row.window_start).getTime() + windowSeconds * 1000;
    const retryAfter = Math.max(0, Math.ceil((resetsAt - now.getTime()) / 1000));

    return {
      ok: row.count <= max,
      remaining: Math.max(0, max - row.count),
      retryAfter,
    };
  } catch {
    // A limiter outage must not take the product down; fail open but loudly.
    console.error(`[rate-limit] check failed for key ${key}`);
    return { ok: true, remaining: max, retryAfter: 0 };
  }
}
