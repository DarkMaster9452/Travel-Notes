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
  id: "free" | "explorer" | "ultra";
  name: string;
  kicker: string;
  description: string;
  /** Minor units (cents). Rendered through `formatPrice`. */
  price: Record<BillingInterval, number>;
  currency: "EUR";
  features: string[];
  /** Short label shown as a badge on the plan card, e.g. "Most popular". */
  badge?: string;
  highlight?: boolean;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    kicker: `${FREE_QUEST_ALLOWANCE} quests`,
    description: "Enough to find out whether leaving the house is your thing.",
    price: { monthly: 0, yearly: 0 },
    currency: "EUR",
    features: [
      "Only in your country",
      "Sticker only online",
      "Max 3 free quests",
      "Everything you've already been sent",
      "Your saved quests",
      "Marking quests as completed",
    ],
  },
  {
    id: "explorer",
    name: "Explorer",
    kicker: "Unlimited quests",
    description: "For people who keep running out of weekends, not ideas.",
    // Placeholder pricing — change here, or override with Stripe price data.
    price: { monthly: 1100, yearly: 9400 },
    currency: "EUR",
    features: [
      "World wide",
      "Sticker within post in mail — real",
      "Unlimited quest generation",
      "Advanced filters",
      "Personalised recommendations — chat with admin",
      "Saved quests & history",
      "More adventure types",
      "Richer objectives and bonus challenges + custom quest only for Explorer package",
    ],
    badge: "Most popular",
  },
  {
    id: "ultra",
    name: "Ultra Explorer",
    kicker: "Everything, priority",
    description: "The full package — priority access, real mail, nothing capped.",
    // Placeholder pricing — change here, or override with Stripe price data.
    price: { monthly: 3100, yearly: 26400 },
    currency: "EUR",
    features: [
      "World wide",
      "Sticker within post in mail — real",
      "Custom list from owners (certificate)",
      "Unlimited quest generation",
      "Advanced filters+",
      "Personalised recommendations — chat with admin (priority)",
      "Saved quests & history",
      "More adventure types (same as Explorer)",
      "Richer objectives and bonus challenges + custom quest only for Ultra Explorer package",
    ],
    badge: "Best value",
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
