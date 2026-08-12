"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import type { AuthState } from "@/app/(auth)/actions";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  action,
}: {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const errors = state?.errors ?? {};

  return (
    <div>
      <h1 className="display-md">
        {mode === "signup" ? (
          <>
            Start your
            <br />
            first quest.
          </>
        ) : (
          <>
            Welcome
            <br />
            back.
          </>
        )}
      </h1>

      <p className="mt-5 text-sm text-stone">
        {mode === "signup"
          ? "Three quests free. No card, no trial countdown."
          : "Pick up where you left off."}
      </p>

      <form action={formAction} className="mt-10 space-y-7" noValidate>
        {next && <input type="hidden" name="next" value={next} />}

        {errors.form && (
          <p role="alert" className="border-l-2 border-ember bg-ember/8 px-4 py-3 text-sm text-ink">
            {errors.form}
          </p>
        )}

        {mode === "signup" && (
          <Field label="Your name" htmlFor="name" error={errors.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              placeholder="Alex"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
        )}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          hint={mode === "signup" ? "At least 10 characters." : undefined}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? 10 : undefined}
            aria-invalid={Boolean(errors.password)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner />}
          {pending ? "One moment" : mode === "signup" ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-stone">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-ink underline underline-offset-4 hover:text-ember">
              Log in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/signup" className="font-medium text-ink underline underline-offset-4 hover:text-ember">
              Start free
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
