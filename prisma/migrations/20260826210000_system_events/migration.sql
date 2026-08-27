-- The panel's systems log: one row per probe and per scheduled run.
--
-- Append-only and deliberately flat — no foreign key, because a system is a
-- piece of wiring rather than a row somewhere, and a probe of a database that
-- is down must still be writable the moment it comes back.
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latency_ms" INTEGER,
    "detail" TEXT,
    "ran" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- One system's timeline, newest first — the query every detail page runs.
CREATE INDEX "system_events_system_created_at_idx" ON "system_events"("system", "created_at");

-- The sweep, which asks only for age.
CREATE INDEX "system_events_created_at_idx" ON "system_events"("created_at");
