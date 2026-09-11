import "server-only";

import type Stripe from "stripe";

import { db } from "@/lib/db";
import { getStripe, mapStripeStatus, planForPriceId, type PaidPlanId } from "@/lib/stripe";

/**
 * Translating Stripe's world into ours.
 *
 * Only this module writes subscription state, and it only ever writes it from
 * data fetched from Stripe — a verified webhook, or a direct read — never from
 * anything a browser sent us. The embedded checkout hands the browser a
 * session id and nothing else, and a session id is only ever used to *ask
 * Stripe* what happened.
 */

/** Which account a subscription belongs to, from the metadata set at checkout. */
function readMeta(metadata: Stripe.Metadata | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function resolveUserId(subscription: Stripe.Subscription): string | null {
  return readMeta(subscription.metadata, "userId");
}

/** The plan we asked checkout for, if the price id can't be recognised. */
function metadataPlan(subscription: Stripe.Subscription): PaidPlanId | null {
  const value = readMeta(subscription.metadata, "plan");
  return value === "ultra" || value === "explorer" ? value : null;
}

/**
 * The subscription's one billed item.
 *
 * A subscription can carry several items; ours never do, so the first item is
 * the plan. This is also where Stripe now keeps the current billing period —
 * `current_period_start`/`current_period_end` moved off the subscription
 * itself and onto each of its items.
 */
function primaryItem(subscription: Stripe.Subscription): Stripe.SubscriptionItem | undefined {
  return subscription.items.data[0];
}

function customerId(subscription: Stripe.Subscription): string {
  const customer = subscription.customer;
  return typeof customer === "string" ? customer : customer.id;
}

/** Upsert our subscription row from a Stripe subscription object. */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customer = customerId(subscription);

  const existing = await db.subscription.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customer }],
    },
    select: { id: true, userId: true },
  });

  const userId = existing?.userId ?? resolveUserId(subscription);
  if (!userId) {
    console.error(`[billing] no user for subscription ${subscription.id}; ignoring`);
    return;
  }

  const status = mapStripeStatus(subscription);
  const item = primaryItem(subscription);
  const priceId = item?.price.id ?? null;

  // Which tier was bought, decided from the price the subscription is actually
  // billing on. Metadata is only the fallback for a price this deployment
  // doesn't have configured — it came from us, but through the browser's
  // round trip, so the price wins whenever it can answer.
  const purchased = planForPriceId(priceId) ?? metadataPlan(subscription) ?? "explorer";

  // A cancelled or unknown subscription drops back to the free plan, which is
  // what `getEntitlement` reads to decide whether generation is allowed.
  // `PAST_DUE` keeps access while Stripe retries the card.
  const plan =
    status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE"
      ? (purchased.toUpperCase() as "EXPLORER" | "ULTRA")
      : ("FREE" as const);

  const data = {
    stripeCustomerId: customer,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    status,
    plan,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
  };

  await db.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

/** Record the customer id as soon as one exists, before any webhook. */
export async function linkCustomer(userId: string, stripeCustomerId: string): Promise<void> {
  await db.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId, status: "INCOMPLETE", plan: "FREE" },
    update: { stripeCustomerId },
  });
}

/**
 * Bring a just-completed checkout into our database immediately.
 *
 * The webhook is the authority, but it is asynchronous, and the embedded
 * checkout's `onComplete` fires the instant payment clears — often first.
 * Waiting for the webhook would mean the page telling a paying member they are
 * still on the free plan, which is exactly the moment the product must not
 * hesitate.
 *
 * So the session is fetched *from Stripe* and its subscription run through the
 * same writer the webhook uses. Nothing here trusts the browser beyond the
 * session id, and that id is checked two ways before it counts: the session
 * must actually be paid, and it must carry the same `userId` in its metadata
 * as the person asking. Otherwise pasting somebody else's session id would
 * sync their subscription onto your row.
 *
 * Returns whether the subscription was synced, so the caller can decide what
 * to say if Stripe is slow rather than guessing.
 */
export async function syncFromCheckoutSession(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (readMeta(session.metadata, "userId") !== userId) return false;
    if (session.payment_status !== "paid") return false;
    if (!session.subscription || typeof session.subscription === "string") return false;

    await syncSubscription(session.subscription);
    return true;
  } catch (error) {
    console.error("[billing] checkout session sync failed", error);
    return false;
  }
}

