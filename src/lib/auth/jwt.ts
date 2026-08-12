import { jwtVerify, SignJWT } from "jose";

/**
 * Edge-safe token helpers. Kept free of database and Node-only imports so
 * `middleware.ts` can verify a cookie without a database round-trip.
 *
 * The token is only a pointer: real authority lives in the `sessions` table,
 * which is checked on every request that actually touches user data.
 */

export const SESSION_COOKIE = "sq_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionClaims = {
  /** User id. */
  sub: string;
  /** Session row id, so sessions can be revoked server-side. */
  sid: string;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (need ≥ 32 chars).");
  }
  return new TextEncoder().encode(value);
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ sid: claims.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer("sidequest")
    .setAudience("sidequest-app")
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "sidequest",
      audience: "sidequest-app",
    });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    return { sub: payload.sub, sid: payload.sid };
  } catch {
    return null;
  }
}
