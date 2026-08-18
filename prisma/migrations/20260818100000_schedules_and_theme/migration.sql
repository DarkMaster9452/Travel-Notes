-- Quest scheduling, and the account's theme preference.
--
-- Guarded the same way as every migration since the roles change: this
-- database has drifted from the migration record before (an unrelated schema
-- once shared the project and left a `submissions` table behind), so each
-- statement is written to be safe against the object already existing.

-- Theme -----------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE "Theme" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "theme" "Theme" NOT NULL DEFAULT 'SYSTEM';

-- Scheduling ------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE "SchedulePeriod" AS ENUM ('WEEKLY', 'MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "quest_schedules" (
  "id"            TEXT NOT NULL,
  "period"        "SchedulePeriod" NOT NULL,
  "slot_key"      TEXT NOT NULL,
  "quest_id"      TEXT NOT NULL,
  "audience"      "Plan" NOT NULL DEFAULT 'FREE',
  "open_at"       TIMESTAMP(3) NOT NULL,
  "close_at"      TIMESTAMP(3) NOT NULL,
  "created_by_id" TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "quest_schedules_pkey" PRIMARY KEY ("id")
);

-- One quest per slot. The product has no answer for two quests claiming the
-- same Monday, so the database refuses to hold that state at all.
CREATE UNIQUE INDEX IF NOT EXISTS "quest_schedules_period_slot_key_key"
  ON "quest_schedules" ("period", "slot_key");

CREATE INDEX IF NOT EXISTS "quest_schedules_open_at_idx"
  ON "quest_schedules" ("open_at");

DO $$
BEGIN
  ALTER TABLE "quest_schedules"
    ADD CONSTRAINT "quest_schedules_quest_id_fkey"
    FOREIGN KEY ("quest_id") REFERENCES "quests" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "quest_schedules"
    ADD CONSTRAINT "quest_schedules_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
