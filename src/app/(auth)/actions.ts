"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { burnPasswordCycle, hashPassword, verifyPassword } from "@/lib/auth/password";
import { isStaffRole } from "@/lib/admin/access";
import { createSession, destroySession } from "@/lib/auth/session";
import { AUTH_RATE_LIMIT } from "@/lib/config";
import { db } from "@/lib/db";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";

export type AuthState = { errors?: Record<string, string> } | undefined;

/**
 * Prisma's duplicate-key code. Checked structurally rather than by importing
 * `Prisma.PrismaClientKnownRequestError`, which drags the client namespace
 * into a module that only needs one field off the error.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/** Only allow relative paths, so `?next=` can't be used as an open redirect. */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === "string" ? value : null;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

async function clientKey(scope: string, identifier: string): Promise<string> {
  const store = await headers();
  const ip =
    store.get("x-forwarded-for")?.split(",")[0]?.trim() ?? store.get("x-real-ip") ?? "unknown";
  return `${scope}:${ip}:${identifier}`;
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;

  const limit = await rateLimit(
    await clientKey("signup", email),
    AUTH_RATE_LIMIT.max,
    AUTH_RATE_LIMIT.windowSeconds,
  );
  if (!limit.ok) {
    return { errors: { form: "Too many attempts. Try again in a few minutes." } };
  }

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { errors: { email: "There's already an account with this email." } };
  }

  let userId: string;
  try {
    // Preferences are written here, with defaults, rather than collected by a
    // quiz before the account exists. A new account is immediately complete —
    // there is no half-finished state for the rest of the app to guard against.
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(password),
        preferences: { create: DEFAULT_PREFERENCES },
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    // Only a genuine unique-constraint violation means the address is taken.
    //
    // This used to catch everything and report "already registered" for any
    // failure at all, which turned an unmigrated database into a signup form
    // insisting an empty `users` table already held the address. Anything that
    // isn't P2002 is a real fault: log it and say so, rather than blaming the
    // person typing.
    if (isUniqueViolation(error)) {
      return { errors: { email: "There's already an account with this email." } };
    }
    console.error("[auth] signup failed", error);
    return {
      errors: { form: "We couldn't create your account. Please try again in a moment." },
    };
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const limit = await rateLimit(
    await clientKey("login", email),
    AUTH_RATE_LIMIT.max,
    AUTH_RATE_LIMIT.windowSeconds,
  );
  if (!limit.ok) {
    return { errors: { form: "Too many attempts. Try again in a few minutes." } };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true },
  });

  if (!user) {
    // Spend comparable time so a missing account isn't detectable by timing.
    await burnPasswordCycle(password);
    return { errors: { form: "That email and password don't match." } };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { errors: { form: "That email and password don't match." } };

  await createSession(user.id);

  // Anybody at the desk lands in the panel, not on a customer dashboard they
  // would only be bounced off. A `?next=` that points into the customer side
  // is dropped for the same reason — following it would be a redirect straight
  // back here. The one exception is an invitation link, which is where a new
  // reader is trying to go and is not part of the customer side.
  const invited = safeNext(formData.get("next"))?.startsWith("/invite/");
  if (isStaffRole(user.role) && !invited) {
    const next = safeNext(formData.get("next"));
    redirect(next?.startsWith("/admin") ? next : "/admin");
  }

  const next = safeNext(formData.get("next"));
  redirect(next ?? "/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
