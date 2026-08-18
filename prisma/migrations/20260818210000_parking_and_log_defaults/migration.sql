-- Where to leave the car, and what somebody would otherwise retype every time.
-- Guarded throughout: this database has drifted before, and a migration that
-- cannot be re-run blocks every deploy after the first partial one.

ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "parking_name" TEXT;
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "parking_lat" DOUBLE PRECISION;
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "parking_lng" DOUBLE PRECISION;
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "parking_note" TEXT;
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "approach_time" INTEGER;
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "transit_note" TEXT;

CREATE TABLE IF NOT EXISTS "user_log_defaults" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "strava_profile" TEXT,
    "usual_start" TEXT,
    "party_size" INTEGER,
    "gear" TEXT,
    "pace" DOUBLE PRECISION,
    "last_distance" DOUBLE PRECISION,
    "last_elevation" INTEGER,
    "last_moving_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_log_defaults_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_log_defaults_user_id_key" ON "user_log_defaults"("user_id");

DO $$
BEGIN
  ALTER TABLE "user_log_defaults"
    ADD CONSTRAINT "user_log_defaults_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
