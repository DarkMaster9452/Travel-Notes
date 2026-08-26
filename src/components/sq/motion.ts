"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Whether this reader has asked for less movement.
 *
 * Read as an external store rather than mirrored into state: the media query
 * *is* the source of truth, it can change while a session is open, and a deck
 * that keeps springing after somebody turned motion off has ignored the only
 * instruction they gave. The server snapshot is `false` — the server cannot
 * know, and hydrating to the setting the browser reports is the correction.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
