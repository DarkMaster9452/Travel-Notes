"use client";

/**
 * The app's motion layer.
 *
 * Everything here now runs on anime.js, and lives in `@/components/motion/anime`
 * so the landing page, the signed-in app and the admin panel share one engine
 * rather than three implementations of the same fade.
 *
 * This module stays because the app and the panel import `Reveal`, `CountUp`
 * and `ProgressBar` from it in twenty-odd places, and because those three are
 * the app-side vocabulary: a section arriving, a figure being counted, a
 * measurement being drawn. The richer pieces — staggered groups, stamps, the
 * hero timeline — are imported from the engine directly.
 */

export {
  CountUp,
  ProgressBar,
  Reveal,
  Stagger,
  stampIn,
  shake,
  usePrefersReducedMotion,
} from "@/components/motion/anime";
