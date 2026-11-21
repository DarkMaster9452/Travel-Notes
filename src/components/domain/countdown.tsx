"use client";

import { useEffect, useState } from "react";

import { useT } from "@/components/i18n";

/**
 * Time left in a window, ticking.
 *
 * Rendered from the server's instant on first paint so there is no flash of a
 * different number, then taken over by the client. Below a day it counts in
 * hours and minutes, because that is when the figure starts being a decision
 * rather than a fact.
 */
export function Countdown({ to, closedLabel }: { to: string; closedLabel: string }) {
  const t = useT();
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

  if (days >= 1) {
    return (
      <span suppressHydrationWarning>
        {days} {t.trail.days} {String(hours % 24).padStart(2, "0")} {t.trail.hours}
      </span>
    );
  }
  if (hours >= 1) {
    return (
      <span suppressHydrationWarning>
        {hours} {t.trail.hours} {String(minutes % 60).padStart(2, "0")} min
      </span>
    );
  }
  return <span suppressHydrationWarning>{minutes} min</span>;
}
