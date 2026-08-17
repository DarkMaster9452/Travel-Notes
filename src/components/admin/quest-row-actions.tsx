"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { deleteQuestAction, toggleQuestPublishedAction } from "@/app/admin/actions";
import { useToast } from "@/components/field";

/** Publish, unpublish, delete — the three things a quest row can be told. */
export function QuestRowActions({
  questId,
  published,
  issued,
}: {
  questId: string;
  published: boolean;
  issued: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setPending(true);
    const result = await fn().catch(() => null);
    setPending(false);
    toast({
      title: result?.ok ? (result.message ?? "Done.") : "Not done.",
      detail: result?.ok ? undefined : result?.message,
      tone: result?.ok ? "pine" : "warm",
    });
    router.refresh();
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={pending}
        onClick={() => run(() => toggleQuestPublishedAction(questId))}
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      {issued === 0 && (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={pending}
          onClick={() => run(() => deleteQuestAction(questId))}
        >
          Delete
        </button>
      )}
    </span>
  );
}
