-- Roles, the third plan tier, and the removal of onboarding + cosmetics.
--
-- Written to be safe against a database that already has some of this applied
-- out of band. The deployed database picked up `role` and the `Role` type
-- outside the migration history, so an unguarded CREATE TYPE / ADD COLUMN here
-- would abort the whole migration and take the deploy with it.

-- Who someone is, as opposed to what they have paid for. Admins are flagged
-- here and never self-serve; nothing in the product writes this column.
DO $$
BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER';

-- The pricing page has offered three tiers since launch; the enum only had two.
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'ULTRA';

-- Onboarding is gone: an account no longer has a half-finished state to be in,
-- so there is nothing to record. Preferences are written with defaults at
-- signup and edited in settings.
ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarded_at";

-- Cosmetics belonged to the previous product. The design system decides how a
-- surface looks, not a per-account setting.
ALTER TABLE "users" DROP COLUMN IF EXISTS "accent_color";
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_style";
ALTER TABLE "users" DROP COLUMN IF EXISTS "banner_style";
ALTER TABLE "users" DROP COLUMN IF EXISTS "explorer_title";
