import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Achievement stickers.
 *
 * The designs are ported from the sticker sheet in `index.html`. Each is drawn
 * on a 24×24 grid in the same stroke language — 1.6 weight, round caps, no
 * fills — so a new one can be added without the sheet losing its handwriting.
 *
 * Colour belongs to the sticker, not to its position. It started the other way
 * round, cycling four colours by `nth-child`, which was right for the eight on
 * the landing sheet and wrong the moment the same sticker began appearing in
 * three places: the sheet, the admin list and the unlock ceremony each dealt a
 * different colour to the same badge, so nobody could learn what one looked
 * like. Now the tone is part of the artwork and travels with it, and the ten
 * tones are grouped by what they are for — green for ground covered, water for
 * water, stone for height, gold for the rare ones — so the sheet reads as a
 * collection rather than as a bag of sweets.
 *
 * Tilt still comes from position. That one is decoration and should stay
 * decoration: a sheet where every sticker is straight looks printed, not
 * stuck on.
 */

/** The ten inks the sheet is printed in. Keep this list short on purpose. */
export type StickerTone =
  | "pine"
  | "moss"
  | "signal"
  | "night"
  | "stone"
  | "clay"
  | "water"
  | "berry"
  | "gold"
  | "copper";

type Artwork = {
  /** Two short lines, as printed on the sticker. */
  label: [string, string];
  /** Discs and rounded squares alternate down the sheet. */
  shape: "round" | "square";
  /** Which ink it is printed in. Fixed per sticker, everywhere it appears. */
  tone: StickerTone;
  path: React.ReactNode;
};

