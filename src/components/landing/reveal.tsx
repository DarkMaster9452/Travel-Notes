"use client";

import * as React from "react";

/**
 * The elements the landing page reveals on scroll.
 *
 * Wider than the original sweep in `index.html`: the shared quest shots, the
 * board posts, the matches, the proof card and the sticker sheet were all
 * simply *there* on arrival while everything around them animated in, which
 * read as half the page having failed to load rather than as restraint.
 */
const SELECTOR = [
  ".sec-head",
  ".step",
  ".terrain",
  ".plan",
  ".faq details",
  "#cta .wrap > *",
  ".shot",
  ".post",
  ".match",
  ".meet",
  ".proof-card",
  ".flow > div",
  ".unlocks li",
  ".rope-steps li",
  ".chat",
  ".sheet",
  ".board-head",
  ".safety",
].join(",");

/**
 * Reveal-on-scroll, ported from the landing page.
 *
 * Applied imperatively against the rendered markup rather than by wrapping
 * every section in a component, because several of the targets are grid
 * children (`.step`, `.terrain`, `.plan`) that a wrapper element would break.
 *
 * Two things are load-bearing and kept from the original:
 *   · the failsafe timeout, so a misbehaving observer can never leave the page
 *     permanently blank;
 *   · reduced motion, where everything is simply revealed at once.
 */
export function RevealOnScroll() {
  React.useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
    if (elements.length === 0) return;

    const reveal = (el: HTMLElement) => el.classList.add("in");

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((el, index) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(index % 4) * 60}ms`;
      observer.observe(el);
    });

    const failsafe = window.setTimeout(() => elements.forEach(reveal), 4000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return null;
}
