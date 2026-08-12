"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/primitives";
import type { BillingInterval } from "@/lib/config";
import { cn } from "@/lib/utils";

async function post(endpoint: string, body?: unknown) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await response.json()) as { ok: boolean; url?: string; message?: string };
}

/** Starts Stripe Checkout. Disabled — with an explanation — when unconfigured. */
export function CheckoutButton({
  interval = "monthly",
  enabled,
  label = "Unlock unlimited quests",
  className,
}: {
  interval?: BillingInterval;
  enabled: boolean;
  label?: string;
  className?: string;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!enabled) {
    return (
      <div className={cn("space-y-3", className)}>
        <Button variant="ember" size="xl" disabled className="w-full sm:w-auto">
          {label}
        </Button>
        <p className="text-xs text-paper/50">
          Stripe keys aren&apos;t set on this deployment yet, so checkout is switched off.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        variant="ember"
        size="xl"
        disabled={pending}
        className="w-full sm:w-auto"
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await post("/api/stripe/checkout", { interval }).catch(() => null);
          if (result?.ok && result.url) {
            window.location.href = result.url;
            return;
          }
          setPending(false);
          setError(result?.message ?? "Checkout didn't open. Try again in a moment.");
        }}
      >
        {pending && <Spinner />}
        {pending ? "Opening checkout" : label}
        <span aria-hidden="true">→</span>
      </Button>
      {error && (
        <p role="alert" className="text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}

/** Opens the Stripe customer portal for an existing subscriber. */
export function BillingActions({ enabled, className }: { enabled: boolean; className?: string }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        variant="outlineLight"
        size="lg"
        disabled={pending || !enabled}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await post("/api/stripe/portal").catch(() => null);
          if (result?.ok && result.url) {
            window.location.href = result.url;
            return;
          }
          setPending(false);
          setError(result?.message ?? "Couldn't open the billing portal.");
        }}
      >
        {pending && <Spinner />}
        Manage billing
      </Button>
      {!enabled && (
        <p className="text-xs text-paper/50">Billing isn&apos;t configured on this deployment.</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
