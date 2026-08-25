-- The owner role, and the panel's write log.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';

CREATE TABLE "admin_audit" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_created_at_idx" ON "admin_audit"("created_at");
CREATE INDEX "admin_audit_action_idx" ON "admin_audit"("action");

ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
