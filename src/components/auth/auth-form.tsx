"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";

import type { AuthState } from "@/app/(auth)/actions";
import { Button, Spinner } from "@/components/stopa/ui";
import type { Dictionary } from "@/lib/i18n/dictionaries/sk";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  action,
  t,
}: {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const errors = state?.errors ?? {};

  const message = (code: string | undefined) =>
    code ? (t.auth.errors[code as keyof typeof t.auth.errors] ?? code) : undefined;

  return (
    <div>
      <h1 className="font-serif text-4xl leading-tight">
        {mode === "signup" ? t.auth.signupTitle : t.auth.loginTitle}
      </h1>
      <p className="mt-3 text-moss">
        {mode === "signup" ? t.auth.signupLede : t.auth.loginLede}
      </p>

      <form action={formAction} className="mt-8 space-y-6" noValidate>
        {next && <input type="hidden" name="next" value={next} />}

        {errors.form && (
          <p
            role="alert"
            className="rounded-[10px] border-l-2 border-brick bg-brick/15 px-4 py-3 text-sm"
          >
            {message(errors.form)}
          </p>
        )}

        {mode === "signup" && (
          <Field label={t.auth.name} htmlFor="name" error={message(errors.name)}>
            <input
              id="name"
              name="name"
              autoComplete="nickname"
              required
              maxLength={60}
              placeholder={t.auth.namePlaceholder}
              aria-invalid={Boolean(errors.name)}
              className={inputClass}
            />
          </Field>
        )}

        <Field label={t.auth.email} htmlFor="email" error={message(errors.email)}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
            className={inputClass}
          />
        </Field>

        <Field
          label={t.auth.password}
          htmlFor="password"
          error={message(errors.password)}
          hint={mode === "signup" ? t.auth.passwordHint : undefined}
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? 10 : undefined}
            aria-invalid={Boolean(errors.password)}
            className={inputClass}
          />
        </Field>

        {mode === "signup" && (
          <div>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-cream/85">
              <input
                type="checkbox"
                name="acceptRules"
                required
                className="mt-0.5 size-4 shrink-0 accent-amber"
              />
              <span>
                {t.auth.acceptRules}{" "}
                <Link href="/rules" className="text-amber underline underline-offset-4">
                  {t.rewards.rules}
                </Link>
              </span>
            </label>
            {errors.acceptRules && (
              <p role="alert" className="mt-2 text-sm text-amber">
                {message("rulesRequired")}
              </p>
            )}
          </div>
        )}

        <Button type="submit" size="block" disabled={pending}>
          {pending && <Spinner />}
          {pending ? t.auth.pending : mode === "signup" ? t.auth.submitSignup : t.auth.submitLogin}
        </Button>
      </form>

      <p className="mt-7 text-sm text-moss">
        {mode === "signup" ? (
          <>
            {t.auth.haveAccount}{" "}
            <Link href="/login" className="text-cream underline underline-offset-4 hover:text-amber">
              {t.auth.toLogin}
            </Link>
          </>
        ) : (
          <>
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="text-cream underline underline-offset-4 hover:text-amber">
              {t.auth.toSignup}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

const inputClass =
  "mt-2 h-12 w-full rounded-[10px] border border-cream/20 bg-transparent px-3.5 font-serif text-base text-cream placeholder:text-moss/70 focus:border-amber focus:outline-none";

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs uppercase tracking-[0.12em] text-moss">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-2 text-xs text-moss">{hint}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-amber">
          {error}
        </p>
      )}
    </div>
  );
}
