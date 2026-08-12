/**
 * Central product configuration. Prices, limits and copy that the business
 * side is likely to change live here and nowhere else.
 *
 * Safe to import from client components — no secrets.
 */

export const BRAND = {
  name: "SIDEQUEST",
  tagline: "Your next side quest is waiting.",
  supportEmail: "hello@sidequest.example",
} as const;

/** Quests a brand-new account gets before the paywall. */
export const FREE_QUEST_ALLOWANCE = 3;

/** Quest generation rate limit (per user, fixed window). */
export const GENERATION_RATE_LIMIT = {
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
  id: "free" | "explorer";
  name: string;
  kicker: string;
  description: string;
  /** Minor units (cents). Rendered through `formatPrice`. */
  price: Record<BillingInterval, number>;
  currency: "EUR";
  features: string[];
  highlight?: boolean;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Scout",
    kicker: `${FREE_QUEST_ALLOWANCE} quests`,
    description: "Enough to find out whether leaving the house is your thing.",
    price: { monthly: 0, yearly: 0 },
    currency: "EUR",
    features: [
      "3 personalised quests",
      "Basic preferences",
      "Quest history",
      "Saved quests",
    ],
  },
  {
    id: "explorer",
    name: "Explorer",
    kicker: "Unlimited quests",
    description: "For people who keep running out of weekends, not ideas.",
    // Placeholder pricing — change here, or override with Stripe price data.
    price: { monthly: 700, yearly: 6000 },
    currency: "EUR",
    features: [
      "Unlimited quest generation",
      "Advanced filters",
      "Personalised recommendations",
      "Saved quests & history",
      "More adventure types",
      "Richer objectives and bonus challenges",
      "Location-based recommendations",
    ],
    highlight: true,
  },
];

export const EXPLORER_PLAN = PLANS.find((p) => p.id === "explorer")!;

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
