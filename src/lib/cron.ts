import "server-only";

import { timingSafeEqual } from "node:crypto";

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
