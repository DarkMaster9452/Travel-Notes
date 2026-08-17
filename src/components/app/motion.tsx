"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The app's motion layer.
 *
 * Same easing and the same reveal-on-scroll idea as the landing page, but
 * expressed as components rather than the landing page's imperative sweep,
 * because app surfaces re-render as data changes and a DOM sweep would not
 * survive that.
 *
 * Two rules hold everywhere:
 *   · reduced motion means no motion — content is simply present, never
 *     hidden waiting for an animation that will not run;
 *   · nothing can be left invisible. Anything that fails to be observed is
 *     revealed by the failsafe, which is the same guarantee the landing page
 *     makes with its 4-second timeout.
 */

const EASE = "cubic-bezier(.2,.8,.3,1)";
const FAILSAFE_MS = 2500;

function usePrefersReducedMotion(): boolean {
  const subscribe = React.useCallback((onChange: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // On the server, assume reduced motion: the markup then ships visible, and
    // a viewer who never runs the effect still sees the page.
    () => true,
  );
}

/**
 * Fades and lifts its children into place when they scroll into view.
 *
 * `delay` staggers siblings — pass `stagger(index)` from `@/lib/motion`
 * rather than a hand-tuned millisecond value.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "header";
}) {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (reduced || shown) return;
    const node = ref.current;
    if (!node) return;

    // Already on screen at mount (above the fold): show it without waiting for
    // an intersection that has, in effect, already happened.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
    );
    observer.observe(node);

    const failsafe = window.setTimeout(() => setShown(true), FAILSAFE_MS);
    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [reduced, shown]);

  const animate = !reduced && !shown;

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(className)}
      style={{
        opacity: animate ? 0 : 1,
        transform: animate ? "translateY(14px)" : "none",
        transition: reduced ? undefined : `opacity .55s ${EASE} ${delay}ms, transform .55s ${EASE} ${delay}ms`,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts up to a number when it first appears.
 *
 * Used for the figures on Today and in history. Falls straight to the final
 * value under reduced motion — a number that animates is decoration, a number
 * that is wrong is a bug.
 */
export function CountUp({
  value,
  duration = 900,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [counted, setCounted] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);

  // Derived, not synced: under reduced motion the final value is simply what
  // renders, so there is no state to keep in step with the prop.
  const display = reduced ? value : counted;

  React.useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let start = 0;

    const run = () => {
      const step = (now: number) => {
        if (!start) start = now;
        const progress = Math.min(1, (now - start) / duration);
        // Ease out, so the figure settles rather than stopping dead.
        setCounted(value * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        run();
        observer.disconnect();
      }
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}

/**
 * A bar that grows to its share when it appears. The shared weekly and monthly
 * quests use it for the accepted/logged counters.
 */
export function ProgressBar({
  value,
  label,
  className,
}: {
  /** 0–1. */
  value: number;
  label?: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = React.useState(0);

  // The bar grows from nothing on first paint; under reduced motion it is
  // simply drawn at its width.
  const width = reduced ? value : grown;

  React.useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setGrown(value), 120);
    return () => window.clearTimeout(timer);
  }, [value, reduced]);

  const percent = Math.round(Math.max(0, Math.min(1, width)) * 100);

  return (
    <span
      className={cn("progress", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.max(0, Math.min(1, value)) * 100)}
      aria-label={label}
    >
      <i
        style={{
          width: `${percent}%`,
          transition: reduced ? undefined : `width .9s ${EASE}`,
        }}
      />
    </span>
  );
}
