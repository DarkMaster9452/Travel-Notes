"use client";

import { useEffect, useRef } from "react";

import { markStickersSeenAction } from "@/app/(app)/actions";

/**
 * Tell the server which stickers have now been celebrated.
 *
 * Stickers are derived, so there is no row whose creation marks the moment one
 * was earned — `User.seenAchievements` is what makes "new since you last
 * looked" answerable at all, and it is why the sheet can flip a sticker exactly
 * once instead of every time somebody opens the page.
 *
 * The action to write it has existed since the sheet was built and was never
 * called from anywhere, so the column stayed empty and every earned sticker
 * re-flipped on every visit. This is the caller: it renders nothing, fires once
 * after the animation has had its moment, and is guarded by a ref so the
 * revalidation the action triggers cannot bounce it into a loop.
 */
export function SqStickersSeen({ ids }: { ids: string[] }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || ids.length === 0) return;
    sent.current = true;

    // Long enough for the flip and the gold ring to play out. Celebrating and
    // then immediately marking it seen would be correct and would also mean
    // navigating away mid-animation loses the only showing it ever gets.
    const timer = window.setTimeout(() => {
      void markStickersSeenAction(ids);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [ids]);

  return null;
}
