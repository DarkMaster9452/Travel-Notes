"use client";

import { animate, utils } from "animejs";
import { usePathname } from "next/navigation";
import * as React from "react";

import { DURATION, EASE_FIELD } from "@/lib/motion";

import { unstyle, usePrefersReducedMotion } from "./anime";

/**
 * The change of view, in the app and in the panel.
 *
 * Navigating between two pages that share their chrome is the one moment where
 * a product can feel like a stack of documents instead of a set of URLs, and
 * where nothing moving at all reads as a flicker. So the canvas — the area
 * inside the sidebar, never the sidebar itself — lifts a few pixels and settles
 * on every route change.
 *
 * Deliberately short. This runs in front of content the reader asked for, so it
 * is over in a fifth of a second and never delays anything: the page is fully
 * interactive the whole time, and the animation only touches opacity and
 * transform.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (reduced || !canvas) return;

    const animation = animate(canvas, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: DURATION.quick,
      ease: EASE_FIELD,
      onComplete: () => unstyle(canvas),
    });

    return () => {
      animation.pause();
      utils.set(canvas, { opacity: 1, translateY: 0 });
    };
  }, [pathname, reduced]);

  return (
    <div className="app-canvas" ref={ref}>
      {children}
    </div>
  );
}
