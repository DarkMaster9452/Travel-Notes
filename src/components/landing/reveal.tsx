"use client";

import * as React from "react";

/** The elements the landing page reveals on scroll, as in `index.html`. */
const SELECTOR =
  ".sec-head,.step,.terrain,.plan,.mail-list li,.envelope,.faq details,#cta .wrap > *";

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
