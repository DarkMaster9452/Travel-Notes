"use client";

import { animate } from "animejs";
import * as React from "react";

import { unstyle } from "./anime";

/**
 * Press feedback, for every control in the product at once.
 *
 * One delegated listener on the document rather than a handler per button:
 * controls are rendered by forty-odd components, several of them inside
 * dialogs and menus that mount long after this does, and a `pointerdown` on
 * the document catches all of them — including the ones a future page adds.
 *
 * Why this is anime.js and not the `:active` rule it replaces: a press should
 * *spring* back. CSS can compress a button on `:active` but it can only ease
 * it back out, so a quick tap looks like the button was pushed and then
 * politely returned; the same tap with a little overshoot on the release reads
 * as something physical you let go of. That is the entire difference between a
 * control that feels responsive and one that feels remote, and it is worth one
 * event listener.
 *
 * The hover lift stays in CSS, where it belongs — it is a state, not an event.
 */
const PRESSABLE = ".btn:not(:disabled), .press, .pill, button.tag, .app-side-account, .plan-mark";

export function PressFeedback() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The element currently held down, so a pointer released outside it — a
    // drag off the button, a cancelled touch — still springs back.
    let held: HTMLElement | null = null;

    const release = () => {
      const target = held;
      held = null;
      if (!target) return;
      animate(target, {
        scale: 1,
        duration: 420,
        ease: "outElastic(1, .55)",
        onComplete: () => unstyle(target, ["transform"]),
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(PRESSABLE);
      if (!target) return;
      // A pointer already holding something else: settle that one first.
      if (held && held !== target) release();
      held = target;
      animate(target, { scale: 0.955, duration: 110, ease: "outQuad" });
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", release, { passive: true });
    document.addEventListener("pointercancel", release, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      release();
    };
  }, []);

  return null;
}
