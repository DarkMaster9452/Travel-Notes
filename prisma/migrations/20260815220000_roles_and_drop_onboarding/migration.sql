-- Roles, the third plan tier, and the removal of onboarding + cosmetics.

-- Who someone is, as opposed to what they have paid for. Admins are flagged
-- here and never self-serve; nothing in the product writes this column.
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

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
