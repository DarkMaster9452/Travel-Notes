-- Billing moves from Stripe to Paddle.
--
-- Nothing is live yet, so the Stripe columns are renamed rather than kept
-- beside the new ones: a column holding ids from a provider we no longer talk
-- to is a column somebody will one day try to use. RENAME rather than
-- DROP/ADD so the unique indexes and constraints come along with them instead
-- of being rebuilt by hand.
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_customer_id" TO "paddle_customer_id";
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_subscription_id" TO "paddle_subscription_id";
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_price_id" TO "paddle_price_id";

-- Any values that survive are Stripe ids, which mean nothing to Paddle. Left
-- in place they would look like real customer references to every query in the
-- codebase, and the first webhook would try to match against them.
UPDATE "subscriptions"
   SET "paddle_customer_id" = NULL,
       "paddle_subscription_id" = NULL,
       "paddle_price_id" = NULL;

-- Keep the index names in step with the columns. Postgres does not rename
-- these automatically, and an index called `stripe_*` on a `paddle_*` column
-- is a trap for whoever reads this schema next.
ALTER INDEX "subscriptions_stripe_customer_id_key" RENAME TO "subscriptions_paddle_customer_id_key";
ALTER INDEX "subscriptions_stripe_subscription_id_key" RENAME TO "subscriptions_paddle_subscription_id_key";

-- Paddle reports five statuses. `INCOMPLETE_EXPIRED` and `UNPAID` were
-- Stripe's and nothing can produce them any more.
--
-- Postgres cannot drop a value from an enum, so the type is recreated. Any row
-- sitting on a departing value is moved to CANCELED first — that is what both
-- of them meant in practice, an account that is not paying — so the cast
-- cannot fail on data.
UPDATE "subscriptions"
   SET "status" = 'CANCELED'
 WHERE "status" IN ('INCOMPLETE_EXPIRED', 'UNPAID');

CREATE TYPE "SubscriptionStatus_new" AS ENUM (
    'ACTIVE',
    'TRIALING',
    'PAST_DUE',
    'PAUSED',
    'CANCELED',
    'INCOMPLETE'
);

-- The default has to go before the cast: Postgres will not re-typecheck an
-- existing DEFAULT against the new type, and refuses the ALTER while one is
-- attached. It is restored below.
ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "subscriptions"
  ALTER COLUMN "status" TYPE "SubscriptionStatus_new"
  USING ("status"::text::"SubscriptionStatus_new");

DROP TYPE "SubscriptionStatus";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";

ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'INCOMPLETE';
