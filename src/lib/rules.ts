import { REFUND_WINDOW_DAYS } from "@/lib/config";

/**
 * The rules of the game, in one place.
 *
 * Written as data rather than as a page because they are said in three
 * places — the rules page itself, a short version in Settings, and the odd
 * line quoted next to a form — and rules that are typed out twice drift apart.
 * Whatever this file says is what the product does; if a rule here stops being
 * true, that is a bug in the product, not in the copy.
 *
 * Deliberately not the legal terms. `/legal/terms` is the contract; this is
 * how the thing works, in the words somebody would use out loud.
 */

export type Rule = {
  /** Short enough to scan down the page. */
  title: string;
  body: string;
};

export type RuleGroup = {
  id: string;
  /** The question this group answers. */
  heading: string;
  intro: string;
  rules: Rule[];
};

export const RULES: RuleGroup[] = [
  {
    id: "quests",
    heading: "Getting a quest",
    intro: "You do not pick the hike. That is the whole premise, and everything else follows from it.",
    rules: [
      {
        title: "One at a time",
        body: "A quest is issued to you and it is yours until you log it. There is no feed, no catalogue to browse and nothing to save for later.",
      },
      {
        title: "You are never sent the same quest twice",
        body: "Every quest you have ever been given is remembered, and none of them comes back. A place can come round again once you have been everywhere we know, but the day it asks for will be a different one.",
      },
      {
        title: "Re-rolling is free and does not count against you",
        body: "Not today is a complete answer. Ask for another and the one you turned down is retired anyway — it will not be offered again.",
      },
    ],
  },
  {
    id: "cadence",
    heading: "The weekly and the monthly",
    intro:
      "Two quests run on a clock rather than on your history, and everybody on the plan gets the same one.",
    rules: [
      {
        title: "The monthly opens on the 1st at 06:00",
        body: "It is the headline: the big one, and it stays open until the month ends. If a monthly is live for you, logging it is not optional.",
      },
      {
        title: "The weekly drops Monday at 06:00 and closes Sunday at 23:59",
        body: "Smaller, alongside the monthly, and the log shuts the instant the next one opens. A weekly you did not file is a weekly you missed — there is no filing it late.",
      },
      {
        title: "Both must be filed",
        body: "The countdown on each page is the real deadline. Miss it and the slot closes with nothing in it; the quest is not re-issued and it does not roll over.",
      },
    ],
  },
  {
    id: "proof",
    heading: "Logging it",
    intro: "Nothing counts until somebody has read it. That is what makes the stickers worth having.",
    rules: [
      {
        title: "An account of the day, and at least one photograph",
        body: "Written proof alone is not something anyone can check. The photo does not have to be good; it has to be yours and it has to be from that day.",
      },
      {
        title: "The figures are yours to state",
        body: "Distance, climb and moving time as your watch recorded them. They are compared against what the quest asked for, and a sensible gap is expected — routes wander.",
      },
      {
        title: "Turning back counts",
        body: "An honest retreat is approved, not failed. Say you turned back when you file it and it goes into your history as a completed quest.",
      },
      {
        title: "Inventing one is the only thing that ends an account",
        body: "Everything else here is recoverable. A log that did not happen is not, and any sticker standing on it is taken back with it.",
      },
    ],
  },
  {
    id: "stickers",
    heading: "Stickers",
    intro: "Earned, never given, and derived from your history rather than handed out by anyone.",
    rules: [
      {
        title: "They unlock the moment the quest behind them is approved",
        body: "There is nothing to claim. The sheet recalculates from what you have logged, so a sticker appears the same second the evidence for it does.",
      },
      {
        title: "Your plan decides how far down the sheet you reach",
        body: "The whole sheet is always visible. Past what your plan reaches, a sticker is blurred — you can see something is there and that it is not yours, and nothing else.",
      },
      {
        title: "One can be taken back",
        body: "Only when the history under it turns out to be wrong — an approval reversed, a log withdrawn. It is recorded with a reason, and earning it again does not bring it back.",
      },
    ],
  },
  {
    id: "people",
    heading: "Other people",
    intro:
      "Nothing about you is public until you say so, and it stops being public the moment you change your mind.",
    rules: [
      {
        title: "Your profile is private until you publish it",
        body: "A published profile shows your name, what you have logged and whatever you chose to put on it. An unpublished one is visible to you and to nobody else.",
      },
      {
        title: "You choose what goes on it",
        body: "The bio, the links, the photos and whether your figures are shown at all are each yours to set. Anything you have not filled in is simply not there.",
      },
      {
        title: "Never a home address, never exact coordinates",
        body: "Where you set out from is a country and stays a country. Nothing in the product asks for more precision than that, so nothing can leak it.",
      },
    ],
  },
  {
    id: "safety",
    heading: "Safety",
    intro: "A quest is an assignment, not a guarantee. This part is not negotiable.",
    rules: [
      {
        title: "The mountain is not part of the product",
        body: "Routes are publicly documented and marked. A map, a weather check on the morning and your own judgement about whether to go are still yours to bring.",
      },
      {
        title: "Night starts are off until you turn them on",
        body: "They are never issued by default, and turning them off again takes one setting.",
      },
      {
        title: "If it is a bad day, do not go",
        body: "Nothing here is worth it. A skipped quest costs you nothing at all.",
      },
    ],
  },
  {
    id: "money",
    heading: "Paying for it",
    intro: "Short version: you can leave whenever you like.",
    rules: [
      {
        title: "Cancel any time",
        body: "From Settings, in one click. You keep everything to the end of the period you have already paid for.",
      },
      {
        title: `Money back inside ${REFUND_WINDOW_DAYS} days`,
        body: `Cancel within ${REFUND_WINDOW_DAYS} days of paying and it is refunded in full, no questions and no form. After that the cancellation simply stops the next payment.`,
      },
      {
        title: "Your history is yours either way",
        body: "Dropping to free does not delete anything you have logged. The quests, the photographs and the stickers you earned stay on the account.",
      },
    ],
  },
];

/** The one-line version, for the panel in Settings. */
export const RULES_SUMMARY =
  "You are issued the quest. Nothing counts until it is checked. Turning back counts. Nobody is ever sent the same quest twice.";
