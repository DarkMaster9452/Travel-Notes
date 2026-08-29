"use client";

import { initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useToast } from "@/components/sq/toast";
import { SqUnlockCelebration } from "@/components/sq/unlock";
import {
  completeCheckoutAction,
  startCheckoutAction,
} from "@/app/(app)/settings/plan-actions";
import type { Capability } from "@/lib/config";

/**
 * Start a checkout, or open Paddle's own portal.
 *
 * Paddle's checkout is an *overlay*, not a redirect: Paddle.js opens it over
 * this page and closes it again when payment clears, so a member never leaves
 * the product to buy it. That is the whole reason this file has more in it
 * than a `fetch` — the old Stripe flow could hand the browser a URL and be
 * done, and this one has to hold a client library, open it, and then tell the
 * server what happened.
 *
 * What has not changed is where authority lives. The server decides which
 * price this account may buy (`startCheckoutAction`), and the server decides
 * whether anything was actually paid for (`completeCheckoutAction`, which
 * reads Paddle rather than believing the browser). This is the button.
 */

/** Missing at build time means this deployment cannot sell; the button says so. */
const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
const ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";

/**
 * Everyone listening for checkout events, and the one callback Paddle knows about.
 *
 * This indirection exists because of a bug that cost a real payment. The
 * callback used to be attached *after* load, with `paddle.Update({
 * eventCallback })` — but `eventCallback` is an initialisation option, and
 * registering it afterwards did not take. `checkout.completed` was never
 * delivered, so a paid-for subscription was never synced and the member stayed
 * on the free plan with the button stuck on "Opening…".
 *
 * Now the callback is handed to `initializePaddle` and never changes; it fans
 * events out to whoever has subscribed. Subscribing is synchronous, so a
 * listener that mounts while the script is still downloading cannot miss the
 * event either — the old code had that race too.
 */
type CheckoutListener = (event: PaddleEventData) => void;

const listeners = new Set<CheckoutListener>();

function subscribe(listener: CheckoutListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Paddle.js, loaded once per page and shared.
 *
 * Module scope rather than a hook's state: the script is a singleton on the
 * window whatever we do, and two buttons on the same pricing table would
 * otherwise each pull it down. The promise is cached rather than the instance
 * so simultaneous callers wait on one load instead of racing two.
 */
let paddlePromise: Promise<Paddle | undefined> | null = null;

function loadPaddle(): Promise<Paddle | undefined> {
  if (CLIENT_TOKEN.length === 0) return Promise.resolve(undefined);
  paddlePromise ??= initializePaddle({
    token: CLIENT_TOKEN,
    environment: ENVIRONMENT,
    // Attached here and only here. See the note above `listeners`.
    eventCallback: (event) => {
      for (const listener of [...listeners]) {
        try {
          listener(event);
        } catch {
          // One listener throwing must not stop the rest — the sync is the
          // one that matters and it must not be starved by a toast.
        }
      }
    },
  }).catch(() => undefined);
  return paddlePromise;
}

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
  const [busy, setBusy] = useState(false);

  // The overlay's callback fires outside React's lifecycle and can arrive
  // after this button has gone — a completed purchase re-renders the page it
  // is standing on. The ref is what keeps the callback from setting state on
  // a component that no longer exists.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Warm the script as soon as a buy button is on screen. By the time anybody
  // has read the pricing table and decided, the overlay opens immediately
  // instead of after a download.
  useEffect(() => {
    void loadPaddle();
  }, []);

  return (
    <button
      type="button"
      className={`sq-btn ${variant === "primary" ? "sq-btn-primary" : "sq-btn-ghost"}`}
      disabled={disabled || busy}
      onClick={() => {
        setBusy(true);

        void (async () => {
          const [paddle, intent] = await Promise.all([
            loadPaddle(),
            startCheckoutAction(plan, interval),
          ]);

          if (!intent.ok) {
            if (alive.current) setBusy(false);
            toast(intent.message, "stamp");
            return;
          }

          if (!paddle) {
            if (alive.current) setBusy(false);
            toast("Checkout would not open.", "stamp");
            return;
          }

          paddle.Checkout.open({
            items: [{ priceId: intent.priceId, quantity: 1 }],
            // An existing customer is named by id so the purchase joins the
            // account's history; a new one only by email, which is all Paddle
            // needs to create one.
            customer: intent.customerId
              ? { id: intent.customerId }
              : { email: intent.email },
            // This rides onto the subscription and is how a webhook maps an
            // event back to a user. The plan travels with it as a fallback for
            // a price id this deployment doesn't have configured.
            customData: intent.custom,
            settings: { displayMode: "overlay", showAddDiscounts: true },
          });

          // The overlay is up and covering this button, so "Opening…" has
          // stopped being true. Leaving it set is what left the button stuck
          // on that word for good once somebody closed the overlay.
          if (alive.current) setBusy(false);
        })().catch(() => {
          if (alive.current) setBusy(false);
          toast("Checkout would not open.", "stamp");
        });
      }}
    >
      {busy ? "Opening…" : label}
    </button>
  );
}

/**
 * Listens for a completed checkout, wherever on the page it was opened.
 *
 * Mounted once by the billing screen rather than by each button, because the
 * overlay is a property of the page and not of the thing that opened it: a
 * purchase completed after the button unmounted still has to be recorded.
 *
 * The event only says "a transaction happened". Whether it *paid for*
 * anything is decided on the server, which fetches that transaction from
 * Paddle and checks it belongs to the person asking.
 */
export function SqCheckoutListener() {
  const router = useRouter();
  const toast = useToast();
  const [bought, setBought] = useState<{ name: string; gains: Capability[] } | null>(null);

  useEffect(() => {
    // The script has to be loading for any event to arrive, but subscribing
    // does not wait on it: the callback is attached at initialisation, and
    // this set is read at dispatch time.
    void loadPaddle();

    return subscribe((event) => {
      if (event.name !== "checkout.completed") return;
      const transactionId = event.data?.transaction_id;
      if (!transactionId) return;

      void completeCheckoutAction(transactionId).then((result) => {
        if (result.ok) {
          // The celebration, not a toast. Somebody has just paid, and the
          // page behind them is still rendered for the plan they had a
          // moment ago — the refresh happens when they close it.
          setBought({ name: result.name, gains: result.gains });
          return;
        }

        // Paddle took the money but has not caught up, or the read failed.
        // Saying so is better than a celebration that might be premature;
        // the webhook will finish the job either way.
        toast("Payment taken — your plan will appear in a moment.", "stamp");
        router.refresh();
      });
    });
  }, [router, toast]);

  if (!bought) return null;

  return (
    <SqUnlockCelebration
      name={bought.name}
      gains={bought.gains}
      onClose={() => {
        setBought(null);
        // The page behind this was rendered for the old plan. Refreshing on
        // the way out is what makes the locked panels open rather than needing
        // a reload nobody would think to do.
        router.refresh();
      }}
    />
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
        void fetch("/api/paddle/portal", { method: "POST" })
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
