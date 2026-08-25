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

    if (reduced || alreadyCounted || value === 0) {
      setShown(value);
      return;
    }

    try {
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* a browser refusing site data is not a reason to skip the animation */
    }

    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // ease-out: fast off the mark, settling into the real figure.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    setShown(0);
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, id]);

  return <>{format ? format(shown) : shown.toLocaleString("en-GB")}</>;
}
