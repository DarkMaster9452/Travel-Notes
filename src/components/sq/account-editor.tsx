"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteAccountAction,
  revokeSessionsAction,
  setAccountPasswordAction,
  updateAccountAction,
} from "@/app/admin/actions";
import { useToast } from "@/components/sq/toast";

/**
 * Everything an admin can change about one account, in one write.
 *
 * Scattering these across four small forms would mean four confirmations for
 * what is usually one support request. The two destructive buttons are
 * separate because they are separate decisions, and both ask first.
 */
export function SqAccountEditor({
  account,
}: {
  account: {
    id: string;
    name: string;
    email: string;
    plan: string;
    freeQuestsUsed: number;
    theme: string;
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState<"none" | "delete">("none");

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div className="sq-section-head sq-rule-head">
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          Manage the account
        </h2>
        <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
          One write
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          data.set("userId", account.id);
          start(() => {
            void updateAccountAction(data).then((result) => {
              if (!result.ok) {
                setError(result.message ?? "That would not save.");
                return;
              }
              setError(null);
              toast("Account updated.");
              router.refresh();
            });
          });
        }}
      >
        <div style={{ padding: "18px 22px", display: "grid", gap: 14 }}>
          <label className="sq-field">
            <span className="sq-label">Name</span>
            <input className="sq-input" name="name" defaultValue={account.name} maxLength={80} required />
          </label>
          <label className="sq-field">
            <span className="sq-label">Email</span>
            <input className="sq-input" name="email" type="email" defaultValue={account.email} required />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
            <label className="sq-field">
              <span className="sq-label">Plan</span>
              <select className="sq-select" name="plan" defaultValue={account.plan}>
                <option value="FREE">Free</option>
                <option value="EXPLORER">Explorer</option>
                <option value="ULTRA">Ultra</option>
              </select>
            </label>
            <label className="sq-field">
              <span className="sq-label">Free quests used</span>
              <input
                className="sq-input"
                name="freeQuestsUsed"
                type="number"
                min={0}
                max={99}
                defaultValue={account.freeQuestsUsed}
              />
            </label>
            <label className="sq-field">
              <span className="sq-label">Palette</span>
              <select className="sq-select" name="theme" defaultValue={account.theme}>
                <option value="SYSTEM">System</option>
                <option value="LIGHT">Paper</option>
                <option value="DARK">Forest</option>
              </select>
            </label>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "14px 22px",
            borderTop: "1px solid var(--line-2)",
            background: "var(--paper-2)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12.5, color: error ? "var(--signal)" : "var(--ink-2)" }}>
            {error ??
              "A plan set here is a real subscription row — the gate reads one place only. Roles are changed on Panel access."}
          </span>
          <button type="submit" className="sq-btn sq-btn-primary sq-btn-sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          start(() => {
            void setAccountPasswordAction(account.id, String(data.get("password") ?? "")).then((result) => {
              toast(result.ok ? "Password set. Every session was ended." : (result.message ?? "That would not set."), result.ok ? "plain" : "stamp");
              if (result.ok) router.refresh();
            });
          });
        }}
        style={{ padding: "18px 22px", borderTop: "1px solid var(--line-2)", display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <label className="sq-field" style={{ flex: 1, minWidth: 200 }}>
          <span className="sq-label">Set a new password</span>
          <input className="sq-input" name="password" type="text" autoComplete="off" minLength={10} />
        </label>
        <button type="submit" className="sq-btn sq-btn-outline sq-btn-sm" disabled={pending}>
          Set it
        </button>
      </form>

      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "18px 22px",
          borderTop: "1px solid var(--line-2)",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="sq-btn sq-btn-ghost sq-btn-sm"
          disabled={pending}
          onClick={() =>
            start(() => {
              void revokeSessionsAction(account.id).then((result) => {
                toast(result.ok ? "Signed out everywhere." : (result.message ?? "That did not work."), result.ok ? "plain" : "stamp");
                router.refresh();
              });
            })
          }
        >
          Sign out everywhere
        </button>

        {confirming === "delete" ? (
          <>
            <button type="button" className="sq-btn sq-btn-ghost sq-btn-sm" onClick={() => setConfirming("none")}>
              Keep it
            </button>
            <button
              type="button"
              className="sq-btn sq-btn-stamp sq-btn-sm"
              disabled={pending}
              onClick={() =>
                start(() => {
                  void deleteAccountAction(account.id).then((result) => {
                    if (!result.ok) {
                      toast(result.message ?? "That would not delete.", "stamp");
                      return;
                    }
                    toast("Account deleted.");
                    router.push("/admin/users");
                  });
                })
              }
            >
              Delete for good
            </button>
          </>
        ) : (
          <button type="button" className="sq-btn sq-btn-stamp sq-btn-sm" onClick={() => setConfirming("delete")}>
            Delete the account
          </button>
        )}
      </div>
    </section>
  );
}
