"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Glyph } from "@/components/sq/icons";
import { useToast } from "@/components/sq/toast";

export type ActionResult = { ok: boolean; message?: string };

/**
 * A settings form.
 *
 * One shape for every pane: submit, wait, say what happened. The button swaps
 * label → spinner → check mark rather than disappearing, so the place you were
 * looking does not move while you are looking at it.
 */
export function SqSaveForm({
  action,
  children,
  submitLabel = "Save",
  footer,
  refreshOnSave = true,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  footer?: React.ReactNode;
  refreshOnSave?: boolean;
}) {
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
              setError(result.message ?? "That would not save.");
              return;
            }
            setError(null);
            setState("done");
            toast(result.message ?? "Saved.");
            if (refreshOnSave) router.refresh();
            window.setTimeout(() => setState("idle"), 1600);
          });
        });
      }}
    >
      {children}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "14px 24px",
          borderTop: "1px solid var(--line-2)",
          background: "var(--paper-2)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: error ? "var(--signal)" : "var(--ink-2)" }}>
          {error ?? footer}
        </span>
        <button type="submit" className="sq-btn sq-btn-primary sq-btn-sm" disabled={state === "saving"}>
          {state === "idle" ? submitLabel : state === "saving" ? "Saving…" : <Glyph name="check" size={16} />}
        </button>
      </div>
    </form>
  );
}

/** A labelled switch in a settings list. The value rides in a hidden input. */
export function SqToggleRow({
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
  tag?: string;
  disabled?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) auto",
        gap: 18,
        alignItems: "center",
        padding: "15px 24px",
        borderTop: "1px solid var(--line-2)",
      }}
    >
      <span style={{ minWidth: 0 }}>
        <b style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, fontWeight: 600 }}>
          {label}
          {tag ? (
            <span className="sq-tag sq-tag-xs" style={{ fontSize: 9, letterSpacing: "0.07em" }}>
              {tag}
            </span>
          ) : null}
        </b>
        <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
          {description}
        </span>
      </span>
      <input type="hidden" name={name} value={on ? "true" : "false"} />
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className="sq-switch"
        disabled={disabled}
        style={disabled ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
        onClick={() => setOn((value) => !value)}
      >
        <i />
      </button>
    </li>
  );
}

/** A dangerous button that asks once, in place, before it does anything. */
export function SqConfirmButton({
  action,
  label,
  confirmLabel,
  tone = "outline",
  onDone,
}: {
  action: () => Promise<ActionResult>;
  label: string;
  confirmLabel: string;
  tone?: "outline" | "stamp";
  onDone?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();

  if (!asking) {
    return (
      <button
        type="button"
        className={`sq-btn ${tone === "stamp" ? "sq-btn-stamp" : "sq-btn-outline"}`}
        onClick={() => setAsking(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        type="button"
        className="sq-btn sq-btn-ghost sq-btn-sm"
        onClick={() => setAsking(false)}
        disabled={pending}
      >
        Keep it
      </button>
      <button
        type="button"
        className={`sq-btn sq-btn-sm ${tone === "stamp" ? "sq-btn-stamp" : "sq-btn-outline"}`}
        disabled={pending}
        onClick={() =>
          start(() => {
            void action().then((result) => {
              setAsking(false);
              toast(result.message ?? (result.ok ? "Done." : "That didn't work."), result.ok ? "plain" : "stamp");
              if (result.ok) {
                router.refresh();
                onDone?.();
              }
            });
          })
        }
      >
        {pending ? "Working…" : confirmLabel}
      </button>
    </span>
  );
}

/**
 * The two irreversible forms.
 *
 * They take a typed phrase rather than a click, and they report the field
 * error in place: the whole point of the phrase is that the person reads
 * something before the thing happens.
 */
export function SqDangerForm({
  action,
  label,
  phrase,
}: {
  action: (formData: FormData) => Promise<{ errors?: Record<string, string>; saved?: boolean } | undefined>;
  label: string;
  phrase: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(() => {
          void action(data).then((result) => {
            if (result?.errors) {
              setError(Object.values(result.errors)[0] ?? "That did not go through.");
              return;
            }
            setError(null);
            toast("Done.");
            router.refresh();
          });
        });
      }}
    >
      <label className="sq-field" style={{ minWidth: 220 }}>
        <span className="sq-label">Type {phrase}</span>
        <input className="sq-input" name="confirm" autoComplete="off" />
        {error ? <span className="sq-error">{error}</span> : null}
      </label>
      <button type="submit" className="sq-btn sq-btn-stamp" disabled={pending}>
        {pending ? "Working…" : label}
      </button>
    </form>
  );
}
