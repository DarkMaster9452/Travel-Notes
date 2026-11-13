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
--
-- Every other database followed the tracked history, so by the time this runs
-- there the names are already `paddle_*` and an unconditional rename fails on
-- a column that does not exist, which blocks every migration after it. Each
-- rename is therefore conditional: it happens where the Stripe name is still
-- there, and is a no-op where it is not.
--
-- Postgres has no `RENAME COLUMN IF EXISTS`, hence the DO block. If a Stripe
-- and a Paddle column ever exist side by side the rename still fails, loudly,
-- with Postgres's own "already exists" — that state needs a person, not a
-- guess.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'subscriptions'
       AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE "subscriptions" RENAME COLUMN "stripe_customer_id" TO "paddle_customer_id";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'subscriptions'
       AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE "subscriptions" RENAME COLUMN "stripe_subscription_id" TO "paddle_subscription_id";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'subscriptions'
       AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE "subscriptions" RENAME COLUMN "stripe_price_id" TO "paddle_price_id";
  END IF;
END
$$;

ALTER INDEX IF EXISTS "subscriptions_stripe_customer_id_key"
  RENAME TO "subscriptions_paddle_customer_id_key";
ALTER INDEX IF EXISTS "subscriptions_stripe_subscription_id_key"
  RENAME TO "subscriptions_paddle_subscription_id_key";
