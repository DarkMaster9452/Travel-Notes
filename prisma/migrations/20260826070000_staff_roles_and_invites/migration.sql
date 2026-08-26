-- Reader and writer join the desk, and invitations become a real row.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'READER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'WRITER';

CREATE TABLE "staff_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'READER',
    "token" TEXT NOT NULL,
    "invited_by_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_invites_email_key" ON "staff_invites"("email");
CREATE UNIQUE INDEX "staff_invites_token_key" ON "staff_invites"("token");
CREATE INDEX "staff_invites_expires_at_idx" ON "staff_invites"("expires_at");

ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_invited_by_id_fkey"
    FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
