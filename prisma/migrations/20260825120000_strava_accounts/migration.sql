-- Strava connections. One per account; disconnecting deletes the row.
CREATE TABLE "strava_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL DEFAULT '',
    "athlete_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strava_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "strava_accounts_user_id_key" ON "strava_accounts"("user_id");

ALTER TABLE "strava_accounts" ADD CONSTRAINT "strava_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
