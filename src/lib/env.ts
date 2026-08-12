import "server-only";

import { z } from "zod";

/**
 * Server-side environment. Anything read here must never be imported from a
 * client component — the `server-only` guard turns that into a build error.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters — generate with `openssl rand -hex 32`"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PRICE_ID_EXPLORER_MONTHLY: z.string().optional().default(""),
  STRIPE_PRICE_ID_EXPLORER_YEARLY: z.string().optional().default(""),
});

const parsed = serverSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID_EXPLORER_MONTHLY: process.env.STRIPE_PRICE_ID_EXPLORER_MONTHLY,
  STRIPE_PRICE_ID_EXPLORER_YEARLY: process.env.STRIPE_PRICE_ID_EXPLORER_YEARLY,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill it in.`);
}

export const env = parsed.data;

/** Stripe is optional in development; the UI degrades instead of crashing. */
export const stripeEnabled =
  env.STRIPE_SECRET_KEY.length > 0 && env.STRIPE_PRICE_ID_EXPLORER_MONTHLY.length > 0;

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
