"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A figure that counts up from zero on first paint.
 *
 * Once per session, and per figure: the dashboard's points and the panel's
 * stat grid are meant to land once when you arrive, not re-run every time a
 * filter changes underneath them. `sessionStorage` is what makes "once" mean
 * once across a route change, and it is wrapped because a private window can
 * throw on access rather than return null.
 *
 * Under `prefers-reduced-motion` the count-up is dropped entirely and the
 * final value is what is painted.
 */
export function CountUp({
  value,
  duration = 600,
  format,
  id,
}: {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  /** Stable key for the once-per-session rule. Defaults to the value itself. */
  id?: string;
}) {
  const [shown, setShown] = useState(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const key = `sq:counted:${id ?? String(value)}`;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let alreadyCounted = false;
    try {
      alreadyCounted = window.sessionStorage.getItem(key) === "1";
    } catch {
      alreadyCounted = false;
    }

    // Nothing to animate: `shown` already holds the value, so there is no
    // state to set — an effect that assigned it here would only schedule a
    // second render to arrive at the number already on screen.
    if (reduced || alreadyCounted || value === 0) return;

    try {
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* a browser refusing site data is not a reason to skip the animation */
    }

    let started = 0;
    const step = (now: number) => {
      // The first frame is what sets the figure to zero, rather than a
      // synchronous assignment in the effect body: the count-up is an
      // animation, and animations belong on frames.
      started ||= now;
      const t = Math.min(1, (now - started) / duration);
      // ease-out: fast off the mark, settling into the real figure.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, id]);

  return <>{format ? format(shown) : shown.toLocaleString("en-GB")}</>;
}
