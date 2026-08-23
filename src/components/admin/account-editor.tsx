"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { deleteAccountAction, revokeSessionsAction, updateAccountAction } from "@/app/admin/actions";
import { Modal, useToast } from "@/components/field";

/**
 * Editing one account from the list.
 *
 * Everything that decides who an account is and what it may do — name, email,
 * role, plan, palette, allowance — plus the two irreversible ones behind their
 * own confirmations. The full page at `/admin/users/[id]` adds what only makes
 * sense next to somebody's history: their profile, their password, their
 * submissions.
 *
 * Delete lives here as well as there because the row is where an admin is
 * standing when they decide an account is a duplicate or a bot, and making
 * them open a page to act on that was the difference between doing it and
 * meaning to. It still asks for the name to be typed out: the confirmation is
 * the safety, not the distance.
 */
export function AccountEditor({
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
    theme: "SYSTEM" | "LIGHT" | "DARK";
    sessions: number;
  };
  /** False when the server would refuse — the last admin, or you. */
  canDelete: boolean;
  blockedReason?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  function close() {
    setOpen(false);
    setConfirming(false);
    setConfirmText("");
  }

  async function save(formData: FormData) {
    setPending(true);
    const result = await updateAccountAction(formData).catch(() => null);
    setPending(false);

    if (!result?.ok) {
      toast({
        title: "Not saved.",
        detail: result?.message ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }
    close();
    toast({ title: `${user.name} updated.` });
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
      toast({
        title: "Not deleted.",
        detail: result?.message ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }
    close();
    toast({ title: result.message ?? "Account deleted." });
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Manage
      </button>

      <Modal
        open={open}
        onClose={close}
        title={user.name}
        description={user.email}
        className="max-w-[480px]"
      >
        <form action={save} className="mt-5 flex flex-col gap-5">
          <input type="hidden" name="userId" value={user.id} />

          <div className="admin-field">
            <label htmlFor={`name-${user.id}`}>Name</label>
            <input
              id={`name-${user.id}`}
              name="name"
              defaultValue={user.name}
              maxLength={80}
              required
              className="input"
            />
          </div>

          <div className="admin-field">
            <label htmlFor={`email-${user.id}`}>Email</label>
            <input
              id={`email-${user.id}`}
              name="email"
              type="email"
              defaultValue={user.email}
              maxLength={160}
              required
              className="input"
            />
            <p className="note mt-0">
              This is what they sign in with. Changing it does not sign them out.
            </p>
          </div>

          <div className="admin-grid">
            <div className="admin-field">
              <label htmlFor={`role-${user.id}`}>Role</label>
              <select id={`role-${user.id}`} name="role" defaultValue={user.role} className="input">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor={`plan-${user.id}`}>Plan</label>
              <select id={`plan-${user.id}`} name="plan" defaultValue={user.plan} className="input">
                <option value="FREE">Free</option>
                <option value="EXPLORER">Explorer €11</option>
                <option value="ULTRA">Ultra €31</option>
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor={`theme-${user.id}`}>Palette</label>
              <select
                id={`theme-${user.id}`}
                name="theme"
                defaultValue={user.theme}
                className="input"
              >
                <option value="SYSTEM">Device</option>
                <option value="LIGHT">Light</option>
                <option value="DARK">Dark</option>
              </select>
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor={`quota-${user.id}`}>Free quests used</label>
            <input
              id={`quota-${user.id}`}
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

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={revoke}
            disabled={user.sessions === 0}
          >
            {user.sessions === 0 ? "No active sessions" : `Sign out everywhere (${user.sessions})`}
          </button>
          <a href={`/admin/users/${user.id}`} className="btn btn-ghost btn-sm">
            Open the full record
          </a>
        </div>

        <div className="danger-zone">
          <h4>Danger zone</h4>
          <p>
            Deleting removes this account&rsquo;s history, submissions, profile and preferences.
            This can&rsquo;t be undone.
          </p>

          {!canDelete ? (
            <p className="note text-signal">{blockedReason}</p>
          ) : !confirming ? (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setConfirming(true)}
            >
              Delete account
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor={`confirm-${user.id}`} className="note mt-0">
                Type <b>{user.name}</b> to confirm.
              </label>
              <input
                id={`confirm-${user.id}`}
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
      </Modal>
    </>
  );
}
