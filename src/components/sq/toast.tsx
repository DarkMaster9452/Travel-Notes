"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; text: string; tone: "plain" | "stamp" };

const ToastContext = createContext<((text: string, tone?: Toast["tone"]) => void) | null>(null);

/**
 * Bottom-left, one at a time or stacked, gone after four seconds.
 *
 * Deliberately not a queue with a cap: a confirmation nobody sees is not worth
 * holding, and two arriving together is a real thing that happens when a form
 * saves and a background job reports at the same moment.
 */
export function SqToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Toast["tone"] = "plain") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="sq-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="sq-toast"
            style={
              toast.tone === "stamp"
                ? { background: "var(--signal)", color: "#fff" }
                : undefined
            }
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns a no-op outside the provider, so a component can always call it. */
export function useToast() {
  return useContext(ToastContext) ?? (() => {});
}
