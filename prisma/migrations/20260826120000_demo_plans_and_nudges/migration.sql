-- Subscriptions activated without money changing hands.
-- Entitlement treats these exactly like paid ones; revenue must not.
ALTER TABLE "subscriptions" ADD COLUMN "demo" BOOLEAN NOT NULL DEFAULT false;

-- Things the product needs to ask for, later.
CREATE TYPE "NudgeKind" AS ENUM ('SHIPPING_ADDRESS');

CREATE TABLE "nudges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "NudgeKind" NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "seen_at" TIMESTAMP(3),
    "done_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nudges_pkey" PRIMARY KEY ("id")
);

-- One row per kind per account: activating a plan twice must not queue the
-- same question twice.
CREATE UNIQUE INDEX "nudges_user_id_kind_key" ON "nudges"("user_id", "kind");
CREATE INDEX "nudges_user_id_due_at_idx" ON "nudges"("user_id", "due_at");

ALTER TABLE "nudges" ADD CONSTRAINT "nudges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
