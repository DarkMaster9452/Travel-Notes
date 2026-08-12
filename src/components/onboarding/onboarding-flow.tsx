"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { useActionState } from "react";

import type { OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { PLACES } from "@/lib/geo";
import { ONBOARDING_INTERESTS } from "@/lib/quest/taxonomy";
import { cn } from "@/lib/utils";

/**
 * One question per screen. Answers accumulate in local state and are submitted
 * once at the end, so a half-finished onboarding never writes partial
 * preferences to the database.
 */

const RADIUS_STOPS = [5, 10, 25, 50, 100, 200];

const DIFFICULTIES = [
  { value: "EASY", label: "Easy", hint: "A walk, not a workout" },
  { value: "MODERATE", label: "Moderate", hint: "Some climbing, nothing scary" },
  { value: "HARD", label: "Hard", hint: "Long days and real ascent" },
  { value: "SURPRISE", label: "Surprise me", hint: "Let the dice decide" },
] as const;

const TIMES = [
  { value: "SHORT", label: "1–2 hours" },
  { value: "HALF", label: "2–4 hours" },
  { value: "LONG", label: "4–6 hours" },
  { value: "FULL", label: "Full day" },
  { value: "SURPRISE", label: "Surprise me" },
] as const;

const TRANSPORTS = [
  { value: "CAR", label: "Car", emoji: "🚗" },
  { value: "PUBLIC_TRANSPORT", label: "Public transport", emoji: "🚈" },
  { value: "BIKE", label: "Bike", emoji: "🚲" },
  { value: "WALKING", label: "Walking", emoji: "🥾" },
] as const;

const STYLES = [
  { value: "RELAXED", label: "Relaxed", hint: "Slow mornings, easy ground" },
  { value: "ADVENTUROUS", label: "Adventurous", hint: "The default setting" },
  { value: "CHALLENGING", label: "Challenging", hint: "Make it hurt a little" },
  { value: "RANDOM", label: "Completely random", hint: "Ignore everything above" },
] as const;

type Answers = {
  homeLocation: string;
  maxDistance: number;
  interests: string[];
  difficulty: string;
  timeAvailable: string;
  transport: string;
  questStyle: string;
};

const STEP_TITLES = [
  "Where are you based?",
  "How far will you travel?",
  "What kind of adventure?",
  "How hard should it be?",
  "How much time do you have?",
  "How do you travel?",
  "What's your quest style?",
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
  const [answers, setAnswers] = React.useState<Answers>({
    homeLocation: "",
    maxDistance: 50,
    interests: [],
    difficulty: "SURPRISE",
    timeAvailable: "HALF",
    transport: "CAR",
    questStyle: "ADVENTUROUS",
  });

  const total = STEP_TITLES.length;
  const isLast = step === total - 1;

  /**
   * Set only by the Finish button. Without it, React reuses the same DOM node
   * when "Continue" becomes "Finish" and flips its `type` to submit while the
   * click is still being dispatched — which submitted the form a step early.
   * The distinct `key`s below fix that too; this is the belt to their braces.
   */
  const submitIntent = React.useRef(false);

  const canAdvance = React.useMemo(() => {
    if (step === 0) return answers.homeLocation.trim().length >= 2;
    if (step === 2) return answers.interests.length > 0;
    return true;
  }, [step, answers]);

  const toggleInterest = (id: string) =>
    setAnswers((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));

  const variants = reduced
    ? undefined
    : {
        enter: { opacity: 0, y: 24 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
      };

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-paper">
      {/* Progress rail */}
      <div className="flex gap-1 px-5 pt-6 sm:px-10" aria-hidden="true">
        {STEP_TITLES.map((title, i) => (
          <span
            key={title}
            className={cn(
              "h-0.5 flex-1 transition-colors duration-500",
              i <= step ? "bg-ember-light" : "bg-paper/20",
            )}
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:px-10 sm:py-16">
        <p className="kicker text-paper/50">
          Step {step + 1} / {total} · {name}
        </p>

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
          {/* Answers travel with the form; only the last step submits. */}
          <input type="hidden" name="homeLocation" value={answers.homeLocation} />
          <input type="hidden" name="maxDistance" value={answers.maxDistance} />
          <input type="hidden" name="difficulty" value={answers.difficulty} />
          <input type="hidden" name="timeAvailable" value={answers.timeAvailable} />
          <input type="hidden" name="transport" value={answers.transport} />
          <input type="hidden" name="questStyle" value={answers.questStyle} />
          {answers.interests.map((interest) => (
            <input key={interest} type="hidden" name="interests" value={interest} />
          ))}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 pt-8"
            >
              <h1 className="display-md max-w-[14ch] text-paper">{STEP_TITLES[step]}</h1>

              <div className="mt-10">
                {step === 0 && (
                  <div>
                    <Input
                      autoFocus
                      list="places"
                      value={answers.homeLocation}
                      onChange={(e) => setAnswers({ ...answers, homeLocation: e.target.value })}
                      placeholder="Žilina"
                      aria-label="Your home town"
                      className="border-paper/30 text-2xl text-paper placeholder:text-paper/30 focus:border-ember-light sm:text-3xl"
                    />
                    <datalist id="places">
                      {PLACES.map((place) => (
                        <option key={place.name} value={place.name} />
                      ))}
                    </datalist>
                    <p className="mt-4 text-sm text-paper/50">
                      We use this to estimate travel time. A town name is enough.
                    </p>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <p className="font-display text-6xl font-extrabold text-ember-light sm:text-8xl">
                      {answers.maxDistance === 200 ? "100+" : answers.maxDistance} km
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={RADIUS_STOPS.length - 1}
                      step={1}
                      value={RADIUS_STOPS.indexOf(answers.maxDistance)}
                      onChange={(e) =>
                        setAnswers({ ...answers, maxDistance: RADIUS_STOPS[Number(e.target.value)]! })
                      }
                      aria-label="Maximum travel distance in kilometres"
                      className="mt-8 h-1 w-full cursor-pointer appearance-none rounded-none bg-paper/25 accent-ember-light"
                    />
                    <div className="mt-4 flex justify-between text-xs text-paper/45">
                      {RADIUS_STOPS.map((stop) => (
                        <span key={stop}>{stop === 200 ? "100+" : stop}</span>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {ONBOARDING_INTERESTS.map((interest) => {
                      const selected = answers.interests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest.id)}
                          aria-pressed={selected}
                          className={cn(
                            "flex flex-col items-start gap-3 border p-4 text-left transition-colors",
                            selected
                              ? "border-ember bg-ember text-paper"
                              : "border-paper/25 text-paper hover:border-paper/60",
                          )}
                        >
                          <span className="text-2xl" aria-hidden="true">
                            {interest.emoji}
                          </span>
                          <span className="font-display text-lg font-bold uppercase">
                            {interest.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 3 && (
                  <OptionList
                    options={DIFFICULTIES}
                    value={answers.difficulty}
                    onChange={(value) => setAnswers({ ...answers, difficulty: value })}
                  />
                )}

                {step === 4 && (
                  <OptionList
                    options={TIMES}
                    value={answers.timeAvailable}
                    onChange={(value) => setAnswers({ ...answers, timeAvailable: value })}
                  />
                )}

                {step === 5 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TRANSPORTS.map((option) => {
                      const selected = answers.transport === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAnswers({ ...answers, transport: option.value })}
                          aria-pressed={selected}
                          className={cn(
                            "flex flex-col items-start gap-3 border p-4 text-left transition-colors",
                            selected
                              ? "border-ember bg-ember text-paper"
                              : "border-paper/25 hover:border-paper/60",
                          )}
                        >
                          <span className="text-2xl" aria-hidden="true">
                            {option.emoji}
                          </span>
                          <span className="font-display text-lg font-bold uppercase">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 6 && (
                  <OptionList
                    options={STYLES}
                    value={answers.questStyle}
                    onChange={(value) => setAnswers({ ...answers, questStyle: value })}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {state?.errors && (
            <p role="alert" className="mt-6 border-l-2 border-ember-light pl-4 text-sm text-paper">
              {Object.values(state.errors)[0]}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-paper/20 pt-6">
            <Button
              type="button"
              variant="ghostLight"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || pending}
            >
              ← Back
            </Button>

            {isLast ? (
              <Button
                key="finish"
                type="submit"
                variant="ember"
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
                variant="light"
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

function OptionList({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string; hint?: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "group flex items-baseline justify-between gap-4 border-b border-paper/20 py-5 text-left transition-colors",
              selected ? "text-ember-light" : "text-paper hover:text-paper/70",
            )}
          >
            <span className="font-display text-2xl font-extrabold uppercase sm:text-3xl">
              {option.label}
            </span>
            {option.hint && (
              <span className="hidden text-sm text-paper/45 sm:block">{option.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
