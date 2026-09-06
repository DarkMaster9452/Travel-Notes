-- The `subscriptions` table was found in production still on the Stripe
-- column names, even though `20260827200000_paddle_billing` had already
-- renamed them to Paddle names in every tracked migration. Something applied
-- an out-of-band rename back to Stripe directly against the database,
-- outside of this migration history, which left production out of sync with
-- `schema.prisma` (which has expected `paddle_*` since that migration) and
-- broke every query that touches subscriptions, including the one on
-- `/dashboard` a fresh login lands on.
--
-- All three columns are null in production, so this is a straight rename
-- back to where the schema already expects them to be, not a data migration.
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_customer_id" TO "paddle_customer_id";
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_subscription_id" TO "paddle_subscription_id";
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_price_id" TO "paddle_price_id";

ALTER INDEX "subscriptions_stripe_customer_id_key" RENAME TO "subscriptions_paddle_customer_id_key";
ALTER INDEX "subscriptions_stripe_subscription_id_key" RENAME TO "subscriptions_paddle_subscription_id_key";
