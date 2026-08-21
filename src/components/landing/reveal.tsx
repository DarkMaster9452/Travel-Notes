"use client";

import { animate, stagger, utils } from "animejs";
import * as React from "react";

import { unstyle } from "@/components/motion/anime";
import { DURATION, EASE_FIELD } from "@/lib/motion";

/**
 * The landing page's scroll sweep, driven by anime.js.
 *
 * Applied imperatively against the rendered markup rather than by wrapping
 * every section in a component, because several of the targets are grid
 * children (`.step`, `.terrain`, `.plan`) that a wrapper element would break.
 *
 * What anime.js buys over the CSS class-flip this replaces: siblings inside one
 * group are dealt out together with a real stagger instead of each carrying a
 * hand-written `transition-delay`, and each kind of thing gets the movement it
 * should have — a card lands, a list item slides in from the margin, a sticker
 * stamps. The three guarantees from the old sweep are kept exactly:
 *
 *   · the failsafe, so a misbehaving observer can never leave the page blank;
 *   · reduced motion, where everything is simply present and no animation is
 *     ever created;
 *   · nothing hidden by the stylesheet — the starting frame is written from
 *     script, so a reader whose JavaScript never runs gets the whole page.
 */

/**
 * Groups of things that arrive the same way.
 *
 * `stagger` is per-group: the four "how it works" steps deal out in sequence,
 * but the steps and the pricing plans are separate groups and don't wait for
 * each other.
 */
const GROUPS: {
  select: string;
  from: Record<string, number>;
  duration?: number;
  stagger?: number;
  ease?: string;
}[] = [
  // Section headings lead; everything under them follows.
  { select: ".sec-head", from: { opacity: 0, translateY: 20 }, stagger: 60 },
  { select: ".board-head", from: { opacity: 0, translateY: 16 } },

  // Cards and panels land like documents — a shade of scale, so they read as
  // being placed on the page rather than sliding onto it.
  {
    select: ".shot, .post, .match, .meet, .proof-card, .chat, .sheet",
    from: { opacity: 0, translateY: 22, scale: 0.985 },
    duration: DURATION.slow,
    stagger: 80,
  },
  { select: ".terrain, .plan", from: { opacity: 0, translateY: 24, scale: 0.99 }, stagger: 90 },

  // Sequences read left to right, so they enter that way.
  { select: ".step, .flow > div", from: { opacity: 0, translateY: 18 }, stagger: 90 },
  {
    select: ".mail-list li, .unlocks li, .rope-steps li",
    from: { opacity: 0, translateX: -14 },
    duration: DURATION.quick,
    stagger: 55,
  },

  { select: ".envelope", from: { opacity: 0, translateY: 18, rotate: -1.5 }, duration: DURATION.slow },
  { select: ".faq details", from: { opacity: 0, translateY: 12 }, duration: DURATION.quick, stagger: 45 },
  { select: "#cta .wrap > *", from: { opacity: 0, translateY: 18 }, stagger: 70 },
  { select: ".safety", from: { opacity: 0, translateY: 16 } },
];

/** The whole sweep, as one selector, for the reduced-motion and failsafe paths. */
const ALL = GROUPS.map((group) => group.select).join(",");

function targetOf(property: string): number {
  return property === "opacity" || property === "scale" ? 1 : 0;
}

export function RevealOnScroll() {
  React.useEffect(() => {
    const everything = Array.from(document.querySelectorAll<HTMLElement>(ALL));
    if (everything.length === 0) return;

    const show = () => utils.set(everything, { opacity: 1, translateY: 0, translateX: 0, scale: 1, rotate: 0 });

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // A group's members are dealt together when the *first* of them arrives,
    // so a row of three cards staggers as a row instead of each card firing
    // alone at its own scroll position.
    const observers: IntersectionObserver[] = [];

    for (const group of GROUPS) {
      const members = Array.from(document.querySelectorAll<HTMLElement>(group.select));
      if (members.length === 0) continue;

      utils.set(members, group.from);

      const tweens: Record<string, [number, number]> = {};
      for (const [property, value] of Object.entries(group.from)) {
        tweens[property] = [value, targetOf(property)];
      }

      // Rows of siblings that sit next to each other should deal together;
      // ones far apart on the page should not wait for a scroll to the bottom.
      // Splitting on `offsetTop` gives that without hard-coding the layout.
      const rows = new Map<number, HTMLElement[]>();
      for (const member of members) {
        const band = Math.round(member.getBoundingClientRect().top / 120);
        rows.set(band, [...(rows.get(band) ?? []), member]);
      }

      for (const row of rows.values()) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            animate(row, {
              ...tweens,
              duration: group.duration ?? DURATION.base,
              ease: group.ease ?? EASE_FIELD,
              delay: group.stagger ? stagger(group.stagger) : 0,
              onComplete: () => unstyle(row),
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
        );
        row.forEach((member) => observer.observe(member));
        observers.push(observer);
      }
    }

    // Nothing on this page may stay hidden because an observer misbehaved.
    const failsafe = window.setTimeout(show, 4000);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      window.clearTimeout(failsafe);
      show();
    };
  }, []);

  return null;
}
