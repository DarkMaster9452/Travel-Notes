"use client";

import { useEffect, useState } from "react";

/**
 * Time left in a window, ticking.
 *
 * Rendered from the server's instant on first paint so there is no flash of a
 * different number, then taken over by the client. Below a day it counts in
 * hours and minutes, because that is when the figure starts being a decision
 * rather than a fact.
 */
export function SqCountdown({ to, closedLabel = "Closed" }: { to: string; closedLabel?: string }) {
  const [left, setLeft] = useState(() => new Date(to).getTime() - Date.now());

  useEffect(() => {
    const tick = () => setLeft(new Date(to).getTime() - Date.now());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [to]);

  if (left <= 0) return <>{closedLabel}</>;

  const minutes = Math.floor(left / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 1) return <>{days}d {hours % 24}h</>;
  if (hours >= 1) return <>{hours}h {minutes % 60}m</>;
  return <>{minutes}m</>;
}

/** How much of the window has already gone, 0–100. */
export function windowProgress(openAt: Date | string, closeAt: Date | string, now = Date.now()) {
  const from = new Date(openAt).getTime();
  const to = new Date(closeAt).getTime();
  if (to <= from) return 100;
  return Math.max(0, Math.min(100, ((now - from) / (to - from)) * 100));
}
