"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { logQuestAction } from "@/app/(app)/actions";
import { IconApproved, useToast } from "@/components/field";

/**
 * Log a quest as done, or take the log back.
 *
 * Unlocked stickers come back from the server action rather than being worked
 * out here — the thresholds live with the achievement definitions, and a
 * second copy in the browser would drift from them.
 */
export function LogQuestButton({
  questId,
  completed,
}: {
  questId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function submit() {
    if (pending) return;
    setPending(true);

    const result = await logQuestAction(questId).catch(() => null);
    setPending(false);

    if (!result?.ok) {
      toast({
        title: "That didn't go through.",
        detail: result?.error ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }

    if (result.completed) {
      toast({ title: "Logged.", detail: "It won't be issued to you again." });
      for (const sticker of result.unlocked ?? []) {
        toast({ title: `Sticker unlocked — ${sticker.label}`, detail: sticker.description });
      }
    } else {
      toast({ title: "Log removed.", detail: "The quest is open again." });
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={pending}
      className={completed ? "btn btn-ghost" : "btn btn-signal"}
    >
      {!completed && <IconApproved width={16} height={16} />}
      {pending ? "One moment…" : completed ? "Undo the log" : "Log it as done"}
    </button>
  );
}
