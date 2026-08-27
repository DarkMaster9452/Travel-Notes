/**
 * Central product configuration. Prices, limits and copy that the business
 * side is likely to change live here and nowhere else.
 *
 * Safe to import from client components — no secrets.
 */

import type { Messages } from "@/lib/i18n";

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
  /** Explorer's range: anywhere in Europe. */
  | "europe"
  /** Ultra's range: every continent in the catalogue. */
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
  "europe",
  "mail",
  "reroll",
  "matching",
  "printedStickers",
] as const satisfies readonly Capability[];

/**
 * How many stickers each tier can hold.
 *
 * The sheet is the same for everyone — what changes is how much of it an
 * account can reach. A free account gets the first row, which is enough to
 * see that the sheet is real; the rest stay on the sheet as blanks rather
 * than being hidden, because a sticker you can see you haven't got is the
 * whole mechanic.
 */
export const STICKER_ALLOWANCE: Record<PlanId, number> = {
  free: 6,
  explorer: 10,
  ultra: 36,
};

/**
 * Cancel any time, and a full refund inside this window.
 *
 * Stated in one place because it is a promise: the plan card, the cancel
 * dialog and the confirmation all read this number, so the guarantee can
 * never be advertised as one length and honoured as another.
 */
export const REFUND_WINDOW_DAYS = 7;

/**
 * What has to be typed out before anything irreversible happens.
 *
 * One constant so the dialog, the disabled state on its button and the
 * server-side check can never disagree about what counts as confirmation.
 */
export const DELETE_PHRASE = "DELETE EVERYTHING";

/**
 * When the money-back window closes for a subscription that began at `start`.
 *
 * Measured from the start of the *current period*, so it covers a new
 * subscription's first week — the case the guarantee is actually for — rather
 * than re-arming at every renewal for someone who has been a member a year.
 */
