-- Proof submissions, and the publish flag the panel writes.
--
-- Guarded throughout, like the previous migration: the deployed database has a
-- history of picking up columns out of band, and an unguarded statement here
-- aborts the whole migration and blocks every one after it.

DO $$
BEGIN
  CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Only published quests can be issued. Existing rows stay issuable.
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "category" TEXT;

CREATE TABLE IF NOT EXISTS "submissions" (
  "id"             TEXT NOT NULL,
  "user_id"        TEXT NOT NULL,
  "quest_id"       TEXT NOT NULL,
  "note"           TEXT NOT NULL,
  "photos"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "strava_url"     TEXT,
  "distance"       DOUBLE PRECISION,
  "elevation"      INTEGER,
  "moving_time"    INTEGER,
  "started_at"     TIMESTAMP(3),
  "retreated"      BOOLEAN NOT NULL DEFAULT false,
  "status"         "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by_id" TEXT,
  "review_note"    TEXT,
  "reviewed_at"    TIMESTAMP(3),
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- One submission per person per quest: filing proof twice for the same day is
-- an edit, not a second attempt.
CREATE UNIQUE INDEX IF NOT EXISTS "submissions_user_id_quest_id_key"
  ON "submissions" ("user_id", "quest_id");
CREATE INDEX IF NOT EXISTS "submissions_status_created_at_idx"
  ON "submissions" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "quests_published_idx" ON "quests" ("published");

DO $$
BEGIN
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_quest_id_fkey"
    FOREIGN KEY ("quest_id") REFERENCES "quests" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- The reviewer is nulled rather than cascaded: deleting an admin account must
-- not delete the review history of everyone they ever approved.
DO $$
BEGIN
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
