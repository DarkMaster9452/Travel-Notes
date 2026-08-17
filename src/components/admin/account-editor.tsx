"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { revokeSessionsAction, updateAccountAction } from "@/app/admin/actions";
import { Modal, useToast } from "@/components/field";

/**
 * Editing one account.
 *
 * Role, plan and remaining allowance — the three things that decide what an
 * account can do. The plan is written as a real subscription row, so the
 * gating matrix keeps reading from one place and an admin grant is
 * indistinguishable from a Stripe one.
 */
export function AccountEditor({
  user,
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
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

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
    setOpen(false);
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

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Manage
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={user.name}
        description={user.email}
        className="max-w-[440px]"
      >
        <form action={save} className="mt-5 flex flex-col gap-5">
          <input type="hidden" name="userId" value={user.id} />

          <div className="admin-grid">
            <div className="admin-field">
              <label htmlFor={`role-${user.id}`}>Role</label>
              <select
                id={`role-${user.id}`}
                name="role"
                defaultValue={user.role}
                className="input"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor={`plan-${user.id}`}>Plan</label>
              <select
                id={`plan-${user.id}`}
                name="plan"
                defaultValue={user.plan}
                className="input"
              >
                <option value="FREE">Free</option>
                <option value="EXPLORER">Explorer €11</option>
                <option value="ULTRA">Ultra €31</option>
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

        <div className="mt-4 border-t border-line pt-4">
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={revoke}
            disabled={user.sessions === 0}
          >
            {user.sessions === 0
              ? "No active sessions"
              : `Sign out everywhere (${user.sessions})`}
          </button>
        </div>
      </Modal>
    </>
  );
}
