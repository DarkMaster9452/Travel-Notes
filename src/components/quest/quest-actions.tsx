"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { toggleCompleteAction, toggleSaveAction } from "@/app/(app)/quest-actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/primitives";

/**
 * Save / complete toggles with optimistic state, falling back to the server's
 * answer (which is the authority) once it responds.
 */
export function SaveQuestButton({
  questId,
  initialSaved,
  variant = "outline",
}: {
  questId: string;
  initialSaved: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      aria-pressed={saved}
      disabled={pending}
      onClick={() => {
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
          const result = await toggleSaveAction(questId);
          if (!result.ok) setSaved(!next);
          else setSaved(Boolean(result.saved));
          router.refresh();
        });
      }}
    >
      {pending ? <Spinner /> : null}
      {saved ? "Saved" : "Save quest"}
    </Button>
  );
}

export function CompleteQuestButton({
  questId,
  initialCompleted,
}: {
  questId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = React.useState(initialCompleted);
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      variant={completed ? "primary" : "outline"}
      size="lg"
      aria-pressed={completed}
      disabled={pending}
      onClick={() => {
        const next = !completed;
        setCompleted(next);
        startTransition(async () => {
          const result = await toggleCompleteAction(questId);
          if (!result.ok) setCompleted(!next);
          else setCompleted(Boolean(result.completed));
          router.refresh();
        });
      }}
    >
      {pending ? <Spinner /> : null}
      {completed ? "Completed ✓" : "Mark completed"}
    </Button>
  );
}
