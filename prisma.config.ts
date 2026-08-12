import "dotenv/config";

import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * From v7 the connection URL lives here rather than in `schema.prisma`, and
 * the CLI no longer loads `.env` implicitly — hence the import above.
 *
 * Migrations run over the **direct** (non-pooled) endpoint: Neon's pooler
 * multiplexes connections, which the schema engine's advisory locks and DDL
 * don't tolerate. The application itself uses the pooled `DATABASE_URL`.
 */
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
