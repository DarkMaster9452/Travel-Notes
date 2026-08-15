"use client";

import * as React from "react";

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
          <div key={toast.id} className={cn("toast", toast.tone === "warm" && "warm")}>
            <div>
              <b>{toast.title}</b>
              {toast.detail && <p>{toast.detail}</p>}
            </div>
            <button
              type="button"
              className="toast-x"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
            >
              <IconClose width={13} height={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
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
