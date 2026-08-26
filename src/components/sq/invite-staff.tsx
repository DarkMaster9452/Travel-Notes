"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { inviteStaffAction, revokeInviteAction } from "@/app/admin/actions";
import { SqModal } from "@/components/sq/modal";
import { useToast } from "@/components/sq/toast";

/**
 * Invite somebody to the desk.
 *
 * The link is shown after the invitation is written, whether or not email is
 * configured — a desk that cannot send mail can still paste a link into
 * whatever it already uses to talk to people, and hiding it would make a
 * working feature look broken on a deployment without a mailer.
 */
export function SqInviteStaff({
  roles,
  label = "Invite a reader",
}: {
  /** The roles this account may hand out, from `invitableBy`. */
  roles: { value: string; label: string; what: string }[];
  label?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (roles.length === 0) return null;

  return (
    <>
      <button type="button" className="sq-btn sq-btn-primary" onClick={() => setOpen(true)}>
        {label}
      </button>

      {open ? (
        <SqModal
          title={link ? "Invitation written" : "Invite somebody to the desk"}
          onClose={() => {
            setOpen(false);
            setLink(null);
            setError(null);
          }}
        >
          {link ? (
            <>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)", marginBottom: 14 }}>
                They have been emailed if a mailer is configured here. Either way, this link only
                works for the address it was written to, and only once.
              </p>
              <p
                className="sq-mono"
                style={{
                  fontSize: 11.5,
                  wordBreak: "break-all",
                  background: "var(--paper-2)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 16,
                }}
              >
                {link}
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="sq-btn sq-btn-ghost sq-btn-sm"
                  onClick={() => {
                    void navigator.clipboard
                      ?.writeText(link)
                      .then(() => toast("Invitation link copied."))
                      .catch(() => toast("The clipboard refused — select the link instead.", "stamp"));
                  }}
                >
                  Copy the link
                </button>
                <button
                  type="button"
                  className="sq-btn sq-btn-primary sq-btn-sm"
                  onClick={() => {
                    setOpen(false);
                    setLink(null);
                  }}
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                start(() => {
                  void inviteStaffAction(data).then((result) => {
                    if (!result.ok) {
                      setError(result.message ?? "That invitation would not save.");
                      return;
                    }
                    setError(null);
                    setLink(result.link ?? null);
                    toast(result.message ?? "Invited.");
                    router.refresh();
                  });
                });
              }}
            >
              <label className="sq-field" style={{ marginBottom: 14 }}>
                <span className="sq-label">Email address</span>
                <input className="sq-input" name="email" type="email" required autoComplete="off" />
              </label>

              <fieldset style={{ border: 0, padding: 0, margin: "0 0 18px" }}>
                <legend className="sq-label" style={{ marginBottom: 8 }}>
                  Role
                </legend>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {roles.map((role, index) => (
                    <label
                      key={role.value}
                      style={{
                        display: "flex",
                        gap: 11,
                        alignItems: "flex-start",
                        padding: "11px 13px",
                        borderRadius: 8,
                        background: "var(--paper-2)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        defaultChecked={index === 0}
                        style={{ marginTop: 3 }}
                      />
                      <span>
                        <b style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>{role.label}</b>
                        <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>
                          {role.what}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {error ? <p className="sq-error" style={{ marginBottom: 12 }}>{error}</p> : null}

              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)", marginBottom: 16 }}>
                Nobody is made an owner from here. That one happens at a database prompt, on
                purpose.
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="sq-btn sq-btn-ghost sq-btn-sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sq-btn sq-btn-primary sq-btn-sm" disabled={pending}>
                  {pending ? "Inviting…" : "Send the invitation"}
                </button>
              </div>
            </form>
          )}
        </SqModal>
      ) : null}
    </>
  );
}

/** Re-issue or withdraw an invitation that has not been claimed. */
export function SqInviteRow({ email, link }: { email: string; link: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  return (
    <span style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
      <button
        type="button"
        className="sq-btn sq-btn-ghost sq-btn-sm"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(link)
            .then(() => toast("Invitation link copied."))
            .catch(() => toast("The clipboard refused.", "stamp"));
        }}
      >
        Copy link
      </button>
      <button
        type="button"
        className="sq-btn sq-btn-stamp sq-btn-sm"
        disabled={pending}
        onClick={() =>
          start(() => {
            void revokeInviteAction(email).then((result) => {
              toast(result.message ?? (result.ok ? "Withdrawn." : "That did not work."), result.ok ? "plain" : "stamp");
              router.refresh();
            });
          })
        }
      >
        Withdraw
      </button>
    </span>
  );
}
