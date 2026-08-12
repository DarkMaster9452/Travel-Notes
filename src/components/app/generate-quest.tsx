"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The generate button and its loading theatre.
 *
 * The overlay isn't decoration for its own sake: generation is fast, and the
 * staged lines are what make the wait feel like the machine is doing something
 * on your behalf — including the line about avoiding your previous quests,
 * which is literally what the engine is doing.
 */

const STAGES = [
  "Checking forests",
  "Finding viewpoints",
  "Mixing difficulty",
  "Avoiding your previous quests",
  "Building your adventure",
];

const STAGE_MS = 620;

type Failure = { code: string; message: string };

export function GenerateQuest({
  disabled = false,
  label = "Generate quest",
  variant = "primary",
  size = "xl",
  className,
}: {
  disabled?: boolean;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [running, setRunning] = React.useState(false);
  const [stage, setStage] = React.useState(0);
  const [failure, setFailure] = React.useState<Failure | null>(null);

  React.useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setStage((s) => Math.min(STAGES.length - 1, s + 1)),
      STAGE_MS,
    );
    return () => window.clearInterval(timer);
  }, [running]);

  async function generate() {
    if (running) return;
    setFailure(null);
    setStage(0);
    setRunning(true);

    const startedAt = Date.now();

    try {
      const response = await fetch("/api/quests/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        if (data.code === "quota_exhausted") {
          router.push("/upgrade");
          return;
        }
        setRunning(false);
        setFailure({
          code: data.code ?? "unknown",
          message: data.message ?? "We couldn't find an adventure right now. Try again.",
        });
        return;
      }

      // Let the sequence finish so the reveal doesn't snap past it.
      const minimum = reduced ? 0 : STAGES.length * STAGE_MS;
      const wait = Math.max(0, minimum - (Date.now() - startedAt));
      window.setTimeout(() => {
        router.push(`/quests/${data.questId}?new=1`);
        // Layouts are cached across client navigations, so the remaining-quota
        // counter in the shell would otherwise still show the old number.
        router.refresh();
      }, wait);
    } catch {
      setRunning(false);
      setFailure({
        code: "network",
        message: "We couldn't reach the mountain. Check your connection and try again.",
      });
    }
  }

  return (
    <>
      <div className={cn("flex flex-col gap-3", className)}>
        <Button
          type="button"
          onClick={generate}
          variant={variant}
          size={size}
          disabled={disabled || running}
          className="w-full sm:w-auto"
        >
          {label}
          <span aria-hidden="true">→</span>
        </Button>

        {failure && (
          <p role="alert" className="border-l-2 border-ember pl-4 text-sm text-ink">
            {failure.message}
          </p>
        )}
      </div>

      <AnimatePresence>
        {running && (
          <motion.div
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-ink px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className="w-full max-w-lg">
              <p className="kicker text-ember-light">Searching for something new</p>

              <ul className="mt-10 space-y-4">
                {STAGES.map((text, index) => {
                  const done = index < stage;
                  const active = index === stage;
                  return (
                    <li
                      key={text}
                      className={cn(
                        "flex items-center gap-4 font-display text-2xl font-extrabold uppercase transition-all duration-500 sm:text-3xl",
                        done && "text-paper/35",
                        active && "text-paper",
                        !done && !active && "text-paper/15",
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 transition-colors",
                          done ? "bg-paper/35" : active ? "bg-ember-light" : "bg-paper/15",
                        )}
                        aria-hidden="true"
                      />
                      {text}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-12 h-0.5 w-full overflow-hidden bg-paper/15">
                <motion.div
                  className="h-full bg-ember-light"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
