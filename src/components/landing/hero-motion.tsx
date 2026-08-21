"use client";

import { createDrawable, createTimeline, splitText, stagger, utils } from "animejs";
import * as React from "react";

import { unstyle } from "@/components/motion/anime";
import { EASE_BACK, EASE_FIELD } from "@/lib/motion";

/**
 * The hero, dealt out.
 *
 * The hero is the one place in the product where the motion is the pitch: the
 * page should look like an assignment being issued, not like a marketing site
 * switching itself on. So this is a single anime.js timeline rather than a set
 * of independent entrances — the contour lines draw themselves in like a map
 * being surveyed, the headline arrives word by word, the figures tick into
 * place, and the quest card lands on top of all of it, last, like a document
 * put down on the desk.
 *
 * It runs on mount rather than on scroll: the hero is above the fold, so a
 * scroll observer would fire for the whole block in a single beat.
 *
 * Everything it hides, it hides from script and re-shows on cleanup, so the
 * hero is fully readable with JavaScript off, under reduced motion, and in the
 * moment before hydration.
 */
export function HeroMotion() {
  React.useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pick = <T extends HTMLElement>(selector: string) =>
      Array.from(hero.querySelectorAll<T>(selector));

    const eyebrow = pick(".eyebrow");
    const heading = hero.querySelector<HTMLElement>(".h1");
    const lede = pick(".lede");
    const actions = pick(".hero-actions > *");
    const meta = pick(".hero-meta > div");
    const card = hero.querySelector<HTMLElement>(".quest-card");
    const cardParts = card
      ? Array.from(card.querySelectorAll<HTMLElement>(".qc-head, .qc-body > *, .qc-foot"))
      : [];
    const contours = hero.querySelector<SVGSVGElement>(".contours");

    // The headline is split into words so it can arrive as a sentence being
    // spoken rather than a block appearing. `accessible` keeps the original
    // text on the element for screen readers, which read the whole line.
    const split = heading ? splitText(heading, { words: true, chars: false }) : null;
    const words = (split?.words as HTMLElement[] | undefined) ?? [];

    const staged: HTMLElement[] = [...eyebrow, ...lede, ...actions, ...meta, ...words];
    if (card) staged.push(card);

    utils.set([...eyebrow, ...lede], { opacity: 0, translateY: 14 });
    utils.set(actions, { opacity: 0, translateY: 12 });
    utils.set(meta, { opacity: 0, translateY: 10 });
    utils.set(words, { opacity: 0, translateY: 26 });
    if (card) utils.set(card, { opacity: 0, translateY: 26, scale: 0.97, rotate: 0.6 });
    if (cardParts.length) utils.set(cardParts, { opacity: 0, translateY: 8 });

    const timeline = createTimeline({
      defaults: { ease: EASE_FIELD, duration: 620 },
      // Once the hero has been dealt, every element goes back to being styled
      // by the stylesheet — including the quest card, which has a hover lift an
      // inline transform would sit on top of forever.
      onComplete: () => unstyle([...staged, ...cardParts]),
    });

    // The survey lines first, drawn rather than faded, and slow enough that
    // they are still going when the headline starts.
    if (contours) {
      const lines = createDrawable(contours.querySelectorAll("path"));
      timeline.add(
        lines,
        { draw: ["0 0", "0 1"], duration: 2400, ease: "outQuad", delay: stagger(90) },
        0,
      );
    }

    timeline
      .add(eyebrow, { opacity: [0, 1], translateY: [14, 0] }, 120)
      .add(words, { opacity: [0, 1], translateY: [26, 0], duration: 720, delay: stagger(34) }, 200)
      .add(lede, { opacity: [0, 1], translateY: [14, 0] }, 520)
      .add(actions, { opacity: [0, 1], translateY: [12, 0], delay: stagger(70) }, 640)
      .add(meta, { opacity: [0, 1], translateY: [10, 0], delay: stagger(55) }, 760);

    if (card) {
      timeline.add(
        card,
        {
          opacity: [0, 1],
          translateY: [26, 0],
          scale: [0.97, 1],
          // Lands a shade off-square and squares itself, the way a sheet of
          // paper does when you put it down.
          rotate: [0.6, 0],
          duration: 820,
          ease: EASE_BACK,
        },
        520,
      );
    }
    if (cardParts.length) {
      timeline.add(
        cardParts,
        { opacity: [0, 1], translateY: [8, 0], duration: 460, delay: stagger(45) },
        820,
      );
    }

    return () => {
      timeline.revert();
      split?.revert();
      // Whatever the timeline was mid-way through, the hero ends up readable.
      utils.set([...staged, ...cardParts], {
        opacity: 1,
        translateY: 0,
        scale: 1,
        rotate: 0,
      });
    };
  }, []);

  return null;
}
