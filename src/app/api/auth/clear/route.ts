import { NextResponse, type NextRequest } from "next/server";

import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clear a session cookie that no longer refers to a real session, then carry on
 * to wherever the caller was headed.
 *
 * This exists because the proxy and the pages disagree about what "signed in"
 * means, and only one of them can fix it. The proxy can't reach the database,
 * so it trusts any validly-signed token; a page *does* reach the database and
 * can see the session row is gone. Left alone, that produced a redirect loop:
 * the page bounced to /login, the proxy saw a good token and bounced straight
 * back to /dashboard, forever — the browser gave up with ERR_TOO_MANY_REDIRECTS
 * and the reader could never reach the login form.
 *
 * A Server Component can't delete a cookie, so the page redirects here instead:
 * a route handler can, and once the cookie is gone the proxy stops claiming the
 * reader is signed in.
 */
export async function GET(request: NextRequest) {
  await destroySession();

  // Only relative paths, so this can't be used as an open redirect.
  const requested = request.nextUrl.searchParams.get("next");
  const next = requested && requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/login";

  const url = request.nextUrl.clone();
  url.pathname = next.split("?")[0] ?? "/login";
  url.search = next.includes("?") ? `?${next.split("?").slice(1).join("?")}` : "";

  return NextResponse.redirect(url);
}
