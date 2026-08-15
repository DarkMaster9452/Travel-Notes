import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Achievement stickers.
 *
 * The eight designs are ported from the sticker sheet in `index.html`. Each is
 * drawn on a 24×24 grid in the same stroke language — 1.6 weight, round caps,
 * no fills — so a new one can be added without the sheet losing its
 * handwriting. Colour and tilt come from position on the sheet, not from the
 * artwork, which is why a sticker is never told what colour it is.
 */

type Artwork = {
  /** Two short lines, as printed on the sticker. */
  label: [string, string];
  /** Discs and rounded squares alternate down the sheet. */
  shape: "round" | "square";
  path: React.ReactNode;
};

export const STICKER_ARTWORK: Record<string, Artwork> = {
  "first-light": {
    label: ["FIRST", "LIGHT"],
    shape: "round",
    path: <path d="M2 19L9 7l4 7 3-4 6 9z" />,
  },
  "sunrise-10": {
    label: ["SUNRISE", "×10"],
    shape: "square",
    path: (
      <>
        <circle cx="12" cy="12" r="4.6" />
        <path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9" />
      </>
    ),
  },
  "night-shift": {
    label: ["NIGHT", "SHIFT"],
    shape: "round",
    path: <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />,
  },
  "roped-up": {
    label: ["ROPED", "UP"],
    shape: "square",
    path: (
      <>
        <circle cx="8" cy="8" r="3.4" />
        <circle cx="16" cy="16" r="3.4" />
        <path d="M10.4 10.4l3.2 3.2" />
      </>
    ),
  },
  "gorge-rat": {
    label: ["GORGE", "RAT"],
    shape: "round",
    path: <path d="M2 9c3-2.4 5-2.4 8 0s5 2.4 8 0M2 15c3-2.4 5-2.4 8 0s5 2.4 8 0" />,
  },
  "deep-woods": {
    label: ["DEEP", "WOODS"],
    shape: "square",
    path: (
      <>
        <path d="M12 3l5 8h-3l4 7H6l4-7H7z" />
        <path d="M12 18v3" />
      </>
    ),
  },
  cartographer: {
    label: ["5", "REGIONS"],
    shape: "round",
    path: (
      <>
        <path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
        <path d="M9 4v13M15 6.5v13" />
      </>
    ),
  },
  "thousand-metres": {
    label: ["1000 m", "IN ONE GO"],
    shape: "square",
    path: (
      <>
        <path d="M6 3h4v7l7 4v7H4v-6l2-2z" />
        <path d="M4 17h13" />
      </>
    ),
  },

  /* The counted tiers. One mark, four strokes and a cross — a tally, which is
     what these are: how many times you actually went. */
  "ten-logged": {
    label: ["TEN", "LOGGED"],
    shape: "round",
    path: <path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 16.5l16-9" />,
  },
  "fifty-logged": {
    label: ["FIFTY", "LOGGED"],
    shape: "square",
    path: (
      <>
        <path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 16.5l16-9" />
        <circle cx="12" cy="12" r="10" />
      </>
    ),
  },
  "hundred-logged": {
    label: ["HUNDRED", "LOGGED"],
    shape: "round",
    path: (
      <>
        <path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 16.5l16-9" />
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6.5" />
      </>
    ),
  },
};

/** Anything not in the registry still renders — as the summit mark. */
const FALLBACK: Artwork = {
  label: ["SUMMIT", "QUEST"],
  shape: "round",
  path: <path d="M2 19L9 7l4 7 3-4 6 9z" />,
};

export function Sticker({
  achievementKey,
  label,
  shape,
  locked,
  title,
  className,
}: {
  /** Key into `STICKER_ARTWORK`. */
  achievementKey: string;
  /** Override the printed label. */
  label?: [string, string];
  shape?: "round" | "square";
  /** Locked stickers show the shape as an outline — visible, not yet yours. */
  locked?: boolean;
  /** Accessible name, e.g. "First Light — locked". */
  title?: string;
  className?: string;
}) {
  const art = STICKER_ARTWORK[achievementKey] ?? FALLBACK;
  const [top, bottom] = label ?? art.label;
  const resolvedShape = shape ?? art.shape;

  return (
    <div
      className={cn("sticker", resolvedShape === "square" && "sq", locked && "locked", className)}
      role="img"
      aria-label={title ?? `${top} ${bottom}`}
    >
      <div>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {art.path}
        </svg>
        <b>
          {top}
          <br />
          {bottom}
        </b>
      </div>
    </div>
  );
}

/** The sheet the stickers sit on, dashed trim and all. */
export function StickerSheet({
  tag,
  children,
  className,
}: {
  tag?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("sheet", className)}>
      {tag && <span className="sheet-tag">{tag}</span>}
      {children}
    </div>
  );
}
