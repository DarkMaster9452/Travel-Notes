import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/auth/jwt";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/**
 * Where to send someone who isn't signed in.
 *
 * If they still hold a session cookie, it has to be cleared on the way past.
 * The proxy only checks that the token is validly *signed* — it can't reach the
 * database — so a token whose session row has been deleted still looks signed
 * in to it, and it will bounce /login straight back to /dashboard. Sending
 * these requests through the clear route breaks that loop; a plain redirect to
 * /login would spin until the browser gave up.
 */
async function signedOutDestination(returnTo?: string): Promise<string> {
  const suffix = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
  const store = await cookies();

  if (store.get(SESSION_COOKIE)?.value) {
    return `/api/auth/clear?next=${encodeURIComponent(`/login${suffix}`)}`;
  }
  return `/login${suffix}`;
}

/** Require a signed-in user. Redirects to login otherwise. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(await signedOutDestination(returnTo));
  }
  return user;
}

/**
 * Require a signed-in user who finished onboarding. Everything behind the
 * dashboard needs preferences to exist before it can do anything useful.
 */
export async function requireOnboardedUser(returnTo?: string): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!user.onboardedAt) redirect("/onboarding");
  return user;
}
