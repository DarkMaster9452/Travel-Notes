import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/jwt";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: "USER" | "ADMIN";
  points: number;
  rulesAcceptedAt: Date | null;
  createdAt: Date;
};

/**
 * Resolve the current user from the session cookie.
 *
 * Deduped per request with `cache` so a page and its nested layouts share one
 * database round-trip.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const session = await db.session.findUnique({
    where: { id: claims.sid },
    select: {
      expiresAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          points: true,
          rulesAcceptedAt: true,
          createdAt: true,
        },
      },
    },
  });

  // The token's subject must match the session's owner — a token signed for
  // one user can never be replayed against another user's session row.
  if (!session || session.userId !== claims.sub) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: claims.sid } }).catch(() => undefined);
    return null;
  }

  return session.user;
});

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await db.session.create({
    data: { userId, expiresAt },
    select: { id: true },
  });

  const token = await signSessionToken({ sub: userId, sid: session.id });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const claims = await verifySessionToken(token);
    if (claims) {
      await db.session.delete({ where: { id: claims.sid } }).catch(() => undefined);
    }
  }
  store.delete(SESSION_COOKIE);
}

/** Housekeeping — safe to call opportunistically. */
export async function purgeExpiredSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
}
