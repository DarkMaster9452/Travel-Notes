import "server-only";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

/**
 * Strava.
 *
 * Two things the product actually wants from it: proof that an activity
 * exists, and the three figures a watch recorded. Everything else Strava
 * offers is somebody else's product.
 *
 * The access token lives six hours, so every call goes through
 * `accessTokenFor`, which refreshes a minute early rather than after a 401.
 * A refresh that Strava rejects deletes the connection: a stored refresh token
 * that no longer works is not a connection, and leaving the row there would
 * show a member "Connected" beside something that cannot connect.
 */

const AUTHORIZE = "https://www.strava.com/oauth/authorize";
const TOKEN = "https://www.strava.com/oauth/token";
const API = "https://www.strava.com/api/v3";

/** Read-only, and only what the proof form needs. */
const SCOPE = "read,activity:read";

export function stravaEnabled(): boolean {
  return (
    (process.env.STRAVA_CLIENT_ID ?? "").length > 0 &&
    (process.env.STRAVA_CLIENT_SECRET ?? "").length > 0
  );
}

export function stravaRedirectUri(): string {
  return `${appUrl}/api/strava/callback`;
}

/** Where to send somebody who has pressed Connect. */
export function stravaAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: stravaRedirectUri(),
    response_type: "code",
    approval_prompt: "auto",
    scope: SCOPE,
    state,
  });
  return `${AUTHORIZE}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope?: string;
  athlete?: { id: number; firstname?: string; lastname?: string };
};

async function exchange(body: Record<string, string>): Promise<TokenResponse | null> {
  const response = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      ...body,
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as TokenResponse;
}

/** Complete the OAuth handshake and store the connection. */
export async function connectStrava(userId: string, code: string): Promise<boolean> {
  const token = await exchange({ code, grant_type: "authorization_code" });
  if (!token?.athlete) return false;

  const athleteName = [token.athlete.firstname, token.athlete.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  const values = {
    athleteId: String(token.athlete.id),
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: new Date(token.expires_at * 1000),
    scope: token.scope ?? SCOPE,
    athleteName: athleteName || null,
  };

  await db.stravaAccount.upsert({
    where: { userId },
    update: values,
    create: { userId, ...values },
  });
  return true;
}

export async function disconnectStrava(userId: string): Promise<void> {
  await db.stravaAccount.deleteMany({ where: { userId } });
}

export type StravaConnection = {
  athleteId: string;
  athleteName: string | null;
  connectedAt: Date;
};

export async function getStravaConnection(userId: string): Promise<StravaConnection | null> {
  const row = await db.stravaAccount.findUnique({
    where: { userId },
    select: { athleteId: true, athleteName: true, createdAt: true },
  });
  return row ? { athleteId: row.athleteId, athleteName: row.athleteName, connectedAt: row.createdAt } : null;
}

/** A live access token, refreshed if it is about to die. Null when not connected. */
async function accessTokenFor(userId: string): Promise<string | null> {
  const account = await db.stravaAccount.findUnique({ where: { userId } });
  if (!account) return null;

  if (account.expiresAt.getTime() - 60_000 > Date.now()) return account.accessToken;

  const token = await exchange({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
  });

  if (!token) {
    await db.stravaAccount.delete({ where: { userId } }).catch(() => undefined);
    return null;
  }

  await db.stravaAccount.update({
    where: { userId },
    data: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(token.expires_at * 1000),
    },
  });
  return token.access_token;
}

/** The activity id in a Strava URL, or null if that is not what this is. */
export function activityIdFrom(url: string): string | null {
  const match = url.match(/strava\.com\/activities\/(\d+)/);
  return match ? match[1] : null;
}

export type StravaActivity = {
  id: string;
  name: string;
  /** Kilometres. */
  distance: number;
  /** Metres. */
  elevation: number;
  /** Minutes. */
  movingTime: number;
  startedAt: Date | null;
};

/**
 * One activity, as the proof form's claimed figures.
 *
 * Strava returns metres and seconds; the product stores kilometres and
 * minutes, and the conversion happens here rather than at the two call sites
 * that would each have got it slightly differently.
 */
export async function getActivity(userId: string, url: string): Promise<StravaActivity | null> {
  const id = activityIdFrom(url);
  if (!id) return null;

  const token = await accessTokenFor(userId);
  if (!token) return null;

  const response = await fetch(`${API}/activities/${id}?include_all_efforts=false`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;

  const activity = (await response.json()) as {
    id: number;
    name: string;
    distance: number;
    total_elevation_gain: number;
    moving_time: number;
    start_date?: string;
  };

  return {
    id: String(activity.id),
    name: activity.name,
    distance: Math.round((activity.distance / 1000) * 10) / 10,
    elevation: Math.round(activity.total_elevation_gain),
    movingTime: Math.round(activity.moving_time / 60),
    startedAt: activity.start_date ? new Date(activity.start_date) : null,
  };
}
