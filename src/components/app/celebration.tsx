"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { createPortal } from "react-dom";

import { AwardBadge } from "@/components/ui/award-badge";
import { IconClose } from "@/components/ui/icons";
import type { IconName } from "@/components/ui/icons";

/**
 * The moment something is earned.
 *
 * Shown when a quest is completed and when an achievement unlocks. It is a
 * dialog, not a toast: it takes focus, closes on Escape or a click outside,
 * and steps through a queue when several achievements land at once. With
 * reduced motion the same content appears without the spring or the rays.
 */

export type CelebrationItem = {
  id: string;
  eyebrow: string;
  title: string;
  message?: string;
  icon?: IconName;
};

export function Celebration({
  items,
  onDismiss,
}: {
  items: CelebrationItem[];
  onDismiss?: () => void;
}) {
  const reduced = useReducedMotion();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  // A new batch of awards restarts the queue. Seeding `open` from the first
  // render instead would mean a celebration that arrives later — which is
  // every completion — never opens at all.
  const batch = items.map((item) => item.id).join("|");
  const [seenBatch, setSeenBatch] = React.useState(batch);
  const [index, setIndex] = React.useState(0);
  const [done, setDone] = React.useState(false);

  if (seenBatch !== batch) {
    setSeenBatch(batch);
    setIndex(0);
    setDone(false);
  }

  const current = done ? undefined : items[index];

  const close = React.useCallback(() => {
    setDone(true);
    onDismiss?.();
  }, [onDismiss]);

  const next = React.useCallback(() => {
    setIndex((i) => {
      if (i + 1 < items.length) return i + 1;
      setDone(true);
      onDismiss?.();
      return i;
    });
  }, [items.length, onDismiss]);

  React.useEffect(() => {
    if (!current) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [current, close]);

  // Portalled to the body on purpose. This is triggered from inside the quest
  // page's sticky action bar, which carries `backdrop-blur` — and a
  // backdrop-filter makes its element a containing block for `position: fixed`
  // descendants, so an in-place overlay centred itself on the bar and hung off
  // the bottom of the screen instead of covering it.
  // No document during SSR. The component's own slot renders nothing either
  // way — portal content lives on `body`, not here — so there is no hydration
  // mismatch to guard against with mounted-state.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {current && (
        <motion.div
          key="celebration"
          role="dialog"
          aria-modal="true"
          aria-label={`${current.eyebrow}: ${current.title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={
              reduced ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 22 }
            }
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card p-8 text-center shadow-2xl"
          >
            {/* Rays behind the badge. Decorative, so it goes when motion is reduced. */}
            {!reduced && (
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 0.5, rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
                className="pointer-events-none absolute left-1/2 top-16 -z-10 size-[26rem] -translate-x-1/2 -translate-y-1/2"
                style={{
                  background:
                    "repeating-conic-gradient(from 0deg, rgba(154,161,51,0.22) 0deg 8deg, transparent 8deg 22deg)",
                  maskImage: "radial-gradient(circle, black 10%, transparent 68%)",
                  WebkitMaskImage: "radial-gradient(circle, black 10%, transparent 68%)",
                }}
              />
            )}

            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Dismiss"
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <IconClose size={18} />
            </button>

            <div className="flex justify-center">
              <AwardBadge eyebrow={current.eyebrow} title={current.title} icon={current.icon} />
            </div>

            <h2 className="mt-7 font-display text-2xl font-extrabold normal-case">
              {current.title}
            </h2>
            {current.message && (
              <p className="mt-2 text-sm leading-relaxed text-muted">{current.message}</p>
            )}

            <button
              type="button"
              onClick={items.length > 1 && index + 1 < items.length ? next : close}
              className="mt-7 h-11 w-full rounded-lg bg-ink text-sm font-semibold text-paper transition-colors hover:bg-moss"
            >
              {index + 1 < items.length ? `Next (${index + 1}/${items.length})` : "Nice"}
            </button>

            {!reduced && <p className="mt-3 text-xs text-muted">Hover the badge to tilt it.</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
