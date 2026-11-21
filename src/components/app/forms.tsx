"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";

import { useT } from "@/components/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export type ActionResult = { ok: boolean; message?: string };

/**
 * A settings form: submit, wait, say what happened.
 *
 * One shape for every pane. The button swaps label → spinner → check mark
 * rather than disappearing, so the place you were looking does not move while
 * you are looking at it. An error replaces the footer note, in place.
 */
export function SaveForm({
  action,
  children,
  submitLabel,
  footer,
  refreshOnSave = true,
  flush,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel?: string;
  /** A quiet line beside the button: what saving this does. */
  footer?: ReactNode;
  refreshOnSave?: boolean;
  /** The children bring their own padding (a list of rows, edge to edge). */
  flush?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (state === "saving") return;
        const data = new FormData(event.currentTarget);
        setState("saving");
        start(() => {
          void action(data).then((result) => {
            if (!result.ok) {
              setState("idle");
              setError(result.message ?? t.app.form.failed);
              return;
            }
            setError(null);
            setState("done");
            toast(result.message ?? t.app.form.saved);
            if (refreshOnSave) router.refresh();
            window.setTimeout(() => setState("idle"), 1600);
          });
        });
      }}
    >
      <div className={flush ? undefined : "flex flex-col gap-5 p-5"}>{children}</div>
      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p role={error ? "alert" : undefined} className={cn("text-caption", error ? "text-danger" : "text-muted")}>
          {error ?? footer}
        </p>
        <Button type="submit" loading={state === "saving"} className="shrink-0">
          {state === "done" ? <Check aria-hidden="true" /> : null}
          {state === "saving" ? t.common.saving : state === "done" ? t.common.saved : (submitLabel ?? t.common.save)}
        </Button>
      </div>
    </form>
  );
}

/**
 * A labelled switch in a settings list. The value rides in a hidden input as
 * "true" / "false", which is what the settings actions parse.
 */
export function ToggleRow({
  name,
  label,
  description,
  defaultOn,
  tag,
  disabled,
}: {
  name: string;
  label: string;
  description: string;
  defaultOn: boolean;
  /** A plan name beside the label when the plan is why it cannot move. */
  tag?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const [on, setOn] = useState(defaultOn);

  return (
    <li className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 first:border-t-0">
      <label htmlFor={id} className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-body-sm font-semibold text-text">
          {label}
          {tag ? (
            <Badge tone="primary" size="sm">
              {tag}
            </Badge>
          ) : null}
        </span>
        <span className="mt-1 block text-caption text-muted">{description}</span>
      </label>
      <input type="hidden" name={name} value={on ? "true" : "false"} />
      <Switch id={id} checked={on} disabled={disabled} onChange={(event) => setOn(event.target.checked)} />
    </li>
  );
}

/** A dangerous button that asks once, in place, before it does anything. */
export function ConfirmButton({
  action,
  label,
  confirmLabel,
  tone = "quiet",
  onDone,
}: {
  action: () => Promise<ActionResult>;
  label: string;
  /** The specific verb: "Leave the group", not "OK". */
  confirmLabel: string;
  tone?: "quiet" | "danger";
  onDone?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();

  if (!asking) {
    return (
      <Button variant={tone === "danger" ? "dangerQuiet" : "secondary"} onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setAsking(false)} disabled={pending}>
        {t.app.form.keep}
      </Button>
      <Button
        variant="danger"
        size="sm"
        loading={pending}
        onClick={() =>
          start(() => {
            void action().then((result) => {
              setAsking(false);
              toast(
                result.message ?? (result.ok ? t.app.form.done : t.app.form.notDone),
                result.ok ? "success" : "error",
              );
              if (result.ok) {
                router.refresh();
                onDone?.();
              }
            });
          })
        }
      >
        {pending ? t.app.form.working : confirmLabel}
      </Button>
    </span>
  );
}

/**
 * The irreversible forms. They take a typed phrase rather than a click, and
 * report the field error in place: the point of the phrase is that the person
 * reads something before the thing happens.
 */
export function DangerForm({
  action,
  label,
  phrase,
}: {
  action: (formData: FormData) => Promise<{ errors?: Record<string, string>; saved?: boolean } | undefined>;
  label: string;
  phrase: string;
}) {
  const t = useT();
  const id = useId();
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(() => {
          void action(data).then((result) => {
            if (result?.errors) {
              setError(Object.values(result.errors)[0] ?? t.app.form.notThrough);
              return;
            }
            setError(null);
            toast(t.app.form.done);
            router.refresh();
          });
        });
      }}
    >
      <Field label={t.app.form.typePhrase(phrase)} htmlFor={id} error={error} className="sm:w-64">
        <Input id={id} name="confirm" autoComplete="off" aria-invalid={error ? true : undefined} />
      </Field>
      <Button type="submit" variant="danger" loading={pending}>
        {pending ? t.app.form.working : label}
      </Button>
    </form>
  );
}
