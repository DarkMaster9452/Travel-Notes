"use client";

import { animate, stagger as animeStagger, utils } from "animejs";
import * as React from "react";

import { DURATION, EASE_BACK, EASE_FIELD, STAGGER_MS } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The product's motion engine.
 *
 * Everything scripted — entrances, counters, bars, the hero, page changes,
 * the panel's charts — runs through anime.js from here. CSS keeps what CSS is
 * good at (hover states, focus rings, the burger), and anything that has to be
 * sequenced, staggered, interrupted or tied to a number lives in this module.
 *
 * Three rules hold for every helper below, and they are the reason this is one
 * module rather than a dozen `animate()` calls scattered through the tree:
 *
 *   · Reduced motion means *no* motion. Not a shorter animation — the content
 *     is simply present, and no timeline is ever created.
 *   · Nothing may end up invisible. Every entrance hides its target from
 *     script, never from the stylesheet, so a reader whose JavaScript failed
 *     gets the page rather than a blank rectangle; and every observer carries
 *     a failsafe that reveals its target if the intersection never comes.
 *   · Only `opacity` and `transform` are animated. Nothing here triggers
 *     layout, so a long admin table staggering in costs one composite pass.
 */

/* ------------------------------------------------------------- primitives -- */

export function usePrefersReducedMotion(): boolean {
  const subscribe = React.useCallback((onChange: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // The server assumes reduced motion, so the markup ships visible and a
    // viewer who never runs the effect still reads the page.
    () => true,
  );
}

/** How long an entrance waits for an intersection before giving up and showing. */
const FAILSAFE_MS = 2500;

export type AnimeInView<T extends HTMLElement> = {
  /** Writes the starting frame. Runs before the element can be seen. */
  prepare?: (element: T) => void;
  /** Starts the animation. Return it so it can be stopped on unmount. */
  play: (element: T) => { pause?: () => void } | void;
  /** The guaranteed-visible frame, written on teardown. */
  reset?: (element: T) => void;
  enabled?: boolean;
  threshold?: number;
  margin?: string;
};

/**
 * Hides an element, waits for it to reach the viewport, animates it in — and
 * guarantees it ends up visible whatever happens in between.
 *
 * All three phases are deliberately one effect. An earlier version prepared the
 * hidden frame in a layout effect and observed in a passive one, which is fine
 * until React re-runs one and not the other: the element is hidden by a second
 * mount whose observer never re-fires, and the content is gone for good. Tying
 * them together means the hidden frame cannot outlive the observer that undoes
 * it, and the cleanup — which always writes the visible frame — cannot be
 * skipped. Nothing on a page may be left invisible by the thing meant to reveal
 * it, and this is where that is enforced rather than hoped for.
 */
export function useAnimeInView<T extends HTMLElement>({
  prepare,
  play,
  reset,
  enabled = true,
  threshold = 0.08,
  margin = "0px 0px -32px 0px",
}: AnimeInView<T>) {
  const ref = React.useRef<T>(null);

  // Held in a ref so a fresh closure on every render doesn't restart the
  // entrance; the deps below are the things that actually change its meaning.
  // The initial value covers the first commit — the effect below only has to
  // keep later renders' closures current, and an intersection cannot arrive
  // before it has run, because observer callbacks are always asynchronous.
  const spec = React.useRef({ prepare, play, reset });
  React.useEffect(() => {
    spec.current = { prepare, play, reset };
  });

  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;

    let started = false;
    let animation: { pause?: () => void } | void;

    const start = () => {
      if (started) return;
      started = true;
      animation = spec.current.play(node);
    };

    spec.current.prepare?.(node);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { threshold, rootMargin: margin },
    );
    observer.observe(node);

    const failsafe = window.setTimeout(start, FAILSAFE_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
      animation?.pause?.();
      spec.current.reset?.(node);
    };
  }, [enabled, threshold, margin]);

  return ref;
}

