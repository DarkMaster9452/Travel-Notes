"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { deleteAccountAction, revokeSessionsAction, updateAccountAction } from "@/app/admin/actions";
import { useToast } from "@/components/field";

/**
 * Full control over one account: role, plan, allowance, sessions, and the
 * account itself. The inline sibling of `AccountEditor` — that one is a quick
 * modal for the list row, this one is the page an admin lands on to actually
 * look at somebody's history, so the same fields live here without a dialog
 * wrapped around them.
 */
export function AccountControls({
  user,
  canDelete,
  blockedReason,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    plan: "FREE" | "EXPLORER" | "ULTRA";
    freeQuestsUsed: number;
    sessions: number;
  };
  /** False when the server would refuse the delete outright — the last admin,
   * or the account you're signed in as. The button still exists, disabled,
   * with the reason, rather than vanishing and leaving the danger zone empty. */
  canDelete: boolean;
  blockedReason?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  async function save(formData: FormData) {
    setPending(true);
    const result = await updateAccountAction(formData).catch(() => null);
    setPending(false);

    if (!result?.ok) {
      toast({ title: "Not saved.", detail: result?.message ?? "Try again in a moment.", tone: "warm" });
      return;
    }
    toast({ title: "Saved." });
    router.refresh();
  }

  async function revoke() {
    const result = await revokeSessionsAction(user.id).catch(() => null);
    toast({
      title: result?.ok ? "Signed out everywhere." : "Couldn't end those sessions.",
      detail: result?.message,
      tone: result?.ok ? "pine" : "warm",
    });
    router.refresh();
  }

  async function remove() {
    setDeleting(true);
    const result = await deleteAccountAction(user.id).catch(() => null);
    setDeleting(false);

    if (!result?.ok) {
      toast({ title: "Not deleted.", detail: result?.message ?? "Try again in a moment.", tone: "warm" });
      return;
    }
    toast({ title: result.message ?? "Account deleted." });
    router.push("/admin/users");
  }

  return (
    <>
      <form action={save} className="flex flex-col gap-5">
        <input type="hidden" name="userId" value={user.id} />

        <div className="admin-grid">
          <div className="admin-field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue={user.role} className="input">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="plan">Plan</label>
            <select id="plan" name="plan" defaultValue={user.plan} className="input">
              <option value="FREE">Free</option>
              <option value="EXPLORER">Explorer €11</option>
              <option value="ULTRA">Ultra €31</option>
            </select>
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="quota">Free quests used</label>
          <input
            id="quota"
            name="freeQuestsUsed"
            type="number"
            min={0}
            max={99}
            defaultValue={user.freeQuestsUsed}
            className="input"
          />
          <p className="note mt-0">
            Set to 0 to hand the allowance back. Ignored while the account is on a paid plan.
          </p>
        </div>

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="mt-5 border-t border-line pt-4">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={revoke}
          disabled={user.sessions === 0}
        >
          {user.sessions === 0 ? "No active sessions" : `Sign out everywhere (${user.sessions})`}
        </button>
      </div>

      <div className="danger-zone">
        <h4>Danger zone</h4>
        <p>
          Deleting this account removes its quest history, submissions, saved quests and
          preferences. This can&rsquo;t be undone.
        </p>

        {!canDelete ? (
          <p className="note text-signal">{blockedReason}</p>
        ) : !confirming ? (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirming(true)}>
            Delete account
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-name" className="note mt-0">
              Type <b>{user.name}</b> to confirm.
            </label>
            <input
              id="confirm-name"
              className="input"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={confirmText !== user.name || deleting}
                onClick={remove}
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setConfirming(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
