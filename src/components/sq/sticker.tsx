import type { CSSProperties } from "react";

import { Glyph } from "@/components/sq/icons";
import { lockedStyle, SHAPE_RADIUS, stickerStyle } from "@/lib/stickers";

/**
 * One sticker, at whatever size the surface wants it.
 *
 * The die-cut and the ink come from `lib/stickers` rather than from the
 * caller, so the same sticker is the same sticker on the sheet, on the
 * dashboard panel and on somebody's public page. Only the size and the state
 * are the caller's to decide.
 */
export function SqSticker({
  sticker,
  size = 58,
  earned = true,
  fresh = false,
  index = 0,
  title,
}: {
  /** The `sticker` key from the achievement definition. */
  sticker: string;
  size?: number;
  earned?: boolean;
  /** Newly earned: one flip and a gold ring, once. */
  fresh?: boolean;
  /** Position in the sheet, for the stagger. */
  index?: number;
  title?: string;
}) {
  const style = earned ? stickerStyle(sticker) : lockedStyle(sticker);

  return (
    <span
      className="sq-sticker"
      data-locked={earned ? "0" : "1"}
      data-fresh={fresh ? "1" : "0"}
      title={title}
      style={
        {
          width: size,
          height: size,
          flex: `0 0 ${size}px`,
          borderRadius: SHAPE_RADIUS[style.shape],
          background: style.bg,
          color: style.fg,
          "--i": index,
        } as CSSProperties
      }
    >
      <Glyph name={style.glyph} size={Math.round(size * 0.46)} strokeWidth={1.9} />
    </span>
  );
}
