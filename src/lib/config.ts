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

/** The three tiers, lowercase everywhere in the app. `Plan` in the database is
 *  the same set, uppercased. */
export type PlanId = "free" | "explorer" | "ultra";

/**
 * What a plan can actually do.
 *
 * The single vocabulary for "does this account have X?". Pages ask the
 * entitlement for a capability rather than comparing plan names, so adding a
 * tier never means hunting for `=== "explorer"` across the codebase.
 */
export type Capability =
  | "unlimited"
  | "worldwide"
  | "mail"
  | "reroll"
  | "matching"
  | "printedStickers"
  | "customQuests"
  | "multiDay"
  | "priority"
  | "crews";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  /** Rank. Higher is more: used for "is this an upgrade?" without a lookup table. */
  tier: number;
  kicker: string;
  /** One line, on the card. The long pitch is the feature list. */
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
  capabilities: readonly Capability[];
};

const EXPLORER_CAPABILITIES = [
  "unlimited",
  "worldwide",
  "mail",
  "reroll",
  "matching",
  "printedStickers",
] as const satisfies readonly Capability[];

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tier: 0,
    kicker: `${FREE_QUEST_ALLOWANCE} quests`,
    description: "Three real quests, to find out whether being told what to do suits you.",
    price: { monthly: 0, yearly: 0 },
    currency: "EUR",
    features: ["3 real quests", "Your own country", "History & digital stickers"],
    missing: ["No inbox delivery", "No partner matching"],
    capabilities: [],
  },
  {
    id: "explorer",
    name: "Explorer",
    tier: 1,
    kicker: "Unlimited quests",
    description: "Unlimited quests, worldwide, in your inbox on the morning you pick.",
    price: { monthly: 1100, yearly: 9400 },
    currency: "EUR",
    features: [
      "Unlimited quests",
      "Worldwide range",
      "Quests by mail",
      "Re-roll, skip and pause",
      "Partner matching & the board",
      "Printed sticker sheets, posted",
    ],
    badge: "Most taken",
    capabilities: EXPLORER_CAPABILITIES,
  },
  {
    id: "ultra",
    name: "Ultra Explorer",
    tier: 2,
    kicker: "Everything, priority",
    description: "For quests built around something specific — a season, a range, a goal.",
    price: { monthly: 3100, yearly: 26400 },
    currency: "EUR",
    features: [
      "Everything in Explorer",
      "Custom quests you commission",
      "Multi-day and trip-week quests",
      "Priority support, real replies",
      "Private crews & invite links",
    ],
    highlight: true,
    capabilities: [...EXPLORER_CAPABILITIES, "customQuests", "multiDay", "priority", "crews"],
  },
];

export const FREE_PLAN = PLANS.find((p) => p.id === "free")!;
export const EXPLORER_PLAN = PLANS.find((p) => p.id === "explorer")!;
export const ULTRA_PLAN = PLANS.find((p) => p.id === "ultra")!;

export function planById(id: PlanId): PlanDefinition {
  return PLANS.find((plan) => plan.id === id) ?? FREE_PLAN;
}

/** `Plan` in the database is the same set, uppercased. */
export function planIdFromRecord(plan: string | null | undefined): PlanId {
  const lowered = (plan ?? "free").toLowerCase();
  return lowered === "explorer" || lowered === "ultra" ? lowered : "free";
}

/**
 * What subscribing actually changed, in the order a new member should meet it.
 *
 * The post-checkout page walks this list one line at a time, and the same list
 * is what a card shows to say "this is what you now have" — so the promise made
 * at checkout and the promise shown afterwards can never drift apart.
 */
export const CAPABILITY_COPY: Record<Capability, { title: string; detail: string }> = {
  unlimited: {
    title: "Unlimited quests",
    detail: "The counter is gone. Take another the moment you log one.",
  },
  worldwide: {
    title: "Worldwide range",
    detail: "Every range in the catalogue, not just your own country.",
  },
  mail: {
    title: "Quests by mail",
    detail: "One quest, the morning you chose, already decided.",
  },
  reroll: {
    title: "Re-roll, skip and pause",
    detail: "Weather turned? Re-roll it. Nothing counts against you.",
  },
  matching: {
    title: "Partner matching",
    detail: "Ask for company and the board opens up.",
  },
  printedStickers: {
    title: "Printed sticker sheets",
    detail: "The die-cut sheet is posted to you once a season.",
  },
  customQuests: {
    title: "Custom quests",
    detail: "Commission one built around a season, a range or a goal.",
  },
  multiDay: {
    title: "Multi-day quests",
    detail: "Hut to hut, trip weeks, the ones that need a Friday off.",
  },
  priority: {
    title: "Priority support",
    detail: "Real replies from the people who built this.",
  },
  crews: {
    title: "Private crews",
    detail: "Invite links, a closed board, group quests with one mail each.",
  },
};

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
