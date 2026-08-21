import * as React from "react";

import { cn } from "@/lib/utils";
import { ART_H, ART_W, crestPath, questArt, ridgePath } from "@/lib/quest/art";

/**
 * The engraved landscape a quest wears. See `lib/quest/art` for why it exists
 * and what decides its shape.
 *
 * Two sizes, one drawing:
 *
 * - `mark` sits inside a quest card, behind the type, quiet enough that it is
 *   texture rather than content. It is the one that does the recognising: you
 *   see the same silhouette on the dashboard and in your history and know it
 *   is the same quest before reading the title.
 * - `band` is the full-width version above the sheet, used where a quest has
 *   no photograph. It is deliberately not a stand-in for one — nothing about
 *   it claims to be the place.
 *
 * Purely decorative in both, so it is hidden from assistive technology: it
 * carries no information the page does not also say in words.
 */
export function QuestArt({
  seed,
  tags,
  variant = "mark",
  className,
}: {
  /** The quest id. Stable for the life of the quest. */
  seed: string;
  /** Terrain and features, which decide the ink. */
  tags?: readonly string[];
  variant?: "mark" | "band";
  className?: string;
}) {
  const art = questArt(seed, tags);
  const gradientId = React.useId();

  return (
    <svg
      className={cn("quest-art", `quest-art-${variant}`, className)}
      data-tone={art.tone}
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* The sky. Two stops of the same ink so the band has a horizon
            without introducing a second colour into the palette. */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={ART_W} height={ART_H} fill={`url(#${gradientId})`} />

      {art.crescent ? (
        // A moon is a disc with a bite out of it — drawn as two circles with
        // `evenodd` rather than as a masked shape, so it survives being
        // inlined into HTML with no external references to resolve.
        <path
          className="quest-art-disc"
          fillRule="evenodd"
          d={`M${art.disc.x} ${art.disc.y} m${-art.disc.r} 0 a${art.disc.r} ${art.disc.r} 0 1 0 ${art.disc.r * 2} 0 a${art.disc.r} ${art.disc.r} 0 1 0 ${-art.disc.r * 2} 0 Z
              M${art.disc.x + art.disc.r * 0.45} ${art.disc.y} m${-art.disc.r} 0 a${art.disc.r} ${art.disc.r} 0 1 0 ${art.disc.r * 2} 0 a${art.disc.r} ${art.disc.r} 0 1 0 ${-art.disc.r * 2} 0 Z`}
        />
      ) : (
        <circle className="quest-art-disc" cx={art.disc.x} cy={art.disc.y} r={art.disc.r} />
      )}

      {art.marks.map((mark, index) => (
        <path
          key={index}
          className="quest-art-mark"
          d={`M${mark.x - 3} ${mark.y} q3 -2.4 6 0`}
        />
      ))}

      {/* Back to front, each ridge a shade more solid than the one behind and
          edged with its own crest line so the layers stay separable. */}
      {art.ridges.map((ridge, index) => (
        <g key={index} style={{ opacity: 0.2 + (index / art.ridges.length) * 0.62 }}>
          <path className="quest-art-ridge" d={ridgePath(ridge)} />
          <path className="quest-art-crest" d={crestPath(ridge)} />
        </g>
      ))}
    </svg>
  );
}
