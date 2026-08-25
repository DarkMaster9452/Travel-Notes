import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireClient } from "@/lib/auth/guards";
import { stravaAuthorizeUrl, stravaEnabled } from "@/lib/strava";

export const runtime = "nodejs";

/** Start the Strava handshake. The state cookie is what the callback checks. */
export async function GET() {
  await requireClient();

  if (!stravaEnabled()) {
    return NextResponse.redirect(
      new URL("/settings/connected?error=unconfigured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    );
  }

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("sq_strava_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(stravaAuthorizeUrl(state));
}
