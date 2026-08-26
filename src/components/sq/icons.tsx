/**
 * The mark and the glyph set.
 *
 * Path data only — the peak, the ridge, the leaf and the rest are the same
 * outlines the field guide has always drawn, carried over as raw `d`
 * attributes. Everything about how they are *rendered* (stroke weight, caps,
 * sizing) is stated here once so a glyph cannot drift between screens.
 *
 * Lucide's drawing conventions: stroke-width 2.6–2.75 on a 24-unit grid,
 * round caps and joins.
 */

export type GlyphName = keyof typeof GLYPHS;

export const GLYPHS = {
  peak: "M3 19L9.5 8l3.7 6.4 2.3-3.3L21 19H3z",
  ridge: "M2 19l5.5-9 3 5 3-7 3.5 6.5 3 4.5H2z",
  map: "M9 4.5L4 6.3v13.2L9 17.7l6 2.8 5-1.9V5.4l-5 1.9-6-2.8z",
  marker: "M12 21s-6.8-6.3-6.8-11.2a6.8 6.8 0 1113.6 0C18.8 14.7 12 21 12 21z",
  laurel: "M9 13.8l-1.6 6.8L12 18l4.6 2.6-1.6-6.8",
  laurelRing: "M17.4 9.4a5.4 5.4 0 11-10.8 0 5.4 5.4 0 0110.8 0z",
  sun: "M12 3.2v2.4M12 18.4v2.4M4.6 12H7M17 12h2.4M6.7 6.7l1.7 1.7M15.6 15.6l1.7 1.7M17.3 6.7l-1.7 1.7M8.4 15.6l-1.7 1.7M16.4 12a4.4 4.4 0 11-8.8 0 4.4 4.4 0 018.8 0z",
  book: "M4.5 5.4c1.9-.9 4.5-.9 7.5.4V19c-3-1.3-5.6-1.3-7.5-.4V5.4zM19.5 5.4c-1.9-.9-4.5-.9-7.5.4V19c3-1.3 5.6-1.3 7.5-.4V5.4z",
  ascent: "M4 19l5-7 3 3.5L20 5M20 5h-4.6M20 5v4.6",
  retreat: "M4.5 9.5h10a4.6 4.6 0 010 9.2H9M4.5 9.5l3.8-3.8M4.5 9.5l3.8 3.8",
  winter: "M12 3.5v17M4.6 7.7l14.8 8.6M19.4 7.7L4.6 16.3",
  peaks: "M2 19l4.4-6.5L9.4 17l3.2-5 2.4 3.4L18 11l4 8H2z",
  compass: "M12 21a9 9 0 100-18 9 9 0 000 18zM14.8 9.2l-1.6 4.4-4.4 1.6 1.6-4.4 4.4-1.6z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.4V12l3 1.8",
  lock: "M5 10.5h14v9.5H5zM8.2 10.5V7.6a3.8 3.8 0 017.6 0v2.9",
  chevron: "M3 8h10M9 4l4 4-4 4",
  arrowRight: "M4 12h15M13 6l6 6-6 6",
  check: "M4.5 12.5l5 5 10-11",
  cross: "M6 6l12 12M18 6L6 18",
  undo: "M4 9h11a5 5 0 010 10H9M4 9l4-4M4 9l4 4",
  plus: "M12 5v14M5 12h14",
  search: "M11 18.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16.5 16.5L21 21",
  camera:
    "M3.5 8.5h3.2l1.6-2.4h7.4l1.6 2.4h3.2v11h-17zM12 16.8a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2z",
  users: "M8.5 11a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM2 20.5c0-3.4 2.9-5.7 6.5-5.7s6.5 2.3 6.5 5.7M16.5 5.2a3.4 3.4 0 010 6.6M18 15.2c2.4.6 4 2.5 4 5.3",
  coin: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.6 9.4c0-1.3 1.1-2 2.4-2s2.4.6 2.4 1.8M14.4 14.6c0 1.3-1.1 2-2.4 2s-2.4-.7-2.4-1.9M12 6v12",
  database: "M12 7.6c4.4 0 8-1 8-2.3S16.4 3 12 3 4 4 4 5.3s3.6 2.3 8 2.3zM4 5.3v13.4C4 20 7.6 21 12 21s8-1 8-2.3V5.3M4 12c0 1.3 3.6 2.3 8 2.3s8-1 8-2.3",
  inbox: "M3.5 13.5h4l1.6 3h5.8l1.6-3h4M3.5 13.5L6 4.5h12l2.5 9v6h-17z",
  calendar: "M4 6.5h16v14H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5",
  shield: "M12 3l7.5 3v6c0 4.4-3.2 7.8-7.5 9.3C7.7 19.8 4.5 16.4 4.5 12V6L12 3z",
  grid: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  gear: "M12 15.4a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8zM19.6 14.4l1.9 1.1-2 3.5-2.1-.9a7.7 7.7 0 01-1.9 1.1l-.3 2.3h-4l-.3-2.3a7.7 7.7 0 01-1.9-1.1l-2.1.9-2-3.5 1.9-1.1a7.9 7.9 0 010-2.2L3 10.1l2-3.5 2.1.9c.6-.5 1.2-.8 1.9-1.1L9.3 4h4l.3 2.4c.7.3 1.3.6 1.9 1.1l2.1-.9 2 3.5-1.9 1.1c.1.7.1 1.5 0 2.2z",
  envelope: "M3.5 6h17v12h-17zM3.5 6.4l8.5 6.6 8.5-6.6",
  none: "M0 0",
} as const;

export function Glyph({
  name,
  size = 20,
  strokeWidth = 2.65,
  ...rest
}: { name: GlyphName; size?: number; strokeWidth?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={GLYPHS[name]} />
      {name === "laurel" ? <path d={GLYPHS.laurelRing} /> : null}
    </svg>
  );
}

/** The brand mark: pine outline peak, stamp-filled inner triangle, baseline rule. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ flex: `0 0 ${size}px` }}
    >
      <path
        d="M2 25 L11 10 L16.5 19 L20 13.5 L30 25 Z"
        fill="none"
        stroke="var(--pine)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M11 10 L14.6 16 L7.4 16 Z" fill="var(--signal)" />
      <path
        d="M2 29 H30"
        fill="none"
        stroke="var(--pine)"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/** The filled silhouette of the same peak, used on medals and podium discs. */
export function LogoSilhouette({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M3 51 L22 15 L33 34 L40 22 L61 51 Z" fill="#1e3b2c" />
      <path d="M22 15 L30.5 30 L13.5 30 Z" fill="#c4481b" />
    </svg>
  );
}

/** Strava's chevron mark, drawn rather than fetched. */
export function StravaMark({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.4 2L3 14.2h3.8L9.4 9l2.6 5.2h3.8L9.4 2z" />
      <path d="M15.8 14.2L14.3 17l-1.5-2.8H10L14.3 22l4.3-7.8h-2.8z" />
    </svg>
  );
}

export function Chevron({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** The padlock on a sealed future slot. Drawn on the field guide's 44-unit grid. */
export function LockGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="9" y="19" width="26" height="19" rx="4" stroke="currentColor" strokeWidth="2.6" />
      <path d="M15 19v-5a7 7 0 0114 0v5" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  );
}
