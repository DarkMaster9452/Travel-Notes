"use client";

import * as React from "react";

import { useToast } from "@/components/field";
import type { BillingInterval } from "@/lib/config";

async function post(endpoint: string, body?: unknown) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await response.json()) as { ok: boolean; url?: string; message?: string };
}

/**
 * Starts Stripe Checkout.
 *
 * Without Stripe keys the button is disabled and says so, rather than throwing
 * when it is pressed — a deployment without billing configured should degrade
 * to an honest dead end, not an error.
 */
export function CheckoutButton({
  interval = "monthly",
  enabled,
  label = "Start with Explorer",
  className = "btn btn-primary",
}: {
  interval?: BillingInterval;
  enabled: boolean;
  label?: string;
  className?: string;
}) {
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  if (!enabled) {
    return (
      <button type="button" className={className} disabled title="Checkout isn't configured yet">
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await post("/api/stripe/checkout", { interval }).catch(() => null);
        if (result?.ok && result.url) {
          window.location.href = result.url;
          return;
        }
        setPending(false);
        toast({
          title: "Checkout didn't open.",
          detail: result?.message ?? "Try again in a moment.",
          tone: "warm",
        });
      }}
    >
      {pending ? "Opening checkout…" : label}
    </button>
  );
}

/** Opens the Stripe customer portal for an existing subscriber. */
export function BillingActions({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  if (!enabled) {
    return <p className="note mt-0">Billing isn&apos;t configured on this deployment.</p>;
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await post("/api/stripe/portal").catch(() => null);
          if (result?.ok && result.url) {
            window.location.href = result.url;
            return;
          }
          setPending(false);
          toast({
            title: "The billing portal didn't open.",
            detail: result?.message ?? "Try again in a moment.",
            tone: "warm",
          });
        }}
      >
        {pending ? "Opening…" : "Manage billing"}
      </button>
    </div>
  );
}
