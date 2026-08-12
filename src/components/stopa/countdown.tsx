"use client";

import * as React from "react";

import { ClockIcon } from "@/components/stopa/ui";

/**
 * Ticking countdown to the moment a challenge closes.
 *
 * Rendered as HH:MM:SS with hours allowed to exceed 24, matching the "60:59:55"
 * in the design. The first paint uses a server-provided value so the number
 * doesn't flash, then it ticks client-side.
 */
export function Countdown({
  closesAt,
  label,
  closedLabel,
}: {
  closesAt: string;
  label: string;
  closedLabel: string;
}) {
  const target = React.useMemo(() => new Date(closesAt).getTime(), [closesAt]);
  const [remaining, setRemaining] = React.useState(() => Math.max(0, target - Date.now()));

  React.useEffect(() => {
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (remaining <= 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-moss">
        <ClockIcon />
        {closedLabel}
      </p>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <p className="flex items-center gap-3 text-cream">
      <ClockIcon className="text-cream/80" />
      <time
        className="countdown text-lg"
        dateTime={new Date(target).toISOString()}
        aria-label={`${hours} h ${minutes} min ${seconds} s`}
      >
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </time>
      <span className="text-sm text-moss">{label}</span>
    </p>
  );
}
