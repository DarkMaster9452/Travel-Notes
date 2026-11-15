"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import type { AuthState } from "@/app/(auth)/actions";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field, FieldStack, Input } from "@/components/ui/field";
import { Overline, type } from "@/components/ui/typography";
import { FREE_QUEST_ALLOWANCE } from "@/lib/config";
import { PASSWORD_MIN } from "@/lib/validation";

type Mode = "login" | "signup";

/**
 * The login and signup forms (design/DESIGN-SYSTEM.md §7.2, §12).
 *
 * Labels sit above the fields and an error replaces the hint under the field
 * it belongs to. Everything is validated again on the server; the attributes
 * here only make the form pleasant.
 */
export function AuthForm({
  mode,
  action,
}: {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const t = useT();
  const copy = t.auth[mode];
  const id = useId();
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined);
  const next = useSearchParams().get("next");
  const errors = state?.errors ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Overline>{copy.overline}</Overline>
        <h1 className={type.h1}>{copy.title}</h1>
        <p className="text-body text-muted">
          {mode === "signup" ? t.auth.signup.lede(FREE_QUEST_ALLOWANCE) : t.auth.login.lede}
        </p>
      </div>

      <form action={formAction} noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <FieldStack>
          {errors.form ? (
            <Alert tone="danger" role="alert" title={errors.form} />
          ) : null}

          {mode === "signup" ? (
            <Field label={t.auth.name} htmlFor={`${id}-name`} error={errors.name}>
              <Input
                id={`${id}-name`}
                name="name"
                type="text"
                autoComplete="given-name"
                aria-invalid={errors.name ? true : undefined}
                required
              />
            </Field>
          ) : null}

          <Field label={t.auth.email} htmlFor={`${id}-email`} error={errors.email}>
            <Input
              id={`${id}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              required
            />
          </Field>

          <Field
            label={t.auth.password}
            htmlFor={`${id}-password`}
            error={errors.password}
            hint={mode === "signup" ? t.auth.passwordHint(PASSWORD_MIN) : undefined}
          >
            <Input
              id={`${id}-password`}
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-invalid={errors.password ? true : undefined}
              minLength={mode === "signup" ? PASSWORD_MIN : undefined}
              required
            />
          </Field>

          <Submit pendingLabel={t.auth.pending}>{copy.submit}</Submit>
        </FieldStack>
      </form>

      <p className="text-body-sm text-muted">
        {copy.swap}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="font-medium text-primary underline underline-offset-2"
        >
          {copy.swapLink}
        </Link>
      </p>

      {mode === "signup" ? (
        <p className="text-caption text-subtle">
          {t.auth.terms.before}{" "}
          <Link href="/legal/terms" className="underline underline-offset-2">
            {t.auth.terms.terms}
          </Link>{" "}
          {t.auth.terms.between}{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            {t.auth.terms.privacy}
          </Link>
          {t.auth.terms.after}
        </p>
      ) : null}
    </div>
  );
}

function Submit({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
