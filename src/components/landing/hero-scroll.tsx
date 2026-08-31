"use client";

import * as React from "react";

/**
 * The hero's envelope, opened by scrolling.
 *
 * The section pins, the copy on the left holds still, and one scroll listener
 * writes three numbers onto it — `--flap`, `--rise` and `--out`. Everything
 * that moves is a `calc()` in the stylesheet reading those numbers, which is
 * why this is a scrubbed sequence rather than a timeline: there is no playhead
 * to get out of step with the reader, scrolling back closes the envelope again
 * exactly as it opened, and a flung scroll lands on the frame it should.
 *
 * Two things it will not do, and both are decisions rather than omissions:
 *
 *   · It does not run under reduced motion; it does not run on a screen narrow
 *     enough that the grid has already collapsed to one column, where with the
 *     copy stacked above the figure there is nothing left to hold still and
 *     pinning would only cost the reader screens of scrolling; and it does not
 *     run on a viewport too short to hold the quest at full size, where the
 *     stage would end up clipping the thing the whole sequence exists to
 *     deliver. In every one of those cases the stylesheet's defaults stand and
 *     the hero is the plain one: copy, then the quest document.
 *   · It never hides anything. The properties it writes all default to their
 *     finished values, so the hero is complete before this mounts, complete if
 *     it never mounts, and complete the moment it is torn down.
 */
const PIN =
  "(min-width: 981px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

/** The scrubbed properties, and the stretch of the pin each one is spent over. */
const PHASES = [
  ["--flap", 0.04, 0.3], // the seal breaks and the flap folds back
  ["--rise", 0.28, 0.7], // the document climbs out and grows to full size
  ["--out", 0.52, 0.88], // the envelope slides down clear of it
  ["--gone", 0.78, 0.96], // and only then fades, once it covers nothing
] as const;

/**
 * The flap's z-order flips once, and this is where. Past this point the fold is
 * near enough edge-on that the swap cannot be seen, and the document — which is
 * still fully inside the pocket — is about to start climbing past it.
 */
const FOLDED_BACK = 0.55;

const clamp = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Smoothstep. Soft at both ends, no overshoot — an overshoot in a scrubbed
 *  value reads as the page fighting the scroll wheel. */
function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function phase(progress: number, from: number, to: number): number {
  return ease(clamp((progress - from) / (to - from)));
}

/** Layout effect on the client, plain effect on the server, so the first
 *  painted frame is the sealed envelope rather than the finished hero. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export function HeroScroll() {
  useIsomorphicLayoutEffect(() => {
    const section = document.querySelector<HTMLElement>(".hero-scroll");
    const stage = section?.querySelector<HTMLElement>(".hero-stage");
    if (!section || !stage) return;

    const media = window.matchMedia(PIN);
    let frame = 0;
    let detach: (() => void) | null = null;

    /** The guaranteed-readable frame: no pin, no scrubbing, defaults stand. */
    const release = () => {
      detach?.();
      detach = null;
      delete section.dataset.pin;
      delete section.dataset.sealed;
      for (const [property] of PHASES) section.style.removeProperty(property);
    };

    const attach = () => {
      section.dataset.pin = "on";

      const write = () => {
        frame = 0;
        // How far the section can travel while its stage stays stuck. Measured
        // rather than assumed: the stage's height is the viewport minus the
        // nav, and both are the reader's, not ours.
        const travel = section.offsetHeight - stage.offsetHeight;
        if (travel <= 0) return;

        const stuckAt = Number.parseFloat(getComputedStyle(stage).top) || 0;
        const progress = clamp((stuckAt - section.getBoundingClientRect().top) / travel);

        for (const [property, from, to] of PHASES) {
          section.style.setProperty(property, String(phase(progress, from, to)));
        }

        const flap = phase(progress, PHASES[0][1], PHASES[0][2]);
        if (flap < FOLDED_BACK) section.dataset.sealed = "true";
        else delete section.dataset.sealed;
      };

      // Scroll and resize both only ever schedule; the reading and the writing
      // happen once per frame, together, so this never interleaves a layout
      // read with a style write.
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(write);
      };

      write();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });

      detach = () => {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      };
    };

    const sync = () => {
      release();
      if (media.matches) attach();
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      release();
    };
  }, []);

  return null;
}
