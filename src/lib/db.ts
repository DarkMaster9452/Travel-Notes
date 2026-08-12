import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

/**
 * Prisma client, constructed on first use.
 *
 * Lazy for the same reason the environment is: importing this module during a
 * build must not require a database URL. The first query constructs the
 * client (and validates the environment); the instance is then reused, and
 * cached on `globalThis` in development so hot reloads don't exhaust the pool.
 *
 * Prisma 7 connects through a driver adapter rather than its own engine.
 * node-postgres is the portable choice: it speaks to Neon's pooled endpoint
 * and to a plain local Postgres with the same code. If you deploy to an edge
 * runtime, swap this for `@prisma/adapter-neon`.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  const client = new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  if (env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

function client(): PrismaClient {
  return (globalForPrisma.prisma ??= createClient());
}

export const db = new Proxy({} as PrismaClient, {
  get: (_target, property: string | symbol) => {
    const value = Reflect.get(client(), property);
    return typeof value === "function" ? value.bind(client()) : value;
  },
});
