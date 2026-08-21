"use client";

import { animate, utils } from "animejs";
import * as React from "react";

import { unstyle, usePrefersReducedMotion } from "@/components/motion/anime";
import { EASE_FIELD } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { IconClose } from "./icons";

export type ToastTone = "pine" | "warm";

export type Toast = {
  id: number;
  title: React.ReactNode;
  /** Mono line underneath. Metadata, not a second sentence of prose. */
  detail?: React.ReactNode;
  tone?: ToastTone;
};

type ToastInput = Omit<Toast, "id">;

const ToastContext = React.createContext<((toast: ToastInput) => void) | null>(null);

const DISMISS_AFTER_MS = 6000;

/**
 * Toasts announce things that happened elsewhere — a proof approved by an
 * admin, a sticker unlocked, a join request accepted. Mounted once at the root
 * so any surface can raise one.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = React.useCallback(
    (toast: ToastInput) => {
      const id = (nextId.current += 1);
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* Polite: a toast never interrupts what is being read. */}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * One toast, sliding in from the edge it is anchored to.
 *
 * A toast is the one thing in the product that appears without being asked
 * for, so it has to be noticed and then forgotten. It arrives from off-screen
 * right with a touch of overshoot — motion in the corner of the eye is what
 * makes it noticed — and then holds perfectly still, because a message that
 * keeps moving is a message you have to keep looking at.
 */
function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const card = ref.current;
    if (reduced || !card) return;

    const animation = animate(card, {
      opacity: [0, 1],
      translateX: [40, 0],
      scale: [0.96, 1],
      duration: 460,
      ease: EASE_FIELD,
      onComplete: () => unstyle(card),
    });

    return () => {
      animation.pause();
      utils.set(card, { opacity: 1, translateX: 0, scale: 1 });
    };
  }, [reduced]);

  return (
    <div ref={ref} className={cn("toast", toast.tone === "warm" && "warm")}>
      <div>
        <b>{toast.title}</b>
        {toast.detail && <p>{toast.detail}</p>}
      </div>
      <button type="button" className="toast-x" onClick={onDismiss} aria-label="Dismiss">
        <IconClose width={13} height={13} />
      </button>
    </div>
  );
}

/**
 * Raise a toast. Outside a provider this is a no-op rather than a throw — a
 * missing provider should not take a page down over a status message.
 */
export function useToast(): (toast: ToastInput) => void {
  const push = React.useContext(ToastContext);
  return React.useCallback(
    (toast: ToastInput) => {
      if (!push) {
        console.warn("[toast] no ToastProvider mounted; dropped:", toast.title);
        return;
      }
      push(toast);
    },
    [push],
  );
}
