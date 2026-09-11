"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { SqUnlockCelebration } from "@/components/sq/unlock";
import { useToast } from "@/components/sq/toast";
import { completeCheckoutAction, startCheckoutAction } from "@/app/(app)/settings/plan-actions";
import type { Capability } from "@/lib/config";

/**
 * Buy a plan, without leaving the page.
 *
 * Stripe's Embedded Checkout is a Checkout Session — the same server-side
 * object a redirect-based integration would use, so proration, coupons, tax
 * and 3-D Secure are all Stripe's problem — rendered into an iframe on this
 * page instead of Stripe's own domain. That is the whole reason this file is
 * this short: unlike the old Paddle overlay, completion is scoped to wherever
 * one of these is mounted, so there is no page-wide listener to attach, no
 * script-load singleton to fan events out from, and no window-level callback
 * that can be registered too late.
 *
 * The server decides which price this account may buy (`startCheckoutAction`)
 * and the server decides whether anything was actually paid for
 * (`completeCheckoutAction`, which reads Stripe rather than believing the
 * browser). This one component is the button, the embed, and the celebration
 * on success — every caller gets all three for free, and `onSuccess` is only
 * for a caller that has something extra of its own to do, like closing the
 * sheet it was opened from.
 */

/** Missing at build time means this deployment cannot sell; the button says so. */
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/**
 * Stripe.js, loaded once per page and shared.
 *
 * Module scope rather than a hook's state: the script is a singleton on the
 * window whatever we do, and two buy buttons on the same pricing table would
 * otherwise each pull it down. The promise is cached rather than the instance
 * so simultaneous callers wait on one load instead of racing two.
 */
let stripePromise: Promise<Stripe | null> | null = null;

function loadStripeOnce(): Promise<Stripe | null> {
  if (PUBLISHABLE_KEY.length === 0) return Promise.resolve(null);
  stripePromise ??= loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

type CheckoutSession = { clientSecret: string; sessionId: string };

export function SqCheckoutEmbed({
  plan,
  interval,
  label,
  variant = "primary",
  disabled,
  onSuccess,
}: {
  plan: "explorer" | "ultra";
  interval: "monthly" | "yearly";
  label: string;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  /** Called once a purchase is confirmed, after the celebration is dismissed. */
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [bought, setBought] = useState<{ name: string; gains: Capability[] } | null>(null);

  // The session id this embed was mounted with is what proves a completion
  // belongs to *this* purchase — captured once, when the session was created,
  // rather than trusted from anything the iframe reports back.
  const handleComplete = useCallback(() => {
    if (!session) return;
    void completeCheckoutAction(session.sessionId).then((result) => {
      if (result.ok) {
        // The celebration, not a toast. Somebody has just paid, and the page
        // behind them is still rendered for the plan they had a moment ago —
        // the refresh happens when they close it.
        setBought({ name: result.name, gains: result.gains });
        return;
      }
      // Stripe took the money but has not caught up, or the read failed.
      // Saying so is better than a celebration that might be premature; the
      // webhook will finish the job either way.
      toast("Payment taken — your plan will appear in a moment.", "stamp");
      router.refresh();
    });
  }, [session, toast, router]);

  if (bought) {
    return (
      <SqUnlockCelebration
        name={bought.name}
        gains={bought.gains}
        onClose={() => {
          setBought(null);
          setSession(null);
          // The page behind this was rendered for the old plan. Refreshing on
          // the way out is what makes the locked panels open rather than
          // needing a reload nobody would think to do.
          router.refresh();
          onSuccess?.();
        }}
      />
    );
  }

  if (session) {
    return (
      <div className="sq-checkout-embed">
        <EmbeddedCheckoutProvider
          stripe={loadStripeOnce()}
          options={{ clientSecret: session.clientSecret, onComplete: handleComplete }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`sq-btn ${variant === "primary" ? "sq-btn-primary" : "sq-btn-ghost"}`}
      disabled={disabled || busy}
      onClick={() => {
        setBusy(true);
        void startCheckoutAction(plan, interval)
          .then((intent) => {
            setBusy(false);
            if (!intent.ok) {
              toast(intent.message, "stamp");
              return;
            }
            setSession({ clientSecret: intent.clientSecret, sessionId: intent.sessionId });
          })
          .catch(() => {
            setBusy(false);
            toast("Checkout would not open.", "stamp");
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