export const STICKER_ARTWORK: Record<string, Artwork> = {
  "first-light": {
    label: ["FIRST", "LIGHT"],
    shape: "round",
    tone: "signal",
    path: <path d="M2 19L9 7l4 7 3-4 6 9z" />,
  },
  "sunrise-10": {
    label: ["SUNRISE", "×10"],
    shape: "square",
    tone: "gold",
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
    tone: "night",
    path: <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />,
  },
  "roped-up": {
    label: ["ROPED", "UP"],
    shape: "square",
    tone: "clay",
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
    tone: "water",
    path: <path d="M2 9c3-2.4 5-2.4 8 0s5 2.4 8 0M2 15c3-2.4 5-2.4 8 0s5 2.4 8 0" />,
  },
  "deep-woods": {
    label: ["DEEP", "WOODS"],
    shape: "square",
    tone: "moss",
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
    tone: "stone",
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
    tone: "stone",
    path: (
      <>
        <path d="M6 3h4v7l7 4v7H4v-6l2-2z" />
        <path d="M4 17h13" />
      </>
    ),
  },

  /* Distance covered, rather than height gained: a road running to the edge of
     the frame, marked off. */
  "long-hauler": {
    label: ["LONG", "HAULER"],
    shape: "square",
    tone: "copper",
    path: (
      <>
        <path d="M3 20c4-3 5-8 9-11s6-3 9-5" />
        <path d="M6 17.5v2.5M11 12.5v2.5M16 7.5v2.5" />
      </>
    ),
  },

  /* The counted tiers. One mark, four strokes and a cross — a tally, which is
     what these are: how many times you actually went. */
  "ten-logged": {
    label: ["TEN", "LOGGED"],
    shape: "round",
    tone: "pine",
    path: <path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 16.5l16-9" />,
  },
  "fifty-logged": {
    label: ["FIFTY", "LOGGED"],
    shape: "square",
    tone: "pine",
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
    tone: "berry",
    path: (
      <>
        <path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 16.5l16-9" />
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6.5" />
      </>
    ),
  },

  /* ---- The rest of the sheet. -------------------------------------------
     Same hand throughout: a 24×24 grid, 1.6 stroke, round caps, no fills.
     Each design says what the achievement counts rather than decorating it —
     ascent stickers stack, distance stickers run off the edge of the frame,
     and the counted tiers keep the tally mark they started with. */

  "second-wind": {
    label: ["SECOND", "WIND"],
    shape: "square",
    tone: "moss",
    path: (
      <>
        <path d="M3 9h11a3 3 0 100-6" />
        <path d="M3 15h14a3 3 0 110 6" />
      </>
    ),
  },
  "into-the-trees": {
    label: ["INTO THE", "TREES"],
    shape: "round",
    tone: "moss",
    path: (
      <>
        <path d="M8 3l4 6H9.5l3.5 5.5H5L8.5 9H6z" />
        <path d="M8 14.5V21" />
        <path d="M16 8l3.5 5.5H17l2.5 4h-6l2.5-4h-2.5z" />
        <path d="M16 17.5V21" />
      </>
    ),
  },
  "first-ridge": {
    label: ["FIRST", "RIDGE"],
    shape: "square",
    tone: "stone",
    path: (
      <>
        <path d="M2 18l6-9 4 5.5 3-4 7 7.5z" />
        <path d="M8 9l1.8 2.6" />
      </>
    ),
  },
  "twenty-five": {
    label: ["25", "KM"],
    shape: "round",
    tone: "copper",
    path: (
      <>
        <path d="M3 18c4-1.5 7-5 9-9s5-5 9-5" />
        <path d="M6.5 16.5v3M13 11v3M19 4v3" />
      </>
    ),
  },
  "twenty-five-logged": {
    label: ["25", "LOGGED"],
    shape: "square",
    tone: "pine",
    path: (
      <>
        <path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 16.5l16-9" />
        <path d="M3 3h4M3 21h4" />
      </>
    ),
  },
  "two-hundred-logged": {
    label: ["TWO", "HUNDRED"],
    shape: "square",
    tone: "berry",
    path: (
      <>
        <path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 16.5l16-9" />
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6.5" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  "five-thousand-up": {
    label: ["5000 m", "UP"],
    shape: "round",
    tone: "stone",
    path: (
      <>
        <path d="M2 20l5-7 3 4 3.5-6 8.5 9z" />
        <path d="M12 8V2M9 4.5L12 2l3 2.5" />
      </>
    ),
  },
  everest: {
    label: ["8848", "METRES"],
    shape: "square",
    tone: "gold",
    path: (
      <>
        <path d="M2 20l7-13 4 7 2.5-4L22 20z" />
        <path d="M6.6 12.6h4.8M15.3 12.3h3" />
        <path d="M9 7l1.5-2.5 2 1" />
      </>
    ),
  },
  "ten-thousand-up": {
    label: ["10 000 m", "UP"],
    shape: "round",
    tone: "berry",
    path: (
      <>
        <path d="M2 21l4-6 2.5 3.5L12 12l3 5 2.5-3.5L22 21z" />
        <path d="M12 9V2M8.8 5L12 2l3.2 3" />
      </>
    ),
  },
  "twenty-five-thousand-up": {
    label: ["25 000 m", "UP"],
    shape: "square",
    tone: "gold",
    path: (
      <>
        <path d="M2 21l3.5-5 2 3L11 13l2.5 4 2-3L22 21z" />
        <path d="M4 9.5l4-4 3 2.5 3.5-4.5 4 4" />
      </>
    ),
  },
  "two-fifty-km": {
    label: ["250", "KM"],
    shape: "square",
    tone: "copper",
    path: (
      <>
        <path d="M2 19c3-.5 5-3 6.5-6S12 7 15 6s5-1.5 7-3" />
        <path d="M5 18v3M10 12v3M15.5 6.5v3M21 2.5v3" />
      </>
    ),
  },
  "five-hundred-km": {
    label: ["500", "KM"],
    shape: "round",
    tone: "copper",
    path: (
      <>
        <path d="M3 20c2-1 3-3 3.5-5.5S8 9 11 7.5 17 6 21 4" />
        <path d="M3.5 18.5v3M7 12.5v3M11.5 6.5v3M16 5v3M20.5 3v3" />
      </>
    ),
  },
  "thousand-km": {
    label: ["1000", "KM"],
    shape: "square",
    tone: "gold",
    path: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M2.5 12h19" />
        <path d="M12 2.5c2.6 2.6 4 5.9 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-5.9-4-9.5s1.4-6.9 4-9.5z" />
      </>
    ),
  },
  "ten-regions": {
    label: ["TEN", "REGIONS"],
    shape: "square",
    tone: "water",
    path: (
      <>
        <path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
        <path d="M9 4v13M15 6.5v13" />
        <path d="M6 11.5h1.5M11.5 9h1.5M17.5 12h1.5" />
      </>
    ),
  },
  "twenty-regions": {
    label: ["TWENTY", "REGIONS"],
    shape: "round",
    tone: "berry",
    path: (
      <>
        <path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
        <path d="M9 4v13M15 6.5v13" />
        <path d="M5.5 10h2M5.5 14h2M11 8.5h2M11 13h2M17 10.5h2M17 14.5h2" />
      </>
    ),
  },
  "border-crosser": {
    label: ["BORDER", "CROSSER"],
    shape: "round",
    tone: "signal",
    path: (
      <>
        <path d="M12 2v20" strokeDasharray="2.5 2.5" />
        <path d="M4 15c2.5-2 4-4.5 5-7" />
        <path d="M20 9c-2.5 2-4 4.5-5 7" />
      </>
    ),
  },
  "five-countries": {
    label: ["FIVE", "COUNTRIES"],
    shape: "square",
    tone: "gold",
    path: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M2.5 12h19M12 2.5a14 14 0 010 19a14 14 0 010-19z" />
        <path d="M5 6.5h3M16 17.5h3" />
      </>
    ),
  },
  "peak-bagger": {
    label: ["PEAK", "BAGGER"],
    shape: "round",
    tone: "stone",
    path: (
      <>
        <path d="M2 20l5.5-9 3.5 5 3-5 8 9z" />
        <path d="M7.5 11l-1-2.5 2.5.5M14 11l-1-2.5 2.5.5" />
      </>
    ),
  },
  "lake-district": {
    label: ["LAKE", "DISTRICT"],
    shape: "square",
    tone: "water",
    path: (
      <>
        <path d="M3 16c2.5-2 5-2 7.5 0s5 2 7.5 0" />
        <path d="M3 20c2.5-2 5-2 7.5 0s5 2 7.5 0" />
        <path d="M6 11l4-6 4 6" />
      </>
    ),
  },
  "waterfall-chaser": {
    label: ["WATERFALL", "CHASER"],
    shape: "round",
    tone: "water",
    path: (
      <>
        <path d="M6 3v10M10 3v13M14 3v11M18 3v9" />
        <path d="M3 19c2.5-2 5-2 7.5 0s5 2 7.5 0" />
      </>
    ),
  },
  /* ---- The podium. -------------------------------------------------------
     Not earned by walking far enough — earned by finishing in the top three
     of a closed leaderboard, which is the one thing on the sheet somebody
     else can take from you by having a better week.

     Two motifs, one per cadence, so a weekly finish and a monthly one are
     never the same sticker: the weekly is a medal on a ribbon, the monthly a
     summit under a pennant. Within a cadence the place is counted in dots —
     one for gold, two for silver, three for bronze — because a numeral at
     this size is a smudge, and the metal itself is carried by colour. */

  "weekly-gold": {
    label: ["WEEK", "GOLD"],
    shape: "round",
    path: (
      <>
        <path d="M8.4 2.4l3.6 5.2 3.6-5.2" />
        <circle cx="12" cy="14.4" r="6.9" />
        <circle cx="12" cy="14.4" r="1.15" />
      </>
    ),
  },
  "weekly-silver": {
    label: ["WEEK", "SILVER"],
    shape: "round",
    path: (
      <>
        <path d="M8.4 2.4l3.6 5.2 3.6-5.2" />
        <circle cx="12" cy="14.4" r="6.9" />
        <circle cx="10.1" cy="14.4" r="1.15" />
        <circle cx="13.9" cy="14.4" r="1.15" />
      </>
    ),
  },
  "weekly-bronze": {
    label: ["WEEK", "BRONZE"],
    shape: "round",
    path: (
      <>
        <path d="M8.4 2.4l3.6 5.2 3.6-5.2" />
        <circle cx="12" cy="14.4" r="6.9" />
        <circle cx="8.6" cy="14.4" r="1.15" />
        <circle cx="12" cy="14.4" r="1.15" />
        <circle cx="15.4" cy="14.4" r="1.15" />
      </>
    ),
  },

  "monthly-gold": {
    label: ["MONTH", "GOLD"],
    shape: "square",
    path: (
      <>
        <path d="M1.8 17.2L8.3 6.4l3.6 5.6 3-4.4 6.3 9.6z" />
        <path d="M12 1.4v4.6" />
        <path d="M12 1.4l4.5 1.5L12 4.4" />
        <circle cx="12" cy="20.6" r="1.15" />
      </>
    ),
  },
  "monthly-silver": {
    label: ["MONTH", "SILVER"],
    shape: "square",
    path: (
      <>
        <path d="M1.8 17.2L8.3 6.4l3.6 5.6 3-4.4 6.3 9.6z" />
        <path d="M12 1.4v4.6" />
        <path d="M12 1.4l4.5 1.5L12 4.4" />
        <circle cx="10.1" cy="20.6" r="1.15" />
        <circle cx="13.9" cy="20.6" r="1.15" />
      </>
    ),
  },
  "monthly-bronze": {
    label: ["MONTH", "BRONZE"],
    shape: "square",
    path: (
      <>
        <path d="M1.8 17.2L8.3 6.4l3.6 5.6 3-4.4 6.3 9.6z" />
        <path d="M12 1.4v4.6" />
        <path d="M12 1.4l4.5 1.5L12 4.4" />
        <circle cx="8.6" cy="20.6" r="1.15" />
        <circle cx="12" cy="20.6" r="1.15" />
        <circle cx="15.4" cy="20.6" r="1.15" />
      </>
    ),
  },

  "ruin-hunter": {
    label: ["RUIN", "HUNTER"],
    shape: "square",
    tone: "clay",
    path: (
      <>
        <path d="M4 21V9l3-2 3 2v3h4V7l3-2 3 2v14z" />
        <path d="M4 12h3M17 12h3M11 21v-4h2v4" />
      </>
    ),
  },
};

