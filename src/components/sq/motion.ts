"use client";

import { useEffect, useState } from "react";

/**
 * Whether this reader has asked for less movement.
 *
 * Read live rather than once: the setting can change while a session is open,
 * and a deck that keeps springing after somebody turned motion off has ignored
 * the only instruction they gave.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
