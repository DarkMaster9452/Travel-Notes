"use client";

import * as React from "react";

/**
 * Time left on a slot.
 *
 * The deadline is real — a weekly that closes on Sunday closes on Sunday, and
 * nothing files late — so this is information rather than urgency theatre. It
 * counts in whole minutes until the last hour and only then starts showing
 * seconds, which is the point at which a second actually changes what you
 * would do.
 *
 * Rendered empty on the server and filled in on mount. `Date.now()` during
 * render is impure and would be wrong anyway: the server's clock is not the
 * reader's, and a countdown that arrives pre-baked into HTML is stale before
 * it is painted. The reserved space stops the layout jumping when it lands.
 */
export function Countdown({
  to,
  className,
  /** Announced by screen readers when it first appears. */
  label = "Time left",
}: {
  /** ISO string. A Date would be serialised to one anyway crossing the
   *  server/client boundary, so it is stated as the string it really is. */
  to: string;
  className?: string;
  label?: string;
}) {
  const target = React.useMemo(() => new Date(to).getTime(), [to]);
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const tick = () => setRemaining(target - Date.now());
    tick();

    // A minute is plenty until the last hour. Ticking every second all week
    // would wake the tab 600,000 times to change nothing.
    const soon = target - Date.now() < 60 * 60 * 1000;
    const timer = window.setInterval(tick, soon ? 1000 : 30_000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (remaining === null) {
    return <span className={className} aria-hidden="true" />;
  }

  if (remaining <= 0) {
    return (
      <span className={className} role="status">
        <b className="countdown-closed">Closed</b>
      </span>
    );
  }

  const parts = split(remaining);

  return (
    <span className={className} role="timer" aria-label={`${label}: ${spoken(parts)}`}>
      {parts.days > 0 && <Unit value={parts.days} unit="d" />}
      <Unit value={parts.hours} unit="h" pad={parts.days > 0} />
      <Unit value={parts.minutes} unit="m" pad />
      {parts.days === 0 && parts.hours === 0 && <Unit value={parts.seconds} unit="s" pad />}
    </span>
  );
}

function Unit({ value, unit, pad }: { value: number; unit: string; pad?: boolean }) {
  return (
    <span className="countdown-unit">
      <b>{pad ? String(value).padStart(2, "0") : value}</b>
      <i>{unit}</i>
    </span>
  );
}

function split(ms: number) {
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function spoken(parts: ReturnType<typeof split>): string {
  const said: string[] = [];
  if (parts.days) said.push(`${parts.days} day${parts.days === 1 ? "" : "s"}`);
  if (parts.hours) said.push(`${parts.hours} hour${parts.hours === 1 ? "" : "s"}`);
  if (parts.days === 0) said.push(`${parts.minutes} minute${parts.minutes === 1 ? "" : "s"}`);
  return said.join(", ");
}
