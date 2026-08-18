-- Stickers an admin has taken back.
--
-- Achievements are derived from quest history rather than stored, so there is
-- no row to delete when one has to be removed. This records the exception.
-- Guarded like every migration since the roles change: this database has
-- drifted from the migration record before.

CREATE TABLE IF NOT EXISTS "achievement_revocations" (
  "id"             TEXT NOT NULL,
  "user_id"        TEXT NOT NULL,
  "achievement_id" TEXT NOT NULL,
  "reason"         TEXT,
  "revoked_by_id"  TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "achievement_revocations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "achievement_revocations_user_id_achievement_id_key"
  ON "achievement_revocations" ("user_id", "achievement_id");

DO $$
BEGIN
  ALTER TABLE "achievement_revocations"
    ADD CONSTRAINT "achievement_revocations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "achievement_revocations"
    ADD CONSTRAINT "achievement_revocations_revoked_by_id_fkey"
    FOREIGN KEY ("revoked_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
