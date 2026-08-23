-- Which stickers an account has already been shown.
-- Guarded: this database has drifted before, and a migration that cannot be
-- re-run is a migration that blocks every deploy after the first partial one.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "seen_achievements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
