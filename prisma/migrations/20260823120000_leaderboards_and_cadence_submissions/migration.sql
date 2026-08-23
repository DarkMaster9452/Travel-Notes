-- Weekly and monthly cadence on submissions, and the podium that comes out of it.
--
-- Two things arrive together because one feeds the other: a submission now
-- records the slot it was filed against, and a closed slot's top three are
-- sealed into `leaderboard_awards` so a podium cannot be reshuffled by a
-- verdict changed weeks later.
--
-- Guarded like every migration since the roles change: this database has
-- drifted from the migration record before.

-- Which cadence a submission was filed against, if any.
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "period" "SchedulePeriod";
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "slot_key" TEXT;

CREATE INDEX IF NOT EXISTS "submissions_period_slot_key_idx"
  ON "submissions" ("period", "slot_key");

-- Backfill: a submission for a quest that was booked into a slot the
-- submission was filed inside belongs to that slot. Anything filed outside a
-- window it could have counted for stays uncadenced, which is correct.
UPDATE "submissions" AS s
SET "period" = q."period", "slot_key" = q."slot_key"
FROM "quest_schedules" AS q
WHERE s."period" IS NULL
  AND s."quest_id" = q."quest_id"
  AND s."created_at" >= q."open_at"
  AND s."created_at" < q."close_at";

DO $$
BEGIN
  CREATE TYPE "Medal" AS ENUM ('GOLD', 'SILVER', 'BRONZE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "leaderboard_awards" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "period"     "SchedulePeriod" NOT NULL,
  "slot_key"   TEXT NOT NULL,
  "rank"       INTEGER NOT NULL,
  "medal"      "Medal" NOT NULL,
  "score"      INTEGER NOT NULL,
  "quests"     INTEGER NOT NULL DEFAULT 0,
  "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "leaderboard_awards_pkey" PRIMARY KEY ("id")
);

-- One holder per rank, and one rank per holder: both halves of "the top three
-- of this board are these three people" are enforced rather than assumed, so
-- sealing the same board twice writes nothing instead of handing out a fourth
-- bronze.
CREATE UNIQUE INDEX IF NOT EXISTS "leaderboard_awards_period_slot_key_rank_key"
  ON "leaderboard_awards" ("period", "slot_key", "rank");

CREATE UNIQUE INDEX IF NOT EXISTS "leaderboard_awards_period_slot_key_user_id_key"
  ON "leaderboard_awards" ("period", "slot_key", "user_id");

CREATE INDEX IF NOT EXISTS "leaderboard_awards_user_id_idx"
  ON "leaderboard_awards" ("user_id");

DO $$
BEGIN
  ALTER TABLE "leaderboard_awards"
    ADD CONSTRAINT "leaderboard_awards_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