export async function markPaymentFailed(customerId: string): Promise<void> {
  await db.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: "PAST_DUE" },
  });
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                    */
/* -------------------------------------------------------------------------- */

export type InvoiceLine = {
  id: string;
  date: Date;
  what: string;
  /** Stripe's own invoice status: "paid", "open", "uncollectible", … */
  state: string;
  /** Already formatted in the invoice's own currency. */
  amount: string;
  /** Stripe hosts a durable page for every invoice — unlike Paddle, this
   *  never expires and needs no signing. */
  href: string | null;
  number: string | null;
};

/**
 * This account's invoices, from Stripe.
 *
 * Read live rather than mirrored into our own table: a receipt is Stripe's
 * record, and a copy of it here would be a second answer to a question with
 * one correct answer. An account with no customer id has no invoices, which is
 * an empty list rather than an error.
 */
export async function listInvoices(userId: string, limit = 12): Promise<InvoiceLine[]> {
  const stripe = getStripe();
  if (!stripe) return [];

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });
  if (!subscription?.stripeCustomerId) return [];

  const invoices = await stripe.invoices.list({
    customer: subscription.stripeCustomerId,
    limit,
  });

  return invoices.data.map((invoice) => ({
    id: invoice.id,
    date: new Date(invoice.created * 1000),
    what: invoice.lines.data[0]?.description ?? "Subscription",
    state: invoice.status ?? "unknown",
    amount: formatTotal(invoice),
    href: invoice.hosted_invoice_url ?? null,
    number: invoice.number,
  }));
}

/**
 * An invoice's total, in its own currency.
 *
 * Stripe returns amounts as integers in minor units already — no string to
 * parse, unlike Paddle.
 */
function formatTotal(invoice: Stripe.Invoice): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: invoice.currency.toUpperCase(),
  }).format(invoice.total / 100);
}

/* -------------------------------------------------------------------------- */
/* Reconciliation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Ask Stripe what this account actually holds, and write it down.
 *
 * The safety net under both live paths. `syncFromCheckoutSession` runs the
 * moment the embed reports completion and the webhook runs when Stripe gets
 * around to it — but both can miss. A browser closed too fast, a webhook
 * secret not yet configured, a delivery that failed every retry: in each case
 * Stripe believes somebody is a subscriber and we do not, which is the worst
 * way round to be wrong.
 *
 * Cheap enough to run on the billing screen because it starts from our own
 * row and returns immediately in the normal case — an account that already has
 * a subscription id has nothing to reconcile.
 *
 * The email lookup is the part that recovers a *first* purchase. Nothing links
 * the account to Stripe until a subscription exists, so there is no id to
 * search by; the address the checkout was opened with is the only handle, and
 * it is ours rather than the browser's because it comes from the session.
 *
 * Returns true when it actually wrote something, so a caller can refresh.
 */
export async function reconcileSubscription(userId: string, email: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;

  const existing = await db.subscription.findUnique({
    where: { userId },
    select: { stripeSubscriptionId: true, stripeCustomerId: true, status: true },
  });

  // Already tracking a live subscription — nothing to do, and this is the
  // path nearly every page load takes.
  if (existing?.stripeSubscriptionId && existing.status !== "INCOMPLETE") return false;

  try {
    let customer = existing?.stripeCustomerId ?? null;

    if (!customer) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      customer = customers.data[0]?.id ?? null;
    }
    if (!customer) return false;

    const subscriptions = await stripe.subscriptions.list({ customer, limit: 5 });

    // Newest first, and only one that grants anything. A cancelled
    // subscription found here is not news — the row already says free.
    const live = subscriptions.data
      .filter((entry) => ["active", "trialing", "past_due"].includes(entry.status))
      .sort((a, b) => b.created - a.created)[0];

    if (!live) return false;

    // `syncSubscription` finds the account through metadata, which a
    // subscription bought before that was being set may not carry. Linking
    // first means it can always fall back to the row.
    await linkCustomer(userId, customer);
    await syncSubscription(live);
    return true;
  } catch (error) {
    console.error("[billing] reconcile failed", error);
    return false;
  }
}
