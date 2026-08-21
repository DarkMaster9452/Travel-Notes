"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { issueQuestAction, type IssueState } from "@/app/(app)/actions";
import { IconArrowRight, useToast } from "@/components/field";
import { shake } from "@/components/motion/anime";

/**
 * "Issue me one."
 *
 * The single way a quest enters an account. Quota, rate limiting and the
 * no-repeat rule are all decided by the server action — this button only knows
 * how to ask and where to go afterwards.
 *
 * A refusal shakes the button as well as raising the toast. The toast carries
 * the reason, but it appears in the corner of the screen while the reader is
 * looking at the button they just pressed — the shake is what tells them, where
 * they are already looking, that the press was heard and the answer was no.
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
  const button = React.useRef<HTMLButtonElement>(null);

  function refuse(title: string, detail: string) {
    setPending(false);
    shake(button.current);
    toast({ title, detail, tone: "warm" });
  }

  async function issue() {
    if (pending || disabled) return;
    setPending(true);
    let result: IssueState;
    try {
      result = await issueQuestAction();
    } catch {
      refuse("That didn't go through.", "Try again in a moment.");
      return;
    }

    if (result?.ok) {
      // Leave the button spinning through the navigation — flipping it back
      // first shows a ready button on a page that is already leaving.
      router.push(`/quests/${result.questId}`);
      return;
    }

    refuse("No quest issued.", result?.message ?? "Something went wrong.");
  }

  return (
    <button
      ref={button}
      type="button"
      className={className}
      onClick={issue}
      disabled={pending || disabled}
    >
      {pending && <span className="spinner" aria-hidden="true" />}
      {pending ? "Choosing…" : label}
      {!pending && <IconArrowRight />}
    </button>
  );
}
