"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { restoreStickerAction, revokeStickerAction } from "@/app/admin/actions";
import { Modal, Sticker, Tag, useToast } from "@/components/field";

export type AdminSticker = {
  id: string;
  label: string;
  description: string;
  sticker: string;
  earned: boolean;
  planLocked: boolean;
  revoked: boolean;
  progressLabel: string;
};

/**
 * What this account holds, with the ability to take one back.
 *
 * A list rather than the full thirty-sticker sheet: the sheet is the
 * customer's view of what is still to come, and an admin only needs what has
 * actually been earned and what has been withdrawn.
 *
 * A sticker is derived from quest history, so "deleting" one is really
 * recording an exception. That is almost always because the history behind it
 * turned out to be wrong — a submission approved by mistake and since
 * reversed — and the badge would otherwise stand on evidence that no longer
 * exists.
 *
 * Withdrawing asks for a reason. Not for an audit trail nobody reads, but
 * because the next admin to look at this account needs to know whether a
 * missing sticker is a correction or a mistake.
 */
export function AccountStickers({
  userId,
  stickers,
}: {
  userId: string;
  stickers: AdminSticker[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = React.useState<AdminSticker | null>(null);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  // Clear the reason box whenever a different sticker is opened.
  const [lastId, setLastId] = React.useState<string | null>(null);
  if ((target?.id ?? null) !== lastId) {
    setLastId(target?.id ?? null);
    setReason("");
  }

  async function withdraw() {
    if (!target) return;
    setPending(true);
    const result = await revokeStickerAction(userId, target.id, reason.trim() || undefined).catch(
      () => null,
    );
    setPending(false);
    if (!result?.ok) {
      toast({ title: "Not withdrawn.", detail: result?.message, tone: "warm" });
      return;
    }
    toast({ title: "Sticker withdrawn.", detail: target.label });
    setTarget(null);
    router.refresh();
  }

  async function restore(sticker: AdminSticker) {
    setPending(true);
    const result = await restoreStickerAction(userId, sticker.id).catch(() => null);
    setPending(false);
    if (!result?.ok) {
      toast({ title: "Not restored.", detail: result?.message, tone: "warm" });
      return;
    }
    toast({ title: "Sticker restored.", detail: sticker.label });
    router.refresh();
  }

  return (
    <>
      <div className="admin-stickers">
        <ul className="admin-sticker-list">
          {stickers
            .filter((sticker) => sticker.earned || sticker.revoked)
            .map((sticker) => (
              <li key={sticker.id}>
                <Sticker
                  achievementKey={sticker.sticker}
                  locked={sticker.revoked}
                  title={sticker.label}
                  className="admin-sticker-chip"
                />
                <span className="admin-sticker-who">
                  <b>{sticker.label}</b>
                  <em>{sticker.description}</em>
                </span>
                {sticker.revoked ? (
                  <span className="flex items-center gap-2">
                    <Tag tone="warm">Withdrawn</Tag>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={pending}
                      onClick={() => restore(sticker)}
                    >
                      Restore
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setTarget(sticker)}
                  >
                    Withdraw
                  </button>
                )}
              </li>
            ))}
          {stickers.every((sticker) => !sticker.earned && !sticker.revoked) && (
            <li className="admin-sticker-empty">Nothing earned yet.</li>
          )}
        </ul>
      </div>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target ? `Withdraw “${target.label}”?` : ""}
        description="It disappears from their sheet until an admin restores it. Earning it again will not bring it back."
      >
        <div className="modal-form">
          <label className="meta" htmlFor="revoke-reason">
            Why (optional, for the next admin)
          </label>
          <input
            id="revoke-reason"
            className="input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Approved a submission in error, since reversed."
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={pending}
              onClick={withdraw}
            >
              {pending ? "Withdrawing…" : "Withdraw it"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setTarget(null)}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
