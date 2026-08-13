"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";

import { surpriseMeAction, unlockQuestAction, type UnlockState } from "@/app/(app)/database/actions";
import { IconArrowRight, IconCompass, IconSparkle } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Unlocking a quest is the one place quota is spent, so both entry points go
 * through the same server action and the same success path: on success the
 * reader is taken straight to the quest, with `?celebrate=unlocked` so the page
 * knows to run the arrival animation.
 */

function useUnlockRedirect(state: UnlockState) {
  const router = useRouter();
  const handled = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!state?.ok) return;
    // Guard against re-running for the same result if the effect re-fires.
    if (handled.current === state.questId) return;
    handled.current = state.questId;
    router.push(`/quests/${state.questId}?celebrate=unlocked`);
  }, [state, router]);
}

/** "Surprise Me" — unlocks a place the reader hasn't been sent to yet. */
export function SurpriseMeBar({ disabled }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState<UnlockState>(surpriseMeAction, undefined);
  useUnlockRedirect(state);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-card px-5 py-4"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper"
      >
        <IconCompass size={22} />
      </span>

      <div className="min-w-[14rem] flex-1">
        <p className="text-sm font-semibold text-ink">Not sure where to go?</p>
        <p className="text-sm text-muted">
          {state && !state.ok
            ? state.message
            : "Let us pick somewhere you haven't been yet."}
        </p>
      </div>

      <button
        type="submit"
        disabled={disabled || pending}
        className={cn(
          "flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold text-paper transition-colors",
          "hover:bg-moss disabled:pointer-events-none disabled:opacity-45",
        )}
      >
        {pending ? <Spinner /> : <IconSparkle size={16} />}
        {pending ? "Finding one" : "Surprise Me"}
      </button>
    </form>
  );
}

/** Unlock one specific catalogue place. */
export function UnlockQuestButton({
  locationId,
  label = "Start quest",
  disabled,
  className,
}: {
  locationId: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(
    unlockQuestAction,
    undefined,
  );
  useUnlockRedirect(state);

  return (
    <form action={formAction} className={cn("flex flex-col items-end gap-1", className)}>
      <input type="hidden" name="locationId" value={locationId} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-ink px-4 text-xs font-semibold whitespace-nowrap text-paper transition-colors hover:bg-moss disabled:pointer-events-none disabled:opacity-45"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Unlocking" : label}
        {!pending && <IconArrowRight size={14} />}
      </button>
      {state && !state.ok && (
        <p role="alert" className="max-w-[16rem] text-right text-xs text-ember">
          {state.message}
        </p>
      )}
    </form>
  );
}
