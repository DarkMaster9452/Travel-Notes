import "server-only";

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { recordRun } from "@/lib/admin/systems";

/**
 * Who may ask the app to do something on a schedule.
 *
 * Vercel signs its own cron invocations with a bearer token, and anything else
 * that can reach the URL is the internet. The comparison is constant-time
 * because a fast rejection leaks the prefix of the secret one byte at a time.
 *
 * With no secret configured the routes refuse everything rather than allowing
 * everything: a scheduled job that anybody can trigger is worse than one that
 * never runs.
 */
export function cronAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (secret.length === 0) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

/**
 * The wrapper every scheduled route goes through.
 *
 * Three things that were previously each route's own business and are now one
 * decision made once:
 *
 *   · the bearer check, so a route cannot be written that forgets it;
 *   · a row in the systems log, which is the *only* honest source for "did
 *     this job run when it was supposed to" — nothing can probe that on
 *     demand, so a job that does not write on its way out is a job the panel
 *     can only guess about;
 *   · a real 500 with the error's message logged, rather than a stack trace
 *     Vercel keeps and nobody reads.
 *
 * An unauthorised call is *not* logged. It never reached the work, it carries
 * no information about whether the job is healthy, and letting the internet
 * write rows into a table by hitting a URL is how that table stops being
 * useful.
 */
export async function runScheduled(
  request: Request,
  system: string,
  work: () => Promise<Record<string, unknown>>,
): Promise<NextResponse> {
  if (!cronAuthorised(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const started = Date.now();

  try {
    const body = await work();
    await recordRun(system, {
      status: "ok",
      latencyMs: Date.now() - started,
      detail: summarise(body),
    });
    return NextResponse.json({ ok: true, ...body });
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    await recordRun(system, {
      status: "down",
      latencyMs: Date.now() - started,
      detail: message.slice(0, 180),
    });
    console.error(`[cron] ${system} failed`, error);
    return NextResponse.json({ ok: false, error: "The run failed." }, { status: 500 });
  }
}

/**
 * A run's result as one line for the log.
 *
 * Reads whatever the route chose to return, which is the same shape it puts in
 * its JSON response — so the log line and the response can never describe
 * different runs. Objects and arrays are reported by size rather than
 * serialised: the envelope job returns a despatch list with names and
 * addresses in it, and none of that belongs in a table the panel prints.
 */
function summarise(body: Record<string, unknown>): string {
  const parts = Object.entries(body).map(([key, value]) => {
    if (Array.isArray(value)) return `${key} ${value.length}`;
    if (value !== null && typeof value === "object") return key;
    return `${key} ${String(value)}`;
  });
  const line = parts.join(" · ");
  return line.length > 180 ? `${line.slice(0, 177)}…` : line || "nothing to report";
}
