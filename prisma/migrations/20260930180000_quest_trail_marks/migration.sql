-- KST trail marks along a quest's route, in walking order.
ALTER TABLE "quests" ADD COLUMN "trail_marks" TEXT[] DEFAULT ARRAY[]::TEXT[];
