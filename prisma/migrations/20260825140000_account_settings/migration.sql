-- How the product is read, where the envelope goes, and which emails were asked for.
CREATE TYPE "Units" AS ENUM ('METRIC', 'IMPERIAL');

CREATE TABLE "display_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "units" "Units" NOT NULL DEFAULT 'METRIC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "expert_stats" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "display_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "display_settings_user_id_key" ON "display_settings"("user_id");
ALTER TABLE "display_settings" ADD CONSTRAINT "display_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "shipping_addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient" TEXT,
    "line1" TEXT,
    "line2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Slovakia',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "shipping_addresses_user_id_key" ON "shipping_addresses"("user_id");
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_drop" BOOLEAN NOT NULL DEFAULT true,
    "verdict" BOOLEAN NOT NULL DEFAULT true,
    "board_sealed" BOOLEAN NOT NULL DEFAULT true,
    "product_news" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "notification_settings"("user_id");
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
