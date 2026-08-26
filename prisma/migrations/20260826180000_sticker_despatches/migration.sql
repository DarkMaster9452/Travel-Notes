-- Which printed stickers have actually gone in an envelope.
--
-- Stickers are derived, so nothing recorded that one had been posted. Without
-- this the despatch job cannot keep the promise of two per envelope: it would
-- either send the same two every month or, as it did, send none.
CREATE TABLE "sticker_despatches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sticker_despatches_pkey" PRIMARY KEY ("id")
);

-- One row per account per sticker, so a job that runs twice on the 2nd posts
-- nothing twice.
CREATE UNIQUE INDEX "sticker_despatches_user_id_achievement_id_key"
    ON "sticker_despatches"("user_id", "achievement_id");
CREATE INDEX "sticker_despatches_user_id_posted_at_idx"
    ON "sticker_despatches"("user_id", "posted_at");

ALTER TABLE "sticker_despatches" ADD CONSTRAINT "sticker_despatches_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
