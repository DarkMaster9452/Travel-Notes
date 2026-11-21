"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Toasts (design/DESIGN-SYSTEM.md §7.10): bottom right, top on a phone, three
 * at most. A confirmation leaves after five seconds; an error stays until it
 * is dismissed, because an error nobody saw is an error that never happened.
 */
export type ToastTone = "success" | "error";

type Toast = { id: number; text: string; tone: ToastTone };

type Push = (text: string, tone?: ToastTone) => void;

const ToastContext = createContext<Push | null>(null);

const MAX = 3;
const LIFE = 5000;

export function ToastProvider({
  children,
  dismissLabel = "Dismiss",
}: {
  children: React.ReactNode;
  dismissLabel?: string;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback<Push>(
    (text, tone = "success") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, text, tone }].slice(-MAX));
      if (tone !== "error") window.setTimeout(() => dismiss(id), LIFE);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-toast flex flex-col gap-2 md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:w-80"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex animate-rise-in items-start gap-3 rounded-card border border-border bg-surface-raised p-4 text-body-sm text-text shadow-2"
          >
            {toast.tone === "error" ? (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
            ) : (
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            )}
            <p className="min-w-0 flex-1">{toast.text}</p>
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={() => dismiss(toast.id)}
              className={cn(
                "-mr-1 -mt-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-control text-subtle",
                "transition-colors duration-fast hover:bg-surface-sunken hover:text-text",
              )}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns a no-op outside the provider, so a component can always call it. */
export function useToast(): Push {
  return useContext(ToastContext) ?? (() => {});
}
