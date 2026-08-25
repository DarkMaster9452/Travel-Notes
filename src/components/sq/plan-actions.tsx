"use client";

import { useState, useTransition } from "react";

import { useToast } from "@/components/sq/toast";

/**
 * Start a checkout, or open Stripe's own portal.
 *
 * Both are POSTs to routes that already exist and already re-check the
 * account server-side; this is the button, not the authority.
 */
export function SqCheckoutButton({
  plan,
  interval,
  label,
  variant = "primary",
  disabled,
}: {
  plan: "explorer" | "ultra";
  interval: "monthly" | "yearly";
  label: string;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={`sq-btn ${variant === "primary" ? "sq-btn-primary" : "sq-btn-ghost"}`}
      disabled={disabled || busy || pending}
      onClick={() => {
        setBusy(true);
        start(() => {
          void fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ plan, interval }),
          })
            .then((response) => response.json())
            .then((result: { ok?: boolean; url?: string; message?: string }) => {
              if (result.url) {
                window.location.href = result.url;
                return;
              }
              setBusy(false);
              toast(result.message ?? "Checkout would not open.", "stamp");
            })
            .catch(() => {
              setBusy(false);
              toast("Checkout would not open.", "stamp");
            });
        });
      }}
    >
      {busy ? "Opening…" : label}
    </button>
  );
}

export function SqPortalButton({ label = "Manage payment" }: { label?: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="sq-btn sq-btn-primary"
      style={{ background: "var(--pine)" }}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void fetch("/api/stripe/portal", { method: "POST" })
          .then((response) => response.json())
          .then((result: { url?: string; message?: string }) => {
            if (result.url) {
              window.location.href = result.url;
              return;
            }
            setBusy(false);
            toast(result.message ?? "The billing portal would not open.", "stamp");
          })
          .catch(() => {
            setBusy(false);
            toast("The billing portal would not open.", "stamp");
          });
      }}
    >
      {busy ? "Opening…" : label}
    </button>
  );
}
