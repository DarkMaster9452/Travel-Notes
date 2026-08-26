import type { Metadata } from "next";

import { reviewSubmissionAction, undoReviewAction } from "@/app/admin/actions";
import { SqReviewDeck } from "@/components/sq/review-deck";
import { Tag } from "@/components/sq/ui";
import { getReviewQueue } from "@/lib/admin/review-queue";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Review · Admin" };
export const dynamic = "force-dynamic";

/**
 * The review deck.
 *
 * The queue's order is the product's, not the reader's — see
 * `lib/admin/review-queue` for why that matters. This page only deals the
 * cards; the deck itself owns the drag, the keys and the session log.
 */
export default async function ReviewPage() {
  await requireAdmin();

  const queue = await getReviewQueue();

  return (
    <>
      <header className="sq-head">
        <div className="sq-head-row">
          <div style={{ minWidth: 0 }}>
            <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
              Did they actually go?
            </span>
            <h1 className="sq-h1" style={{ fontSize: 40, maxWidth: "none", marginBottom: 12 }}>
              Review
            </h1>
            <p className="sq-lede" style={{ maxWidth: "58ch" }}>
              One at a time, on the phone. Throw it right to approve, left to decline, or use the
              arrow keys. Approving is what marks the quest done.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {queue.cadenced > 0 ? (
              <Tag tone="stamp" small>
                {queue.cadenced} weekly / monthly
              </Tag>
            ) : null}
            <Tag small>{queue.total} pending</Tag>
          </div>
        </div>
      </header>

      <SqReviewDeck
        cards={queue.cards}
        onDecide={async (id, approve) => {
          "use server";
          return reviewSubmissionAction({ submissionId: id, approve });
        }}
        onUndo={async (id) => {
          "use server";
          return undoReviewAction(id);
        }}
      />
    </>
  );
}
