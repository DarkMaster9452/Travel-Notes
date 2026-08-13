"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { useActionState } from "react";

import type { OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { PlaceCombobox } from "@/components/ui/place-combobox";
import { Spinner } from "@/components/ui/primitives";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Two questions, one screen each: where you start from, and how hard you want
 * it. Everything else the generator needs is inferred from the difficulty
 * answer on the server and stays editable in settings — signing up shouldn't
 * feel like filling in a form at the doctor's.
 *
 * Answers live in local state and are submitted once at the end, so an
 * abandoned onboarding never writes half a set of preferences.
 */

const DIFFICULTIES = [
  {
    value: "EASY",
    label: "Easy",
    hint: "A walk, not a workout. Gentle ground and short days.",
    detail: "Up to ~6 km",
    icon: "leaf" as const,
  },
  {
    value: "MODERATE",
    label: "Moderate",
    hint: "Some climbing, nothing scary. A proper half day out.",
    detail: "Around 11 km",
    icon: "mountain" as const,
  },
  {
    value: "HARD",
    label: "Hard",
    hint: "Long days and real ascent. Bring the good boots.",
    detail: "16 km and up",
    icon: "boot" as const,
  },
  {
    value: "SURPRISE",
    label: "Surprise me",
    hint: "Let the dice decide. Anything from a stroll to a slog.",
    detail: "Anything goes",
    icon: "dice" as const,
  },
] as const;

const STEPS = [
  {
    title: "Where are you starting from?",
    lede: "Your town or village — we use it to work out what's within reach. Type it however you like; accents optional.",
  },
  {
    title: "How hard should it be?",
    lede: "This sets the shape of your first quests. You can change it any time in settings.",
  },
];

export function OnboardingFlow({
  action,
  name,
}: {
  action: (state: OnboardingState, formData: FormData) => Promise<OnboardingState>;
  name: string;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(action, undefined);
  const reduced = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const [homeLocation, setHomeLocation] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<string>("MODERATE");

  const total = STEPS.length;
  const isLast = step === total - 1;
  const canAdvance = step !== 0 || homeLocation.trim().length >= 2;

  /**
   * Set only by the Finish button. Without it, React reuses the same DOM node
   * when "Continue" becomes "Finish" and flips its `type` to submit while the
   * click is still being dispatched — which submitted the form a step early.
   * The distinct `key`s below fix that too; this is the belt to their braces.
   */
  const submitIntent = React.useRef(false);

  const variants = reduced
    ? undefined
    : {
        enter: { opacity: 0, y: 16 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-ink/12 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="font-display text-xl font-extrabold text-ink">{BRAND.name}</span>
          <span className="kicker text-stone">
            Step {step + 1} of {total}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-16">
        {/* Progress rail */}
        <div className="flex gap-2" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-500",
                i <= step ? "bg-moss" : "bg-ink/12",
              )}
            />
          ))}
        </div>

        <p className="kicker mt-8 text-stone">Welcome, {name}</p>

        <form
          action={formAction}
          className="flex flex-1 flex-col"
          onSubmit={(event) => {
            // Only the Finish button may submit. This also blocks Enter-key
            // submissions from the text field on the first step.
            if (!submitIntent.current) {
              event.preventDefault();
              return;
            }
            submitIntent.current = false;
          }}
        >
          <input type="hidden" name="homeLocation" value={homeLocation} />
          <input type="hidden" name="difficulty" value={difficulty} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1"
            >
              <h1 className="display-md mt-3 max-w-[18ch]">{STEPS[step]!.title}</h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">{STEPS[step]!.lede}</p>

              <div className="mt-10">
                {step === 0 ? (
                  <div className="max-w-xl">
                    <label htmlFor="home-location" className="kicker mb-3 block text-stone">
                      Town or village
                    </label>
                    <PlaceCombobox
                      autoFocus
                      value={homeLocation}
                      onChange={setHomeLocation}
                      id="home-location"
                    />
                    <p className="mt-3 text-xs text-stone">
                      Not in the list? Type it anyway — we&apos;ll still use it.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {DIFFICULTIES.map((option) => {
                      const selected = difficulty === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDifficulty(option.value)}
                          aria-pressed={selected}
                          className={cn(
                            "flex flex-col items-start gap-2 border p-5 text-left transition-colors",
                            selected
                              ? "border-moss bg-moss text-paper"
                              : "border-ink/15 bg-paper hover:border-ink/40",
                          )}
                        >
                          <Icon name={option.icon} size={28} />
                          <span className="flex w-full items-baseline justify-between gap-3">
                            <span className="font-display text-2xl font-extrabold uppercase">
                              {option.label}
                            </span>
                            <span
                              className={cn(
                                "text-xs whitespace-nowrap",
                                selected ? "text-paper/70" : "text-stone",
                              )}
                            >
                              {option.detail}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "text-sm leading-relaxed",
                              selected ? "text-paper/80" : "text-stone",
                            )}
                          >
                            {option.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {state?.errors && (
            <p role="alert" className="mt-6 border-l-2 border-ember pl-4 text-sm text-ink">
              {Object.values(state.errors)[0]}
            </p>
          )}

          <div className="mt-12 flex items-center justify-between gap-4 border-t border-ink/12 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || pending}
            >
              ← Back
            </Button>

            {isLast ? (
              <Button
                key="finish"
                type="submit"
                variant="primary"
                size="lg"
                disabled={pending}
                onClick={() => {
                  submitIntent.current = true;
                }}
              >
                {pending && <Spinner />}
                {pending ? "Saving" : "Finish →"}
              </Button>
            ) : (
              <Button
                key="next"
                type="button"
                variant="primary"
                size="lg"
                onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                disabled={!canAdvance}
              >
                Continue →
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
