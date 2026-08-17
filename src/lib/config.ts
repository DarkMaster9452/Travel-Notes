/**
 * Central product configuration. Prices, limits and copy that the business
 * side is likely to change live here and nowhere else.
 *
 * Safe to import from client components — no secrets.
 */

export const BRAND = {
  name: "Summit Quest",
  tagline: "Your next summit is waiting.",
  supportEmail: "hello@summitquest.example",
} as const;

/** Quests a brand-new account gets before the paywall. */
export const FREE_QUEST_ALLOWANCE = 3;

/** Quest unlock rate limit (per user, fixed window). */
export const UNLOCK_RATE_LIMIT = {
  max: 12,
  windowSeconds: 60 * 60,
} as const;

/** Auth attempt rate limit (per IP + email, fixed window). */
export const AUTH_RATE_LIMIT = {
  max: 10,
  windowSeconds: 15 * 60,
} as const;

export type BillingInterval = "monthly" | "yearly";

export type PlanDefinition = {
  id: "free" | "explorer" | "ultra";
  name: string;
  kicker: string;
  description: string;
  /** Minor units (cents). Rendered through `formatPrice`. */
  price: Record<BillingInterval, number>;
  currency: "EUR";
  features: string[];
  /** Struck-through lines, as on the landing page's Free column. */
  missing?: string[];
  /** Short label shown as a badge on the plan card, e.g. "Most popular". */
  badge?: string;
  highlight?: boolean;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    kicker: `${FREE_QUEST_ALLOWANCE} quests`,
    description:
      "An account and three real quests. Enough to find out whether being told what to do suits you.",
    price: { monthly: 0, yearly: 0 },
    currency: "EUR",
    features: [
      "Free account + 3 real quests",
      "Your own country only",
      "Quest history & digital stickers",
    ],
    missing: ["No inbox delivery", "No partner matching"],
  },
  {
    id: "explorer",
    name: "Explorer",
    kicker: "Unlimited quests",
    description:
      "The real thing: unlimited quests, worldwide, delivered to your inbox on the day you pick.",
    price: { monthly: 1100, yearly: 9400 },
    currency: "EUR",
    features: [
      "Unlimited quest generation",
      "Worldwide range, any terrain",
      "Quests by mail, on your schedule",
      "Full quest history",
      "Re-roll, skip and pause",
      "Partner matching & the community board",
      "Printed sticker sheets, posted to you",
    ],
    badge: "Most taken",
  },
  {
    id: "ultra",
    name: "Ultra Explorer",
    kicker: "Everything, priority",
    description:
      "For people who want the quest built around something specific — a season, a range, a goal.",
    price: { monthly: 3100, yearly: 26400 },
    currency: "EUR",
    features: [
      "Everything in Explorer",
      "Custom quests you commission",
      "Multi-day and trip-week quests",
      "Priority support, real replies",
      "Private crews & invite links",
      "Group quests, one mail each",
    ],
    highlight: true,
  },
];

export const EXPLORER_PLAN = PLANS.find((p) => p.id === "explorer")!;
export const ULTRA_PLAN = PLANS.find((p) => p.id === "ultra")!;

export function formatPrice(minorUnits: number, currency: PlanDefinition["currency"] = "EUR") {
  if (minorUnits === 0) return "Free";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
  }).format(minorUnits / 100);
}

export const NAV_LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/history", label: "Quests" },
  { href: "/saved", label: "Saved" },
  { href: "/profile", label: "Profile" },
] as const;
