-- Free demo activation is gone; plans are bought through Paddle or not at all.
--
-- The rows have to go before the column does, and in that order. A demo
-- subscription is ACTIVE with a real plan and no Paddle ids — drop just the
-- flag and those rows become indistinguishable from paid ones, silently
-- granting Explorer and Ultra to accounts that never paid and, worse, hiding
-- the checkout button from them because they already appear to hold a plan.
DELETE FROM "subscriptions" WHERE "demo" = true;

ALTER TABLE "subscriptions" DROP COLUMN "demo";
