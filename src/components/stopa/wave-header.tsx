import Link from "next/link";

/**
 * The contour-line header.
 *
 * Two copies of the same wave band sit side by side and drift left forever, so
 * the loop is seamless. It is CSS-only and marked aria-hidden — decoration
 * should never reach a screen reader, and it stops entirely under
 * prefers-reduced-motion.
 */
function ContourBand() {
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      className="h-full w-[600px] shrink-0"
      aria-hidden="true"
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const y = 14 + i * 11;
        const amplitude = 6 + (i % 3) * 2.5;
        return (
          <path
            key={i}
            d={`M0 ${y} C 100 ${y - amplitude}, 200 ${y + amplitude}, 300 ${y} S 500 ${y - amplitude}, 600 ${y}`}
            fill="none"
            stroke="#f2efe4"
            strokeOpacity={0.22 + (i % 4) * 0.05}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

export function WaveHeader({
  points,
  href = "/home",
}: {
  points: number;
  href?: string;
}) {
  return (
    <header className="relative overflow-hidden bg-forest-deep">
      <div
        className="pointer-events-none absolute inset-0 flex motion-safe:[animation:drift_38s_linear_infinite]"
        aria-hidden="true"
      >
        <ContourBand />
        <ContourBand />
      </div>

      <div className="relative flex items-center justify-between px-5 py-5">
        <Link href={href} className="flex items-center gap-2.5 text-cream">
          <MountainMark />
          <span className="wordmark text-2xl">STOPA</span>
        </Link>

        <span className="flex items-center gap-2 font-serif text-lg text-cream tabular-nums">
          <FlameMark />
          {points} b.
        </span>
      </div>
    </header>
  );
}

function MountainMark() {
  return (
    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" aria-hidden="true">
      <path
        d="M2 21 L11 5 L16 13 L20 8 L28 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameMark() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
      <path
        d="M8 1c2.5 3.2 5.5 5 5.5 9A5.5 5.5 0 0 1 2.5 10C2.5 7.5 4 6 5 4.5c.4 1.4 1.2 2 2 2.2C7.2 5 7.5 3 8 1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
