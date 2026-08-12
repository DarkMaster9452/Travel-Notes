-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "QuestCategory" AS ENUM ('SUMMIT', 'WATERFALL', 'CASTLE', 'MICRO');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HikeDifficulty" AS ENUM ('BRUTAL', 'HARD', 'MODERATE', 'EASY', 'VERY_EASY');

-- CreateEnum
CREATE TYPE "HikeComparison" AS ENUM ('HARDER', 'SIMILAR', 'EASIER', 'FIRST');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "rules_accepted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "weekly_quests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "QuestCategory" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 200,
    "cover_image" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "published_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "caption" TEXT,
    "difficulty" "HikeDifficulty" NOT NULL,
    "comparison" "HikeComparison" NOT NULL DEFAULT 'FIRST',
    "compared_to_quest_id" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "admin_note_public" BOOLEAN NOT NULL DEFAULT true,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_reactions" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_comments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_quests_published_at_idx" ON "weekly_quests"("published_at");

-- CreateIndex
CREATE INDEX "weekly_quests_closes_at_idx" ON "weekly_quests"("closes_at");

-- CreateIndex
CREATE INDEX "submissions_status_created_at_idx" ON "submissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "submissions_quest_id_status_idx" ON "submissions"("quest_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_user_id_quest_id_key" ON "submissions"("user_id", "quest_id");

-- CreateIndex
CREATE INDEX "submission_reactions_submission_id_idx" ON "submission_reactions"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_reactions_submission_id_user_id_emoji_key" ON "submission_reactions"("submission_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "submission_comments_submission_id_created_at_idx" ON "submission_comments"("submission_id", "created_at");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "users_points_idx" ON "users"("points");

-- AddForeignKey
ALTER TABLE "weekly_quests" ADD CONSTRAINT "weekly_quests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "weekly_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_reactions" ADD CONSTRAINT "submission_reactions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_reactions" ADD CONSTRAINT "submission_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_comments" ADD CONSTRAINT "submission_comments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_comments" ADD CONSTRAINT "submission_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