/**
 * Clears the inline properties an entrance wrote, handing the element back to
 * the stylesheet.
 *
 * Not anime's own `cleanInlineStyles`, and the difference is the whole reason
 * this exists: that helper restores the inline styles an element had *before*
 * the animation — which here is the hidden frame the entrance itself wrote a
 * moment earlier, so every element would land and then vanish. Removing the
 * properties outright is what "the animation is over, CSS is in charge again"
 * actually means, and it is what keeps the `:hover` lifts underneath every
 * card working after it has arrived.
 */
export function unstyle(
  targets: Element | Element[] | NodeListOf<Element> | null,
  properties: string[] = ["opacity", "transform"],
) {
  if (!targets) return;
  const list: Element[] =
    targets instanceof Element ? [targets] : Array.from(targets as ArrayLike<Element>);
  for (const element of list) {
    const style = (element as HTMLElement).style;
    if (!style) continue;
    for (const property of properties) style.removeProperty(property);
  }
}

/* --------------------------------------------------------------- entrance -- */

export type RevealVariant = "rise" | "fade" | "slide" | "stamp" | "card";

/**
 * How each variant enters. Kept as data so the landing sweep, the app shell
 * and the panel all reach for the same six movements instead of inventing
 * their own numbers.
 */
const VARIANTS: Record<RevealVariant, { from: Record<string, number>; duration: number; ease: string }> = {
  rise: { from: { opacity: 0, translateY: 16 }, duration: DURATION.base, ease: EASE_FIELD },
  fade: { from: { opacity: 0 }, duration: DURATION.base, ease: EASE_FIELD },
  slide: { from: { opacity: 0, translateX: -12 }, duration: DURATION.quick, ease: EASE_FIELD },
  stamp: { from: { opacity: 0, scale: 1.35, rotate: -6 }, duration: DURATION.base, ease: EASE_BACK },
  card: { from: { opacity: 0, translateY: 18, scale: 0.985 }, duration: DURATION.slow, ease: EASE_FIELD },
};

function entrance(
  targets: HTMLElement | HTMLElement[],
  variant: RevealVariant,
  { delay = 0, stagger = 0 }: { delay?: number; stagger?: number } = {},
) {
  const spec = VARIANTS[variant];
  const from = spec.from;

  // Built key by key rather than declared whole: anime.js reads any property
  // present on the object, so passing `translateX: undefined` for a variant
  // that does not move sideways would still register a tween.
  const tweens: Record<string, [number, number]> = {};
  for (const [property, value] of Object.entries(from)) {
    tweens[property] = [value, property === "opacity" || property === "scale" ? 1 : 0];
  }

  return animate(targets, {
    ...tweens,
    duration: spec.duration,
    ease: spec.ease,
    delay: stagger ? animeStagger(stagger, { start: delay }) : delay,
    // Hand the element back to its own styles once it has landed, so the CSS
    // hover lifts underneath an entrance keep working.
    onComplete: () => unstyle(targets),
  });
}

/** The starting frame, written from script so no-JS never hides anything. */
function hide(targets: HTMLElement | HTMLElement[], variant: RevealVariant) {
  utils.set(targets, VARIANTS[variant].from);
}

/** The finished frame. Written on teardown, so nothing is ever left hidden. */
function show(targets: HTMLElement | HTMLElement[]) {
  utils.set(targets, { opacity: 1, translateY: 0, translateX: 0, scale: 1, rotate: 0 });
}

/**
 * Fades and lifts its children into place when they scroll into view.
 *
 * `delay` staggers siblings — pass `stagger(index)` from `@/lib/motion` rather
 * than a hand-tuned millisecond value.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "rise",
  as: Tag = "div",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  delay?: number;
  variant?: RevealVariant;
  as?: "div" | "section" | "article" | "li" | "header" | "aside";
}) {
  const reduced = usePrefersReducedMotion();

  // Hidden from script rather than from the returned style, so the very first
  // server-rendered frame is the finished one: the element is only ever
  // invisible on a client that is definitely about to animate it.
  const ref = useAnimeInView<HTMLElement>({
    enabled: !reduced,
    prepare: (element) => hide(element, variant),
    play: (element) => entrance(element, variant, { delay }),
    reset: show,
  });

  return (
    <Tag ref={ref as React.Ref<never>} className={cn(className)} {...props}>
      {children}
    </Tag>
  );
}

/**
 * Deals its children in one after another.
 *
 * For lists that are rendered as a group and read as a group — nav links,
 * table rows, sticker sheets, a grid of figures — where wrapping every child
 * in its own `Reveal` would mean one observer per row.
 */
