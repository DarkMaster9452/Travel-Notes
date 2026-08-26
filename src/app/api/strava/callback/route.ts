import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireClient } from "@/lib/auth/guards";
import { appUrl } from "@/lib/env";
import { connectStrava } from "@/lib/strava";

export const runtime = "nodejs";

/**
 * Finish the Strava handshake.
 *
 * The `state` is compared against the cookie set when the handshake started,
 * and the cookie is cleared either way: a state value that has been used once
 * must not authorise a second exchange.
 */
export async function GET(request: Request) {
  const user = await requireClient();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expected = store.get("sq_strava_state")?.value;
  store.delete("sq_strava_state");

  const settings = new URL("/settings/connected", appUrl);

  if (url.searchParams.get("error")) {
    settings.searchParams.set("error", "declined");
    return NextResponse.redirect(settings);
  }
  if (!code || !state || !expected || state !== expected) {
    settings.searchParams.set("error", "state");
    return NextResponse.redirect(settings);
  }

  const connected = await connectStrava(user.id, code);
  settings.searchParams.set(connected ? "connected" : "error", connected ? "1" : "exchange");
  return NextResponse.redirect(settings);
}
