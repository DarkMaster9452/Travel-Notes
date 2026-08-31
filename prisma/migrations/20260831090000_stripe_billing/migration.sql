-- Billing moves from Paddle to Stripe.
--
-- The columns are renamed rather than added beside new ones: a column
-- holding ids from a provider we no longer talk to is a column somebody will
-- one day try to use. RENAME rather than DROP/ADD so the unique indexes come
-- along with the columns instead of being rebuilt by hand.
ALTER TABLE "subscriptions" RENAME COLUMN "paddle_customer_id" TO "stripe_customer_id";
ALTER TABLE "subscriptions" RENAME COLUMN "paddle_subscription_id" TO "stripe_subscription_id";
ALTER TABLE "subscriptions" RENAME COLUMN "paddle_price_id" TO "stripe_price_id";

-- Any values that survive are Paddle ids, which mean nothing to Stripe. Left
-- in place they would look like real customer references to every query in
-- the codebase, and the reconciliation job would try to match against them.
UPDATE "subscriptions"
   SET "stripe_customer_id" = NULL,
       "stripe_subscription_id" = NULL,
       "stripe_price_id" = NULL;

-- Keep the index names in step with the columns. Postgres does not rename
-- these automatically, and an index called `paddle_*` on a `stripe_*` column
-- is a trap for whoever reads this schema next.
ALTER INDEX "subscriptions_paddle_customer_id_key" RENAME TO "subscriptions_stripe_customer_id_key";
ALTER INDEX "subscriptions_paddle_subscription_id_key" RENAME TO "subscriptions_stripe_subscription_id_key";

-- `SubscriptionStatus` is unchanged: ACTIVE / TRIALING / PAST_DUE / PAUSED /
-- CANCELED / INCOMPLETE are already provider-agnostic, and Stripe's own
-- statuses map onto exactly this set (see `mapStripeStatus` in
-- `src/lib/stripe.ts` — "paused" comes from a subscription's
-- `pause_collection` rather than from a distinct Stripe status).