/** Anything not in the registry still renders — as the summit mark. */
const FALLBACK: Artwork = {
  label: ["SUMMIT", "QUEST"],
  shape: "round",
  tone: "pine",
  path: <path d="M2 19L9 7l4 7 3-4 6 9z" />,
};

export function Sticker({
  achievementKey,
  label,
  shape,
  locked,
  planLocked,
  title,
  fresh,
  freshDelay,
  className,
}: {
  /** Key into `STICKER_ARTWORK`. */
  achievementKey: string;
  /** Override the printed label. */
  label?: [string, string];
  shape?: "round" | "square";
  /** Locked stickers show the shape as an outline — visible, not yet yours. */
  locked?: boolean;
  /**
   * Out of reach on this plan, as opposed to merely unearned. Rendered as a
   * blur with the artwork and text unreadable: you can see there is something
   * there and that it isn't yours, and nothing else. Deliberately not just
   * `opacity` — the label must not be legible, or the sheet gives away the
   * whole set to an account that can't hold it.
   */
  planLocked?: boolean;
  /** Accessible name, e.g. "First Light — locked". */
  title?: string;
  /**
   * Earned since this account last looked. The sticker stamps down and takes
   * a shine across it once, then settles into the sheet like the rest.
   */
  fresh?: boolean;
  /** Stagger, in ms, when a run of fresh stickers lands together. */
  freshDelay?: number;
  className?: string;
}) {
  const art = STICKER_ARTWORK[achievementKey] ?? FALLBACK;
  const [top, bottom] = label ?? art.label;
  const resolvedShape = shape ?? art.shape;

  return (
    <div
      className={cn(
        "sticker",
        resolvedShape === "square" && "sq",
        locked && "locked",
        planLocked && "plan-locked",
        fresh && "is-fresh",
        className,
      )}
      // Tone is the sticker's own, not its position's, so the same badge is
      // the same colour on the sheet, in the admin list and in the ceremony.
      data-tone={art.tone}
      style={fresh && freshDelay ? { animationDelay: `${freshDelay}ms` } : undefined}
      role="img"
      // The blurred artwork is still readable to a screen reader unless the
      // name says otherwise, so locked-by-plan stickers announce only that.
      aria-label={planLocked ? "Locked sticker — upgrade to reach it" : (title ?? `${top} ${bottom}`)}
    >
      <div aria-hidden={planLocked || undefined}>
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
