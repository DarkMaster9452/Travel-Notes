import "server-only";

import { z } from "zod";

/**
 * Server-side environment. Anything read here must never be imported from a
 * client component — the `server-only` guard turns that into a build error.
 *
 * Validation is *lazy*. Reading `env.DATABASE_URL` parses and throws on the
 * first access, but merely importing this module does not: build machines
 * legitimately compile the app without runtime secrets (Vercel injects them at
 * request time), and a build shouldn't fail for want of a database password it
 * will never use. Misconfiguration still fails loudly — on the first request
 * that needs the value, with the same message.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters — generate with `openssl rand -hex 32`"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Paddle server API key. Sandbox keys contain `_sdbx`. */
  PADDLE_API_KEY: z.string().optional().default(""),
  /** The secret Paddle signs webhook bodies with. Empty refuses every delivery. */
  PADDLE_WEBHOOK_SECRET: z.string().optional().default(""),
  /**
   * Which Paddle to talk to. Sandbox unless something explicitly says
   * otherwise — the expensive mistake here is billing a real card from a
   * branch, not failing to bill a fake one.
   */
  PADDLE_ENV: z.enum(["sandbox", "production"]).optional().default("sandbox"),
  PADDLE_PRICE_ID_EXPLORER_MONTHLY: z.string().optional().default(""),
  PADDLE_PRICE_ID_EXPLORER_YEARLY: z.string().optional().default(""),
  PADDLE_PRICE_ID_ULTRA_MONTHLY: z.string().optional().default(""),
  PADDLE_PRICE_ID_ULTRA_YEARLY: z.string().optional().default(""),
  STRAVA_CLIENT_ID: z.string().optional().default(""),
  STRAVA_CLIENT_SECRET: z.string().optional().default(""),
  /** Vercel Blob, for proof photographs. Empty disables uploads with a message. */
  BLOB_READ_WRITE_TOKEN: z.string().optional().default(""),
  /** Transactional email. Empty means notifications are logged, never sent. */
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("Summit Quest <quests@summitquest.app>"),
  /** Bearer secret the scheduled routes require. Empty refuses every call. */
  CRON_SECRET: z.string().optional().default(""),
  /** Hand every plan over for nothing. See `isDemoPlans`. */
  DEMO_PLANS: z.string().optional().default(""),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

function load(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    PADDLE_API_KEY: process.env.PADDLE_API_KEY,
    PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
    PADDLE_ENV: process.env.PADDLE_ENV,
    PADDLE_PRICE_ID_EXPLORER_MONTHLY: process.env.PADDLE_PRICE_ID_EXPLORER_MONTHLY,
    PADDLE_PRICE_ID_EXPLORER_YEARLY: process.env.PADDLE_PRICE_ID_EXPLORER_YEARLY,
    PADDLE_PRICE_ID_ULTRA_MONTHLY: process.env.PADDLE_PRICE_ID_ULTRA_MONTHLY,
    PADDLE_PRICE_ID_ULTRA_YEARLY: process.env.PADDLE_PRICE_ID_ULTRA_YEARLY,
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    CRON_SECRET: process.env.CRON_SECRET,
    DEMO_PLANS: process.env.DEMO_PLANS,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill it in.`,
    );
  }

  cached = parsed.data;
  return cached;
}

export const env = new Proxy({} as ServerEnv, {
  get: (_target, property: string) => load()[property as keyof ServerEnv],
  has: (_target, property: string) => property in load(),
  ownKeys: () => Reflect.ownKeys(load()),
  getOwnPropertyDescriptor: (_target, property) =>
    Reflect.getOwnPropertyDescriptor(load(), property),
});

/**
 * Paddle is optional in development; the UI degrades instead of crashing.
 * A function rather than a constant so it doesn't force validation at import.
 *
 * Selling needs three things and this checks all three, because two of them
 * are not enough to open a checkout: the server key to read subscriptions
 * back, the *client* token that Paddle.js is initialised with, and at least
 * one price to sell. A deployment with a server key and no client token would
 * render a buy button that cannot open anything.
 */
export function isPaddleEnabled(): boolean {
  return (
    (process.env.PADDLE_API_KEY ?? "").length > 0 &&
    (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "").length > 0 &&
    (process.env.PADDLE_PRICE_ID_EXPLORER_MONTHLY ?? "").length > 0
  );
}

/**
 * Which Paddle this deployment talks to, for the places that must *say* so.
 *
 * Read straight from `process.env` rather than through the parsed object so
 * it can be called from anywhere without forcing validation, and so a
 * mistyped value reads as sandbox rather than as production.
 */
export function paddleEnvironment(): "sandbox" | "production" {
  return process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
}

/**
 * Ultra is optional on top of Explorer: a deployment can sell one tier without
 * the other, and the plan card says so instead of opening a checkout that
 * Paddle would reject.
 */
export function isUltraEnabled(): boolean {
  return isPaddleEnabled() && (process.env.PADDLE_PRICE_ID_ULTRA_MONTHLY ?? "").length > 0;
}

/**
 * Every plan, free, activated with a button.
 *
 * On by default wherever Paddle is not configured, which is the honest
 * reading of that state: a deployment that cannot take money and also will not
 * hand anything over is a deployment where nothing works. Set `DEMO_PLANS=0`
 * to turn it off anyway, or `DEMO_PLANS=1` to keep it on alongside a live
 * Paddle — useful while a launch is being demonstrated.
 *
 * What this does *not* do is change what a plan means. A demo activation
 * writes the same subscription row with the same plan and the same status, so
 * every capability check, every sticker allowance and every locked panel
 * behaves exactly as it will when the money is real. The only difference is
 * the `demo` flag, and the only thing that reads it is the revenue page.
 */
export function isDemoPlans(): boolean {
  const flag = (process.env.DEMO_PLANS ?? "").trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  if (flag.length > 0) return true;
  return !isPaddleEnabled();
}

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
