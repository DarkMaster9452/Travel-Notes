"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { IconClose } from "./icons";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const noopSubscribe = () => () => {};

/**
 * False during server render and the first client render, true afterwards.
 * The portal needs a `document`, and rendering it before hydration has
 * finished would mismatch the server's markup.
 */
function useIsHydrated(): boolean {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * The dialog treatment from the landing page's auth modal, generalised.
 *
 * Focus moves in on open and returns to whatever opened it on close, Escape
 * and a scrim click both dismiss, and Tab is trapped inside — the admin queue
 * is driven from the keyboard, so a dialog that leaks focus is a real problem
 * rather than a nicety.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  labelledBy = "modal-title",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  labelledBy?: string;
  className?: string;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const hydrated = useIsHydrated();

  React.useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first field, which is what a login dialog should do; fall back
    // to the card itself so focus never stays behind the scrim.
    const first = cardRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? cardRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;

      const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!hydrated || !open) return null;

  return createPortal(
    <div
      className="modal-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        tabIndex={-1}
        className={cn("modal-card", className)}
      >
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
        {title && <h3 id={labelledBy}>{title}</h3>}
        {description && <p>{description}</p>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
