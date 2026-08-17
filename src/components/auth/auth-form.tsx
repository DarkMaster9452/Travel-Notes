"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthState } from "@/app/(auth)/actions";
import { Eyebrow, IconGoogle } from "@/components/field";

type Mode = "login" | "signup";

/**
 * The full-page login and signup forms.
 *
 * Deliberately the same fields, copy and order as the landing page's auth
 * dialog — someone who opened the modal, thought about it, and came back to
 * /signup should find the same form rather than a second one.
 */
export function AuthForm({
  mode,
  action,
}: {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const errors = state?.errors ?? {};

  return (
    <div>
      <Eyebrow>{mode === "signup" ? "Free account" : "Welcome back"}</Eyebrow>
      <h1 className="h2 mt-4">
        {mode === "signup" ? "Start your quest log." : "Pick up where you left off."}
      </h1>
      <p className="lede mt-4 max-w-[38ch] text-[16px]">
        {mode === "signup"
          ? "One free account holds your quests, your history and your sticker sheet. Three real quests, no card."
          : "Your quests, your history and your stickers are where you left them."}
      </p>

      <form action={formAction} className="mt-9 flex flex-col gap-3" noValidate>
        {next && <input type="hidden" name="next" value={next} />}

        {errors.form && (
          <p role="alert" className="form-error">
            {errors.form}
          </p>
        )}

        {mode === "signup" && (
          <>
            <input
              className="input"
              name="name"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              aria-label="First name"
              aria-invalid={errors.name ? true : undefined}
              required
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </>
        )}

        <input
          className="input"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          aria-label="Email"
          aria-invalid={errors.email ? true : undefined}
          required
        />
        {errors.email && <p className="form-error">{errors.email}</p>}

        <input
          className="input"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Password"
          aria-label="Password"
          aria-invalid={errors.password ? true : undefined}
          minLength={mode === "signup" ? 8 : undefined}
          required
        />
        {errors.password && <p className="form-error">{errors.password}</p>}

        <SubmitButton>{mode === "signup" ? "Create account" : "Log in"}</SubmitButton>
      </form>

      <div className="modal-alt">or</div>
      <button className="oauth" type="button" disabled title="Not connected yet">
        <IconGoogle />
        Continue with Google
      </button>

      <p className="swap">
        {mode === "login" ? (
          <>
            No account yet? <Link href="/signup">Create one</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        )}
      </p>
      <p className="note text-center">Google sign-in connects in the auth pass.</p>
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-signal mt-1 w-full" type="submit" disabled={pending}>
      {pending ? "One moment…" : children}
    </button>
  );
}
