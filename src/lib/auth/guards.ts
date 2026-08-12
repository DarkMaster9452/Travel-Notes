import "server-only";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/** Require a signed-in user. Redirects to login otherwise. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

/** Require an admin. Anything else is refused as not-found, not redirected. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}
