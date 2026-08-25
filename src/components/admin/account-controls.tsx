"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import {
  deleteAccountAction,
  moderateProfileAction,
  revokeSessionsAction,
  setAccountPasswordAction,
  updateAccountAction,
} from "@/app/admin/actions";
import { useToast } from "@/components/field";

/**
 * Full control over one account.
 *
 * Four groups, in the order somebody reaches for them: who the account is,
 * what it may do, what its public page says, and the two things that cannot be
 * taken back.
 *
 * Identity is editable because the support request this panel exists to answer
 * is usually "I typed my address wrong" — and the only fix for that used to be
 * deleting the account and losing its history with it.
 *
 * The inline sibling of `AccountEditor`, which is the quick version in the
 * list. This is the page an admin lands on to actually look at somebody, so
 * the same fields live here without a dialog wrapped around them, plus the
 * ones too heavy for a row: the password, the profile, the delete.
 */
export function AccountControls({
  user,
  canDelete,
  blockedReason,
  isSelf,
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
    /** Null when they have never set one up. */
    profile: { handle: string; published: boolean } | null;
  };
  /** False when the server would refuse the delete outright — the last admin,
   * or the account you're signed in as. The button still exists, disabled,
   * with the reason, rather than vanishing and leaving the danger zone empty. */
  canDelete: boolean;
  blockedReason?: string;
  /**
   * True when this is the admin's own account. The server refuses a password
   * change on it either way — doing it would sign you out of the panel you did
   * it from — so the tool says why instead of offering a button that fails.
   */
  isSelf?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [settingPassword, setSettingPassword] = React.useState(false);

  const report = React.useCallback(
    (result: { ok: boolean; message?: string } | null, fallback: string) => {
      toast({
        title: result?.ok ? (result.message ?? fallback) : "Not done.",
        detail: result?.ok ? undefined : (result?.message ?? "Try again in a moment."),
        tone: result?.ok ? "pine" : "warm",
      });
      router.refresh();
      return Boolean(result?.ok);
    },
    [router, toast],
  );

  async function save(formData: FormData) {
    setPending(true);
    const result = await updateAccountAction(formData).catch(() => null);
    setPending(false);
    report(result, "Saved.");
  }

  async function revoke() {
    const result = await revokeSessionsAction(user.id).catch(() => null);
    report(result, "Signed out everywhere.");
  }

  async function setNewPassword() {
    setSettingPassword(true);
    const result = await setAccountPasswordAction(user.id, password).catch(() => null);
    setSettingPassword(false);
    if (report(result, "Password set.")) setPassword("");
  }

  async function moderate(change: {
    published?: boolean;
    clearHeadline?: boolean;
    clearBio?: boolean;
  }) {
    const result = await moderateProfileAction(user.id, change).catch(() => null);
    report(result, "Profile updated.");
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
    toast({ title: result.message ?? "Account deleted." });
    router.push("/admin/users");
  }

  return (
    <>
      <form action={save} className="flex flex-col gap-5">
        <input type="hidden" name="userId" value={user.id} />

        <div className="admin-grid">
          <div className="admin-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              defaultValue={user.name}
              maxLength={80}
              required
              className="input"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              maxLength={160}
              required
              className="input"
            />
          </div>
        </div>

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

          <div className="admin-field">
            <label htmlFor="theme">Palette</label>
            <select id="theme" name="theme" defaultValue={user.theme} className="input">
              <option value="SYSTEM">Follow device</option>
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
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

      {/* The public page, if they have one. Unpublishing is the tool this
          panel was missing: free text on a page every signed-in account can
          read, and nothing short of deleting the account to deal with it. */}
      <div className="mt-5 border-t border-line pt-4">
        <h4 className="admin-subhead">Public profile</h4>
        {!user.profile ? (
          <p className="note mt-0">This account has never set one up.</p>
        ) : (
          <>
            <p className="note mt-0">
              <b>/people/{user.profile.handle}</b> —{" "}
              {user.profile.published ? "visible to every signed-in account." : "hidden."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void moderate({ published: !user.profile!.published })}
              >
                {user.profile.published ? "Hide the profile" : "Publish the profile"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void moderate({ clearHeadline: true })}
              >
                Clear the headline
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void moderate({ clearBio: true })}
              >
                Clear the bio
              </button>
            </div>
          </>
        )}
      </div>

      {/* There is no email in this product, so "I am locked out" has had no
          answer at all. This is it, and it is deliberately blunt. */}
      <div className="mt-5 border-t border-line pt-4">
        <h4 className="admin-subhead">Set a new password</h4>
        {isSelf ? (
          <p className="note mt-0">
            This is your own account — change it in settings. Doing it here would sign you out of
            the panel.
          </p>
        ) : (
          <>
            <p className="note mt-0">
              Replaces the password and signs the account out everywhere. Tell them what it is —
              nothing here emails it.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                className="input max-w-[280px]"
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least ten characters"
                autoComplete="off"
                aria-label="New password"
              />
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={password.trim().length < 10 || settingPassword}
                onClick={() => void setNewPassword()}
              >
                {settingPassword ? "Setting…" : "Set password"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="danger-zone">
        <h4>Danger zone</h4>
        <p>
          Deleting this account removes its quest history, submissions, saved quests, profile and
          preferences. This can&rsquo;t be undone.
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
