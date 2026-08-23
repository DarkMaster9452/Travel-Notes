-- Public profiles. Off by default, and only ever visible to signed-in
-- accounts. Guarded throughout, like every migration in this project.

DO $$
BEGIN
  CREATE TYPE "ProfileAccent" AS ENUM ('PINE', 'MOSS', 'STONE', 'WATER', 'CLAY', 'DUSK', 'SIGNAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "headline" TEXT,
    "bio" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "strava" TEXT,
    "accent" "ProfileAccent" NOT NULL DEFAULT 'PINE',
    "show_stats" BOOLEAN NOT NULL DEFAULT true,
    "show_country" BOOLEAN NOT NULL DEFAULT true,
    "show_activities" BOOLEAN NOT NULL DEFAULT true,
    "show_stickers" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_id_key" ON "profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_handle_key" ON "profiles"("handle");
CREATE INDEX IF NOT EXISTS "profiles_published_idx" ON "profiles"("published");

DO $$
BEGIN
  ALTER TABLE "profiles"
    ADD CONSTRAINT "profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
