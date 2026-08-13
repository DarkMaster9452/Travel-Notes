-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accent_color" TEXT NOT NULL DEFAULT 'moss',
ADD COLUMN     "avatar_style" TEXT NOT NULL DEFAULT 'initial',
ADD COLUMN     "banner_style" TEXT NOT NULL DEFAULT 'ridge',
ADD COLUMN     "explorer_title" TEXT;
