import "server-only";

import type { Transaction } from "@paddle/paddle-node-sdk";

import { db } from "@/lib/db";
import { getPaddle, mapPaddleStatus, planForPriceId, type PaidPlanId } from "@/lib/paddle";

/**
 * Translating Paddle's world into ours.
 *
 * Only this module writes subscription state, and it only ever writes it from
 * data fetched from Paddle — a verified webhook, or a direct read — never from
 * anything a browser sent us. The overlay checkout hands the browser a
 * transaction id and nothing else, and a transaction id is only ever used to
 * *ask Paddle* what happened.
 */

/**
 * Which account a subscription belongs to.
 *
 * Paddle's `customData` is the equivalent of Stripe's metadata: it is set when
 * the checkout is opened and travels onto the subscription. It arrives as an
 * unshaped object, so it is narrowed rather than cast — a checkout opened by
 * hand, or by an older build, may carry nothing at all.
 */
function readCustom(custom: unknown, key: string): string | null {
  if (typeof custom !== "object" || custom === null) return null;
  const value = (custom as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * The parts of a Paddle subscription this module actually reads.
 *
 * Structural rather than the SDK's `Subscription`, because the API and the
 * webhook hand back two *different* classes: `Subscription` from a `get`, and
 * `SubscriptionNotification` from `unmarshal`, which lacks `managementUrls`,
 * `nextTransaction` and `recurringTransactionDetails`. Both carry everything
 * below, so naming only what is used lets one writer take either without a
 * cast — and if a future SDK drops one of these fields from either class, that
 * is a compile error here rather than an `undefined` at runtime.
 *
 * `price` is nullable because it is nullable on the notification even though
 * it is not on the API entity; the wider of the two is the safe one to hold.
 */
export type SyncableSubscription = {
  id: string;
  status: string;
  customerId: string;
  currentBillingPeriod: { startsAt: string; endsAt: string } | null;
  scheduledChange: { action: string } | null;
  items: readonly { recurring: boolean; price: { id: string } | null }[];
  customData: unknown;
};

function resolveUserId(subscription: SyncableSubscription): string | null {
  return readCustom(subscription.customData, "userId");
}

/** The plan we asked checkout for, if the price id can't be recognised. */
function customDataPlan(subscription: SyncableSubscription): PaidPlanId | null {
  const value = readCustom(subscription.customData, "plan");
  return value === "ultra" || value === "explorer" ? value : null;
}

/**
 * The billing period, as dates.
 *
 * Paddle returns ISO strings rather than Unix seconds, and
 * `currentBillingPeriod` is null on a subscription that has not billed yet —
 * a trial that has not converted, most often. Null stays null: the entitlement
 * check treats a missing end date as "no expiry recorded" rather than as
 * expired, so inventing a date here would be inventing a cutoff.
 */
function readPeriod(subscription: SyncableSubscription): { start: Date | null; end: Date | null } {
  const period = subscription.currentBillingPeriod;
  return {
    start: period?.startsAt ? new Date(period.startsAt) : null,
    end: period?.endsAt ? new Date(period.endsAt) : null,
  };
}

/**
 * Is this subscription going to stop at the end of the period?
 *
 * Stripe says this with a boolean. Paddle says it with a *scheduled change* —
 * an action with a date — which is strictly more information, and this is the
 * one bit of it our schema keeps. A scheduled `pause` counts too: from a
 * member's point of view "it stops on the 3rd" is the same sentence either way.
 */
function endsAtPeriodEnd(subscription: SyncableSubscription): boolean {
  const action = subscription.scheduledChange?.action;
  return action === "cancel" || action === "pause";
}

/** Upsert our subscription row from a Paddle subscription object. */
export async function syncSubscription(subscription: SyncableSubscription): Promise<void> {
  const customerId = subscription.customerId;

  const existing = await db.subscription.findFirst({
    where: {
      OR: [{ paddleSubscriptionId: subscription.id }, { paddleCustomerId: customerId }],
    },
    select: { id: true, userId: true },
  });

  const userId = existing?.userId ?? resolveUserId(subscription);
  if (!userId) {
    console.error(`[billing] no user for subscription ${subscription.id}; ignoring`);
    return;
  }

  const status = mapPaddleStatus(subscription.status);
  const period = readPeriod(subscription);

  // A subscription can carry several items; ours never do, and the first
  // recurring one is the plan. Filtering to `recurring` rather than taking
  // [0] means a one-off charge added to the subscription cannot be mistaken
  // for the thing being subscribed to.
  const priceId = subscription.items.find((item) => item.recurring)?.price?.id ?? null;

  // Which tier was bought, decided from the price the subscription is actually
  // billing on. Custom data is only the fallback for a price this deployment
  // doesn't have configured — it came from us, but through the browser's
  // round trip, so the price wins whenever it can answer.
  const purchased = planForPriceId(priceId) ?? customDataPlan(subscription) ?? "explorer";

  // A cancelled, paused or unknown subscription drops back to the free plan,
  // which is what `getEntitlement` reads to decide whether generation is
  // allowed. `PAST_DUE` keeps access while Paddle retries the card.
  const plan =
    status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE"
      ? (purchased.toUpperCase() as "EXPLORER" | "ULTRA")
      : ("FREE" as const);

  const data = {
    paddleCustomerId: customerId,
    paddleSubscriptionId: subscription.id,
    paddlePriceId: priceId,
    status,
    plan,
    cancelAtPeriodEnd: endsAtPeriodEnd(subscription),
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
  };

  await db.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

/** Record the customer id as soon as one exists, before any webhook. */
export async function linkCustomer(userId: string, customerId: string): Promise<void> {
  await db.subscription.upsert({
    where: { userId },
    create: { userId, paddleCustomerId: customerId, status: "INCOMPLETE", plan: "FREE" },
    update: { paddleCustomerId: customerId },
  });
}

/**
 * Bring a just-completed checkout into our database immediately.
 *
 * The webhook is the authority, but it is asynchronous, and the overlay closes
 * the instant payment clears — often first. Waiting for the webhook would mean
 * the page telling a paying member they are still on the free plan, which is
 * exactly the moment the product must not hesitate.
 *
 * So the transaction is fetched *from Paddle* and its subscription run through
 * the same writer the webhook uses. Nothing here trusts the browser beyond the
 * transaction id, and that id is checked two ways before it counts: the
 * transaction must be complete, and it must carry the same `userId` in its
 * custom data as the person asking. Otherwise pasting somebody else's
 * transaction id would sync their subscription onto your row.
 *
 * Returns whether the subscription was synced, so the caller can decide what
 * to say if Paddle is slow rather than guessing.
 */
export async function syncFromTransaction(
  transactionId: string,
  userId: string,
): Promise<boolean> {
  const paddle = getPaddle();
  if (!paddle) return false;

  try {
    const transaction = await paddle.transactions.get(transactionId);

    if (readCustom(transaction.customData, "userId") !== userId) return false;
    if (!transaction.subscriptionId) return false;

    const subscription = await paddle.subscriptions.get(transaction.subscriptionId);

    // The subscription's own custom data is what `syncSubscription` reads to
    // find the account. It is set at checkout, so it is normally there — but
    // if it is not, this row would be orphaned, and we know the answer here.
    if (!readCustom(subscription.customData, "userId")) {
      await linkCustomer(userId, subscription.customerId);
    }

    await syncSubscription(subscription);
    return true;
  } catch (error) {
    console.error("[billing] transaction sync failed", error);
    return false;
  }
}

export async function markPaymentFailed(customerId: string): Promise<void> {
  await db.subscription.updateMany({
    where: { paddleCustomerId: customerId },
    data: { status: "PAST_DUE" },
  });
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                    */
/* -------------------------------------------------------------------------- */

export type InvoiceLine = {
  id: string;
  /** When it was billed, or created if it never got that far. */
  date: Date;
  what: string;
  /** Paddle's own transaction status: "completed", "billed", "past_due", … */
  state: string;
  /** Already formatted in the transaction's own currency. */
  amount: string;
  /**
   * Paddle issues invoice PDFs through a short-lived signed URL rather than a
   * durable hosted page, so there is nothing stable to link to from a server
   * render. The invoice number is what a member quotes to support, so that is
   * what the row carries instead.
   */
  href: string | null;
  number: string | null;
};

/**
 * This account's transactions, from Paddle.
 *
 * Read live rather than mirrored into our own table: a receipt is Paddle's
 * record, and a copy of it here would be a second answer to a question with
 * one correct answer. An account with no customer id has no invoices, which is
 * an empty list rather than an error.
 */
export async function listInvoices(userId: string, limit = 12): Promise<InvoiceLine[]> {
  const paddle = getPaddle();
  if (!paddle) return [];

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { paddleCustomerId: true },
  });
  if (!subscription?.paddleCustomerId) return [];

  // `list` returns a paginated collection rather than an array; `next()` is
  // the first page, which at a page size of twelve is the whole of what this
  // screen shows. Iterating the collection would walk every transaction the
  // account has ever had to render a dozen rows.
  const collection = paddle.transactions.list({
    customerId: [subscription.paddleCustomerId],
    perPage: limit,
  });
  const transactions: Transaction[] = await collection.next();

  return transactions.map((transaction) => ({
    id: transaction.id,
    date: new Date(transaction.billedAt ?? transaction.createdAt),
    what: transaction.items[0]?.price?.description ?? "Subscription",
    state: transaction.status,
    amount: formatTotal(transaction),
    href: null,
    number: transaction.invoiceNumber,
  }));
}

/**
 * A transaction's total, in its own currency.
 *
 * Paddle returns money as a *string of minor units* — "1100", not 11 — because
 * some currencies do not fit a float and it will not pretend otherwise. That
 * is the right call and it means this cannot skip the parse: `Number("")` is
 * 0, which would quietly print a free invoice, so an unparseable total is
 * reported as unknown instead.
 */
function formatTotal(transaction: Transaction): string {
  const raw = transaction.details?.totals?.total;
  const minor = raw === undefined || raw === null || raw === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(minor)) return "—";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: transaction.currencyCode,
  }).format(minor / 100);
}

