import "server-only";

import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Reuse the client across hot reloads so dev doesn't exhaust the pool.
if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
