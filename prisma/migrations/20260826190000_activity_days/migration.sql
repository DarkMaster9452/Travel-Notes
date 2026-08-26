-- One row per account per day something happened, behind the profile's year
-- grid. A count per day rather than a row per event: the grid only ever asks
-- how busy a day was, a year is 365 rows instead of thousands, and nothing
-- here reconstructs a timeline of exactly what somebody did and when.
CREATE TABLE "activity_days" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "activity_days_user_id_day_key" ON "activity_days"("user_id", "day");
CREATE INDEX "activity_days_user_id_day_idx" ON "activity_days"("user_id", "day");

ALTER TABLE "activity_days" ADD CONSTRAINT "activity_days_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The year grid is its own thing to be public about, so it gets its own
-- switch rather than riding on "what you have walked".
ALTER TABLE "profiles" ADD COLUMN "show_activity_grid" BOOLEAN NOT NULL DEFAULT true;
