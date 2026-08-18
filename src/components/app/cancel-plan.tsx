"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { cancelPlanAction } from "@/app/(app)/actions";
import { Modal, useToast } from "@/components/field";
import { REFUND_WINDOW_DAYS } from "@/lib/config";

/**
 * Cancelling, and the guarantee that goes with it.
 *
 * The dialog says which of the two outcomes applies *before* the press, not
 * after: inside the first week the money comes back and access ends now;
 * after it, access runs to the end of the period already paid for. A cancel
 * button that doesn't say which one you are about to get is the reason people
 * don't press it.
 */
export function CancelPlan({
  planName,
  /** True while the account is still inside the money-back window. */
  refundable,
  /** When the guarantee runs out, already formatted. */
  refundDeadline,
  /** End of the paid period, already formatted. */
  periodEnd,
}: {
  planName: string;
  refundable: boolean;
  refundDeadline: string | null;
  periodEnd: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function confirm() {
    setPending(true);
    const result = await cancelPlanAction().catch(() => null);
    setPending(false);

    if (!result?.ok) {
      toast({
        title: "Not cancelled.",
        detail: result?.message ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }

    setOpen(false);
    toast({
      title: result.refunded ? "Cancelled and refunded." : "Cancelled.",
      detail: result.message,
    });
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Cancel plan
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={refundable ? "Cancel and get your money back?" : `Cancel ${planName}?`}
        description={
          refundable
            ? `You're still inside the ${REFUND_WINDOW_DAYS}-day guarantee${
                refundDeadline ? ` — it runs until ${refundDeadline}` : ""
              }. Cancelling now refunds this period in full, and access ends straight away.`
            : periodEnd
              ? `You keep ${planName} until ${periodEnd}. Nothing is charged after that, and nothing is taken back before it.`
              : `You keep ${planName} until the end of the period you've paid for.`
        }
      >
        <div className="modal-form">
          <ul className="cancel-points">
            <li>Your history, stickers and logged quests stay exactly as they are.</li>
            <li>
              {refundable
                ? "The charge for this period is refunded to the card that paid it."
                : "No further charges. You are not billed again."}
            </li>
            <li>You can subscribe again whenever you like, at the price on the day.</li>
          </ul>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={pending}
              onClick={confirm}
            >
              {pending
                ? "Cancelling…"
                : refundable
                  ? "Cancel and refund"
                  : "Cancel at period end"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Keep my plan
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