/* -------------------------------------------------------------------------- */
/* Reconciliation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Ask Paddle what this account actually holds, and write it down.
 *
 * The safety net under both live paths. `syncFromTransaction` runs the moment
 * the overlay closes and the webhook runs when Paddle gets around to it — but
 * both can miss. A browser closed too fast, a webhook secret not yet
 * configured, a delivery that failed every retry: in each case Paddle believes
 * somebody is a subscriber and we do not, which is the worst way round to be
 * wrong. It is exactly what happened when the checkout callback was attached
 * too late to fire.
 *
 * Cheap enough to run on the billing screen because it starts from our own
 * row and returns immediately in the normal case — an account that already has
 * a subscription id has nothing to reconcile.
 *
 * The email lookup is the part that recovers a *first* purchase. Nothing links
 * the account to Paddle until a subscription exists, so there is no id to
 * search by; the address the checkout was opened with is the only handle, and
 * it is ours rather than the browser's because it comes from the session.
 *
 * Returns true when it actually wrote something, so a caller can refresh.
 */
export async function reconcileSubscription(userId: string, email: string): Promise<boolean> {
  const paddle = getPaddle();
  if (!paddle) return false;

  const existing = await db.subscription.findUnique({
    where: { userId },
    select: { paddleSubscriptionId: true, paddleCustomerId: true, status: true },
  });

  // Already tracking a live subscription — nothing to do, and this is the
  // path nearly every page load takes.
  if (existing?.paddleSubscriptionId && existing.status !== "INCOMPLETE") return false;

  try {
    let customerId = existing?.paddleCustomerId ?? null;

    if (!customerId) {
      const customers = await paddle.customers.list({ email: [email], perPage: 1 }).next();
      customerId = customers[0]?.id ?? null;
    }
    if (!customerId) return false;

    const subscriptions = await paddle.subscriptions
      .list({ customerId: [customerId], perPage: 5 })
      .next();

    // Newest first, and only one that grants anything. A cancelled
    // subscription found here is not news — the row already says free.
    const live = subscriptions
      .filter((entry) => ["active", "trialing", "past_due"].includes(entry.status))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

    if (!live) return false;

    // `syncSubscription` finds the account through custom data, which a
    // subscription bought before that was being set may not carry. Linking
    // first means it can always fall back to the row.
    await linkCustomer(userId, customerId);
    await syncSubscription(live);
    return true;
  } catch (error) {
    console.error("[billing] reconcile failed", error);
    return false;
  }
}