export function Stagger({
  children,
  select = ":scope > *",
  variant = "rise",
  delay = 0,
  step = STAGGER_MS,
  as: Tag = "div",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  /** Which descendants to deal. Defaults to the direct children. */
  select?: string;
  variant?: RevealVariant;
  delay?: number;
  step?: number;
  as?: "div" | "section" | "ul" | "ol" | "dl" | "nav" | "tbody";
}) {
  const reduced = usePrefersReducedMotion();

  const collect = React.useCallback(
    (element: HTMLElement) => Array.from(element.querySelectorAll<HTMLElement>(select)),
    [select],
  );

  const ref = useAnimeInView<HTMLElement>({
    enabled: !reduced,
    prepare: (element) => {
      const items = collect(element);
      if (items.length > 0) hide(items, variant);
    },
    play: (element) => {
      const items = collect(element);
      if (items.length === 0) return;
      return entrance(items, variant, { delay, stagger: step });
    },
    reset: (element) => show(collect(element)),
  });

  return (
    <Tag ref={ref as React.Ref<never>} className={cn(className)} {...props}>
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- figures -- */

/**
 * Counts up to a number when it first appears.
 *
 * Falls straight to the final value under reduced motion — a number that
 * animates is decoration, a number that is wrong is a bug.
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

  const ref = useAnimeInView<HTMLSpanElement>({
    enabled: !reduced,
    threshold: 0.2,
    margin: "0px",
    play: () => {
      const figure = { n: 0 };
      return animate(figure, {
        n: value,
        duration,
        ease: "outExpo",
        onUpdate: () => setCounted(figure.n),
        onComplete: () => setCounted(value),
      });
    },
    // A figure that stopped counting shows its real value, never the number it
    // happened to have reached.
    reset: () => setCounted(value),
  });

  return (
    <span ref={ref} className={className}>
      {format(reduced ? value : counted)}
    </span>
  );
}

/**
 * A bar that grows to its share when it appears — the shared weekly and
 * monthly counters, and every rank row in the panel.
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
  const fill = React.useRef<HTMLElement>(null);
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

  const ref = useAnimeInView<HTMLSpanElement>({
    enabled: !reduced,
    threshold: 0.2,
    margin: "0px",
    play: () => {
      if (!fill.current) return;
      return animate(fill.current, {
        width: ["0%", `${percent}%`],
        duration: DURATION.slow,
        ease: EASE_FIELD,
      });
    },
    reset: () => {
      if (fill.current) utils.set(fill.current, { width: `${percent}%` });
    },
  });

  return (
    <span
      ref={ref}
      className={cn("progress", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
    >
      <i ref={fill as React.Ref<never>} style={{ width: `${percent}%` }} />
    </span>
  );
}

/* ------------------------------------------------------------ imperatives -- */

/**
 * Lands an element like a stamp. Used for verdicts, unlocked stickers and
 * anything else that becomes true at the moment you look at it.
 */
export function stampIn(target: HTMLElement | null, delay = 0) {
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  utils.set(target, { opacity: 0, scale: 1.4, rotate: -7 });
  return animate(target, {
    opacity: [0, 1],
    scale: [1.4, 0.96, 1],
    rotate: [-7, 1.5, 0],
    duration: 520,
    delay,
    ease: EASE_BACK,
    onComplete: () => unstyle(target),
  });
}

/**
 * A short shake. Reserved for a rejected form — the only place in the product
 * where motion says *no*.
 */
export function shake(target: HTMLElement | null) {
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  return animate(target, {
    translateX: [0, -7, 6, -4, 3, 0],
    duration: 380,
    ease: "outQuad",
    onComplete: () => unstyle(target),
  });
}

export { animeStagger as stagger };
