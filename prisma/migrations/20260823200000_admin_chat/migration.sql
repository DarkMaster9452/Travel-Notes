-- The back-office room, and the one timestamp that makes "unread" answerable.
--
-- Guarded like every migration since the roles change: this database has
-- drifted from the migration record before.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_chat_read_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "admin_messages" (
  "id"         TEXT NOT NULL,
  "author_id"  TEXT,
  "body"       TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at"  TIMESTAMP(3),

  CONSTRAINT "admin_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_messages_created_at_idx"
  ON "admin_messages" ("created_at");

-- Detaches rather than cascades: deleting a colleague's account must not
-- rewrite last month's decisions out of the record.
DO $$
BEGIN
  ALTER TABLE "admin_messages"
    ADD CONSTRAINT "admin_messages_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
