-- DropIndex
DROP INDEX "quests_is_showcase_idx";

-- AlterTable
ALTER TABLE "quests" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'sk';

-- CreateIndex
CREATE INDEX "quests_is_showcase_locale_idx" ON "quests"("is_showcase", "locale");
