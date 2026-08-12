import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/** Require a signed-in user. Redirects to login otherwise. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
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
