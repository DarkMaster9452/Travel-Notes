"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { burnPasswordCycle, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { AUTH_RATE_LIMIT } from "@/lib/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";

export type AuthState = { errors?: Record<string, string> } | undefined;

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
    const user = await db.user.create({
      data: { email, name, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
    userId = user.id;
  } catch {
    // Unique constraint under a race — same message as the check above.
    return { errors: { email: "There's already an account with this email." } };
  }

  await createSession(userId);
  redirect("/onboarding");
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
    select: { id: true, passwordHash: true, onboardedAt: true },
  });

  if (!user) {
    // Spend comparable time so a missing account isn't detectable by timing.
    await burnPasswordCycle(password);
    return { errors: { form: "That email and password don't match." } };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { errors: { form: "That email and password don't match." } };

  await createSession(user.id);

  const next = safeNext(formData.get("next"));
  redirect(next ?? (user.onboardedAt ? "/dashboard" : "/onboarding"));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
