"use client";

import * as React from "react";

import { markStickersSeenAction } from "@/app/(app)/actions";

/**
 * The banner over a sheet that has something new on it.
 *
 * It also does the bookkeeping: once it has been on screen long enough for the
 * animation to finish, it tells the server these stickers have been seen, so
 * the celebration happens exactly once and a refresh five minutes later shows
 * an ordinary sheet.
 *
 * Marking happens after the animation rather than during the render that
 * produced it, on purpose. Marking first would mean a page that crashed
 * mid-render — or a reader who closed the tab in the first second — silently
 * spent the one moment the sticker had.
 */
export function FreshStickers({ ids, labels }: { ids: string[]; labels: string[] }) {
  const marked = React.useRef(false);

  React.useEffect(() => {
    if (marked.current || ids.length === 0) return;
    marked.current = true;
    const timer = window.setTimeout(() => {
      void markStickersSeenAction(ids);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [ids]);

  if (ids.length === 0) return null;

  const named =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;

  return (
    <div className="fresh-banner" role="status">
      <span className="fresh-spark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 2.5l2.3 5.9 5.9 2.3-5.9 2.3L12 18.9l-2.3-5.9L3.8 10.7l5.9-2.3z" />
          <path d="M19 16.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
        </svg>
      </span>
      <b>
        {ids.length === 1 ? "New sticker." : `${ids.length} new stickers.`}
      </b>
      <span>{named} — earned since you last looked.</span>
    </div>
  );
}
