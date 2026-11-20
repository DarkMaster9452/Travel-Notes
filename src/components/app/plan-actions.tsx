"use client";

import { initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";
import { Check, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { completeCheckoutAction, startCheckoutAction } from "@/app/(app)/settings/plan-actions";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { capabilityCopy, type Capability } from "@/lib/config";

/**
 * Buying a plan, without leaving the page.
 *
 * Paddle has no server-created checkout session: the overlay is opened by
 * Paddle.js in the browser. Which price this account may buy is still decided
 * on the server (`startCheckoutAction`), and nothing is granted until the
 * server has checked the finished transaction with Paddle
 * (`completeCheckoutAction`). The browser never picks a price; it is told one.
 */

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
const ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";

type CheckoutListener = (event: PaddleEventData) => void;
const listeners = new Set<CheckoutListener>();

function subscribe(listener: CheckoutListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Paddle.js is initialised once per page, with one event callback that fans
 * out to whoever is listening. The overlay's completion event is the page's
 * business rather than one button's: a purchase that finishes after the button
 * has re-rendered still has to be recorded.
 */
let paddlePromise: Promise<Paddle | undefined> | null = null;
function loadPaddle(): Promise<Paddle | undefined> {
  if (CLIENT_TOKEN.length === 0) return Promise.resolve(undefined);
  paddlePromise ??= initializePaddle({
    token: CLIENT_TOKEN,
    environment: ENVIRONMENT,
    eventCallback: (event) => {
      for (const listener of [...listeners]) {
        try {
          listener(event);
        } catch {
          /* one listener failing must not stop the others */
        }
      }
    },
  }).catch(() => undefined);
  return paddlePromise;
}

export function CheckoutButton({
  plan,
  interval,
  label,
  variant = "primary",
  disabled,
}: {
  plan: "explorer" | "ultra";
  interval: "monthly" | "yearly";
  label: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const t = useT();
  const words = t.app.settingsPane.billing;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    void loadPaddle();
    return () => {
      alive.current = false;
    };
  }, []);

  return (
    <Button
      variant={variant}
      disabled={disabled}
      loading={busy}
      onClick={() => {
        setBusy(true);
        void (async () => {
          const [paddle, intent] = await Promise.all([loadPaddle(), startCheckoutAction(plan, interval)]);
          if (!intent.ok) {
            if (alive.current) setBusy(false);
            toast(intent.message, "error");
            return;
          }
          if (!paddle) {
            if (alive.current) setBusy(false);
            toast(words.checkoutFailed, "error");
            return;
          }
          paddle.Checkout.open({
            items: [{ priceId: intent.priceId, quantity: 1 }],
            customer: intent.customerId ? { id: intent.customerId } : { email: intent.email },
            customData: intent.custom,
            settings: { displayMode: "overlay", showAddDiscounts: true },
          });
          if (alive.current) setBusy(false);
        })().catch(() => {
          if (alive.current) setBusy(false);
          toast(words.checkoutFailed, "error");
        });
      }}
    >
      {busy ? words.opening : label}
    </Button>
  );
}

/** Mounted once on the billing page: records a finished purchase and says what it opened. */
export function CheckoutListener() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [bought, setBought] = useState<{ name: string; gains: Capability[] } | null>(null);

  useEffect(() => {
    void loadPaddle();
    return subscribe((event) => {
      if (event.name !== "checkout.completed") return;
      const transactionId = event.data?.transaction_id;
      if (!transactionId) return;
      void completeCheckoutAction(transactionId).then((result) => {
        if (result.ok) {
          setBought({ name: result.name, gains: result.gains });
          return;
        }
        toast(t.app.settingsPane.billing.paymentTaken);
        router.refresh();
      });
    });
  }, [router, toast, t]);

  const close = () => {
    setBought(null);
    router.refresh();
  };

  return (
    <Dialog
      open={bought !== null}
      onOpenChange={(open) => (open ? null : close())}
      title={bought?.name ?? ""}
      description={t.unlock.lede}
      closeLabel={t.ui.close}
      size="md"
      footer={<Button onClick={close}>{t.unlock.good}</Button>}
    >
      <p className="mb-4 flex items-center gap-2 text-overline font-semibold uppercase text-success">
        <PartyPopper className="size-4" aria-hidden="true" />
        {t.unlock.unlocked}
      </p>
      <ul className="flex flex-col gap-3">
        {(bought?.gains ?? []).slice(0, 6).map((capability) => (
          <li key={capability} className="flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-success-soft text-success">
              <Check className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <b className="block text-body-sm font-semibold">{capabilityCopy(t, capability).title}</b>
              <span className="text-caption text-muted">{capabilityCopy(t, capability).detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {bought?.gains.includes("mail") ? <p className="mt-4 text-caption text-subtle">{t.unlock.envelopeNote}</p> : null}
    </Dialog>
  );
}

/** Opens Paddle's own portal for cards, invoices and the address on the receipt. */
export function PortalButton({ label, variant = "secondary" }: { label: string; variant?: "primary" | "secondary" }) {
  const t = useT();
  const words = t.app.settingsPane.billing;
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant={variant}
      loading={busy}
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
            toast(result.message ?? words.portalFailed, "error");
          })
          .catch(() => {
            setBusy(false);
            toast(words.portalFailed, "error");
          });
      }}
    >
      {busy ? words.opening : label}
    </Button>
  );
}
