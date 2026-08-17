"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { issueQuestAction, type IssueState } from "@/app/(app)/actions";
import { IconArrowRight, useToast } from "@/components/field";

/**
 * "Issue me one."
 *
 * The single way a quest enters an account. Quota, rate limiting and the
 * no-repeat rule are all decided by the server action — this button only knows
 * how to ask and where to go afterwards.
 */
export function IssueQuestButton({
  disabled,
  label = "Issue me a quest",
  className = "btn btn-signal",
}: {
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function issue() {
    if (pending || disabled) return;
    setPending(true);
    let result: IssueState;
    try {
      result = await issueQuestAction();
    } catch {
      setPending(false);
      toast({ title: "That didn't go through.", detail: "Try again in a moment.", tone: "warm" });
      return;
    }

    if (result?.ok) {
      // Leave the button spinning through the navigation — flipping it back
      // first shows a ready button on a page that is already leaving.
      router.push(`/quests/${result.questId}`);
      return;
    }

    setPending(false);
    toast({
      title: "No quest issued.",
      detail: result?.message ?? "Something went wrong.",
      tone: "warm",
    });
  }

  return (
    <button type="button" className={className} onClick={issue} disabled={pending || disabled}>
      {pending ? "Choosing…" : label}
      {!pending && <IconArrowRight />}
    </button>
  );
}
