"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteQuestAction, toggleQuestPublishedAction } from "@/app/admin/actions";
import { useToast } from "@/components/sq/toast";

/**
 * Publish, unpublish, delete.
 *
 * Separate from the editor because they are not edits: publishing changes who
 * can see a quest, and deleting takes somebody's history with it. Deletion is
 * refused once the quest has been issued — the action says so, and the button
 * says so before it is pressed.
 */
export function SqQuestDangerZone({
  questId,
  issued,
  published,
}: {
  questId: string;
  issued: number;
  published: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();

  return (
    <section
      className="sq-card sq-pad-sm"
      style={{
        borderColor: "var(--line)",
        boxShadow: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h3 className="sq-h2" style={{ fontSize: 18, marginBottom: 6 }}>
          Publishing and deleting
        </h3>
        <p style={{ maxWidth: "58ch", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
          {issued > 0
            ? `Issued to ${issued} ${issued === 1 ? "person" : "people"}, so it cannot be deleted — their history would go with it. Unpublish it instead.`
            : "Nobody holds this one yet, so it can still be deleted outright."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="sq-btn sq-btn-ghost sq-btn-sm"
          disabled={pending}
          onClick={() =>
            start(() => {
              void toggleQuestPublishedAction(questId).then((result) => {
                toast(result.message ?? (result.ok ? "Done." : "That did not work."), result.ok ? "plain" : "stamp");
                router.refresh();
              });
            })
          }
        >
          {published ? "Unpublish" : "Publish"}
        </button>

        {issued === 0 ? (
          asking ? (
            <>
              <button type="button" className="sq-btn sq-btn-ghost sq-btn-sm" onClick={() => setAsking(false)}>
                Keep it
              </button>
              <button
                type="button"
                className="sq-btn sq-btn-stamp sq-btn-sm"
                disabled={pending}
                onClick={() =>
                  start(() => {
                    void deleteQuestAction(questId).then((result) => {
                      if (!result.ok) {
                        toast(result.message ?? "That would not delete.", "stamp");
                        return;
                      }
                      toast("Quest deleted.");
                      router.push("/admin/quests");
                    });
                  })
                }
              >
                Delete for good
              </button>
            </>
          ) : (
            <button type="button" className="sq-btn sq-btn-stamp sq-btn-sm" onClick={() => setAsking(true)}>
              Delete the quest
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}