export function refundDeadline(start: Date | null): Date | null {
  if (!start) return null;
  return new Date(start.getTime() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

/** Whether the guarantee is still open. Reading the clock lives here rather
 *  than in a component body, where it would be an impure call during render. */
export function isWithinRefundWindow(start: Date | null, now: Date = new Date()): boolean {
  const deadline = refundDeadline(start);
  return deadline !== null && now.getTime() <= deadline.getTime();
}

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tier: 0,
    kicker: `${FREE_QUEST_ALLOWANCE} quests`,
    description: "Three real quests, to find out whether being told what to do suits you.",
    price: { monthly: 0, yearly: 0 },
    currency: "EUR",
    features: [
      `${FREE_QUEST_ALLOWANCE} real quests`,
      "Your own country",
      `The first ${STICKER_ALLOWANCE.free} stickers`,
    ],
    missing: ["No inbox delivery", "No partner matching"],
    capabilities: [],
  },
  {
    id: "explorer",
    name: "Explorer",
    tier: 1,
    kicker: "Unlimited quests",
    description: "Unlimited quests anywhere in Europe, in your inbox on the morning you pick.",
    price: { monthly: 499, yearly: 3999 },
    currency: "EUR",
    features: [
      "Unlimited quests",
      "Anywhere in Europe",
      `${STICKER_ALLOWANCE.explorer} stickers to collect`,
      "Quests by mail",
      "Re-roll, skip and pause",
      "Partner matching & the board",
      "Printed sticker sheets, posted",
    ],
    missing: ["Europe only — not worldwide"],
    badge: "Most taken",
    capabilities: EXPLORER_CAPABILITIES,
  },
  {
    id: "ultra",
    name: "Ultra Explorer",
    tier: 2,
    kicker: "Worldwide, priority",
    description: "Every range on the map, and quests built around something specific.",
    price: { monthly: 1299, yearly: 9999 },
    currency: "EUR",
    features: [
      "Everything in Explorer",
      "Worldwide range, every continent",
      `All ${STICKER_ALLOWANCE.ultra} stickers`,
      "Custom quests you commission",
      "Multi-day and trip-week quests",
      "Priority support, real replies",
      "Private crews & invite links",
    ],
    highlight: true,
    capabilities: [
      ...EXPLORER_CAPABILITIES,
      "worldwide",
      "customQuests",
      "multiDay",
      "priority",
      "crews",
    ],
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
  europe: {
    title: "Anywhere in Europe",
    detail: "Every European range in the catalogue, not just your own country.",
  },
  worldwide: {
    title: "Worldwide range",
    detail: "Every continent in the catalogue. Explorer stops at Europe.",
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
    title: "Stickers in the post",
    detail: "Two die-cut stickers ride along with the quest card on the 2nd of each month.",
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

/**
 * The capabilities worth naming on a card, in order.
 *
 * Ultra holds `europe` as well as `worldwide` — it has to, or a Europe-only
 * check would refuse the tier above it — but saying "Anywhere in Europe" to
 * an Ultra member describes a limit they paid to remove. Superseded
 * capabilities are dropped from the telling, not from the grant.
 */
/**
 * Every capability the product sells, in the order a card lists them.
 *
 * Derived from the plans rather than written out again, so a capability added
 * to a tier appears on the "what your plan includes" list without anybody
 * remembering to add it twice.
 */
export const ALL_CAPABILITIES: Capability[] = [
  ...new Set(PLANS.flatMap((plan) => plan.capabilities)),
];

/**
 * The cheapest plan that grants a capability.
 *
 * What a locked feature should say to somebody who wants it: not "you don't
 * have this" but "this one has it". Returns null for a capability no plan
 * grants, which would be a definition bug rather than a state to render.
 */
export function lowestPlanWith(capability: Capability): PlanId | null {
  const holder = [...PLANS]
    .sort((a, b) => a.tier - b.tier)
    .find((plan) => plan.capabilities.includes(capability));
  return holder?.id ?? null;
}

export function headlineCapabilities(definition: PlanDefinition, limit = 3): Capability[] {
  const held = new Set(definition.capabilities);
  return definition.capabilities
    .filter((capability) => !(capability === "europe" && held.has("worldwide")))
    .slice(0, limit);
}

export function formatPrice(minorUnits: number, currency: PlanDefinition["currency"] = "EUR") {
  if (minorUnits === 0) return "Free";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
  }).format(minorUnits / 100);
}

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/monthly", label: "The monthly" },
  { href: "/quests", label: "Quest database" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

/* -------------------------------------------------------------------------- */
/* The same plans, in the reader's language                                    */
/* -------------------------------------------------------------------------- */

/**
 * Plan copy, translated.
 *
 * `PLANS` keeps the facts — ids, tiers, prices, capabilities — because those
 * are the same in every language and a price that varied by dictionary would
 * be a bug waiting to happen. Only the words come from here, keyed by the
 * plan's own id, and the counts are interpolated by the translation rather
 * than baked into it, so a language can put the number where it wants it.
 */
export type PlanCopy = {
  name: string;
  kicker: string;
  description: string;
  features: string[];
  missing: string[];
  badge?: string;
};

export function planCopy(t: Messages, plan: PlanId): PlanCopy {
  if (plan === "free") {
    return {
      name: t.plans.free.name,
      kicker: t.plans.free.kicker(FREE_QUEST_ALLOWANCE),
      description: t.plans.free.description,
      features: t.plans.free.features(FREE_QUEST_ALLOWANCE, STICKER_ALLOWANCE.free),
      missing: t.plans.free.missing,
    };
  }

  if (plan === "explorer") {
    return {
      name: t.plans.explorer.name,
      kicker: t.plans.explorer.kicker,
      description: t.plans.explorer.description,
      features: t.plans.explorer.features(STICKER_ALLOWANCE.explorer),
      missing: t.plans.explorer.missing,
      badge: t.plans.explorer.badge,
    };
  }

  return {
    name: t.plans.ultra.name,
    kicker: t.plans.ultra.kicker,
    description: t.plans.ultra.description,
    features: t.plans.ultra.features(STICKER_ALLOWANCE.ultra),
    missing: t.plans.ultra.missing,
  };
}

/** What a capability is called, in the reader's language. */
export function capabilityCopy(
  t: Messages,
  capability: Capability,
): { title: string; detail: string } {
  return t.capabilities[capability];
}
