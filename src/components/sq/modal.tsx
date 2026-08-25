"use client";

import { useEffect } from "react";

/**
 * Backdrop fades, panel rises and scales. Escape closes, focus is trapped by
 * the browser's own inertness rather than by a hand-rolled loop: the dialog is
 * the only interactive thing on screen while it is open.
 */
export function SqModal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="sq-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sq-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sq-section-head" style={{ marginBottom: 16 }}>
          <h2 className="sq-h2" style={{ fontSize: 22 }}>
            {title}
          </h2>
          <button type="button" className="sq-btn sq-btn-ghost sq-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
        {footer ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
