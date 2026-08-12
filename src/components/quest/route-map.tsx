import { cn } from "@/lib/utils";

export type Waypoint = { lat: number; lng: number; label: string };

/**
 * Schematic route preview.
 *
 * Deliberately not a slippy map: it is drawn from the quest's own waypoints,
 * needs no tile provider or API key, and reads as a sketch rather than
 * pretending to be turn-by-turn navigation. The "open in maps" link is what
 * actually gets you there.
 */
export function RouteMap({
  waypoints,
  className,
}: {
  waypoints: Waypoint[];
  className?: string;
}) {
  if (waypoints.length < 2) return null;

  const lats = waypoints.map((w) => w.lat);
  const lngs = waypoints.map((w) => w.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const padding = 12;
  const spanLat = Math.max(0.0001, maxLat - minLat);
  const spanLng = Math.max(0.0001, maxLng - minLng);

  const points = waypoints.map((w) => ({
    ...w,
    x: padding + ((w.lng - minLng) / spanLng) * (100 - padding * 2),
    // SVG y grows downwards; north should be up.
    y: padding + ((maxLat - w.lat) / spanLat) * (100 - padding * 2),
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className={cn("relative aspect-[3/2] w-full bg-ink-soft", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" role="img" aria-label="Schematic route preview">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="rgba(198,198,145,0.08)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        <path d={path} fill="none" stroke="var(--color-ember-light)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={index === 0 ? 2 : 1.4}
              fill={index === 0 ? "var(--color-paper)" : "var(--color-ember-light)"}
            />
          </g>
        ))}
      </svg>

      <ol className="absolute inset-x-0 bottom-0 flex flex-wrap gap-x-4 gap-y-1 bg-ink/70 px-4 py-3 text-[0.625rem] font-semibold tracking-[0.14em] uppercase text-paper/70">
        {waypoints.slice(0, 4).map((w, i) => (
          <li key={`${w.label}-${i}`}>
            {String(i + 1).padStart(2, "0")} {w.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
