/**
 * English for everything a visitor reads before they have an account: the
 * landing page, login, signup, the legal shell and the error pages.
 *
 * Kept in its own file so the marketing copy can be read and edited as one
 * piece; it is spread into `en` in `../en.ts`, and `MarketingMessages` is the
 * shape `sk.ts` and `de.ts` here are checked against.
 */
export const marketingEn = {
  meta: {
    title: "Summit Quest — one mountain a month, for everybody",
    description:
      "One big quest a month and a smaller one every week. A real route with its trail marks, distance and ascent. Walk it, file your proof, earn the sticker and your place on the board.",
  },

  /* Words the shared UI primitives need. */
  ui: {
    dismiss: "Dismiss",
    close: "Close",
    menu: "Menu",
    language: "Language",
    skipToContent: "Skip to content",
    home: "Summit Quest home",
    required: "Required",
    optional: "optional",
  },

  landing: {
    nav: {
      how: "How it works",
      quests: "Weekly quests",
      proof: "Proof & board",
      stickers: "Stickers",
      pricing: "Plans",
      faq: "FAQ",
      login: "Log in",
      start: "Get started",
      yourQuests: "Your quests",
      openPanel: "Open the panel",
      label: "Sections",
    },
    hero: {
      overline: "One big quest a month · a new small one every week",
      title: "This month, everybody climbs the same mountain.",
      lede: "Summit Quest hands you a real route with its trail marks, distance and ascent, a time window and a sticker at the end. Walk it, file your proof, and see where you land on the board.",
      join: "Join the monthly quest",
      open: "Open the monthly quest",
      how: "How it works",
      example: "Example",
      emptyTitle: "The next monthly quest opens on the 1st.",
      emptyBody: "Create a free account now and it will be waiting for you the morning it drops.",
    },
    how: {
      overline: "How it works",
      title: "Four steps from the sofa to the summit.",
      lede: "No planning, no comparing routes until midnight. The route is chosen; you just go.",
      steps: [
        {
          title: "You get a route",
          body: "The monthly quest drops on the 1st, a weekly one every Monday. Each shows its trail marks, distance, ascent, time and where to park.",
        },
        {
          title: "You go",
          body: "Alone, with friends or with the dog. You have the whole window: a month for the big one, a week for the small one.",
        },
        {
          title: "You file your proof",
          body: "A few photos from the route, a Strava link, or a few lines about the day. A person reads every one.",
        },
        {
          title: "You earn the sticker",
          body: "Once approved you get points on the board and a sticker in your collection. Subscribers get theirs in the post too.",
        },
      ],
    },
    weekly: {
      overline: "Weekly quests",
      title: "A smaller outing for every week.",
      lede: "Shorter routes for a Saturday morning. They open on Monday at 06:00 and close on Sunday at midnight. Here are three from the database.",
      cta: "See every quest",
      cardFoot: "Route detail after you sign in",
      cardFootSignedIn: "Open the route",
      empty: "The quest database is being stocked. Check back soon.",
    },
    proof: {
      overline: "Proof & leaderboard",
      title: "It counts once somebody has checked it.",
      lede: "The stickers are real and the board is shared, so “I was there” has to mean something. Filing proof takes two minutes.",
      points: [
        {
          title: "Photos, Strava or a few lines",
          body: "Upload up to four photos from the route, attach a Strava activity, or describe the day in your own words.",
        },
        {
          title: "A person reads it",
          body: "No bots. You usually know within a day whether your proof is approved.",
        },
        {
          title: "Turning back counts too",
          body: "Weather turned? Log it as a retreat. A sensible decision is a result as well.",
        },
      ],
      card: {
        title: "Your proof",
        sent: "Filed",
        sentNote: "Photos and a note from the route",
        review: "Waiting for approval",
        reviewNote: "A person is reading it",
        approved: "Approved",
        approvedNote: "Points on the board, sticker unlocked",
      },
      board: {
        title: "A board every week and every month",
        body: "Points come from distance, ascent and difficulty. The top three take a medal.",
        gold: "Gold",
        silver: "Silver",
        bronze: "Bronze",
      },
    },
    stickers: {
      overline: "Stickers",
      title: "One sticker for every milestone.",
      lede: "Your first quest, a thousand metres of ascent, ten regions. They unlock the moment your proof is approved and stay in your collection.",
      points: {
        count: {
          title: (count: number) => `${count} stickers to collect`,
          body: "From the first walk to a full year without a missed month.",
        },
        post: {
          title: "Posted to your door",
          body: "Subscribers get an envelope every month with the quest card and two die-cut stickers.",
        },
        show: {
          title: "A collection worth showing",
          body: "Put your stickers on your public page. Or keep them to yourself.",
        },
      },
      cta: "Start collecting",
      sheetLabel: "A sample of the sticker sheet",
    },
    pricing: {
      overline: "Plans",
      title: "Try it free. Subscribe when it has you.",
      lede: (days: number) =>
        `Cancel any time. Change your mind within ${days} days and you get all of it back.`,
      billing: "Billing period",
      monthly: "Monthly",
      yearly: "Yearly",
      perMonth: "/ month",
      perYear: "/ year",
      forever: "forever",
      free: "Free",
      save: (percent: number) => `Save ${percent}%`,
      includes: "Includes",
      notIncluded: "Not included",
      cta: {
        free: "Create a free account",
        explorer: "Start with Explorer",
        ultra: "Go Ultra",
      },
      note: "Payments by Paddle · cancel any time",
      noteFree: "No card needed",
    },
    faq: {
      overline: "Before you ask",
      title: "Reasonable questions.",
      items: {
        picker: {
          q: "Is this just a random route picker?",
          a: "No. A quest is a route with a purpose: it has trail marks, distance, ascent, a time estimate, somewhere to park and one bonus challenge on top. And the monthly quest is walked by the whole community in the same month.",
        },
        free: {
          q: "What do I get for free?",
          a: (quests: number, stickers: number) =>
            `An account, ${quests} real quests from the database and the first ${stickers} stickers. No card. Unlimited quests, stickers in the post and more regions start at Explorer.`,
        },
        proof: {
          q: "How do I prove I was there?",
          a: "You file proof: up to four photos, a link to a Strava activity, or an account of the day. A person reads it and usually approves it or sends it back with a note within a day.",
        },
        weather: {
          q: "What if the weather turns or the route is too much?",
          a: "Turn around. You can log a retreat as well, and it is approved as a retreat, not as a failure. Every quest shows its difficulty up front on the peak meter.",
        },
        safety: {
          q: "Are the routes safe?",
          a: "Quests follow marked trails and each shows its distance, ascent and time estimate. They do not replace a map, the forecast or your own judgement. Please read the safety notice.",
        },
        stickers: {
          q: "What are the stickers?",
          a: "Every milestone has its own sticker. It unlocks once your proof is approved. Subscribers also get die-cut stickers in the post with the monthly quest card.",
        },
        company: {
          q: "Do I have to go with strangers?",
          a: "No. Solo is a first-class way to do this. If you want company, the app has people and groups you can compare yourself with.",
        },
        cancel: {
          q: "Can I cancel?",
          a: (days: number) =>
            `Any time, in settings. You keep access to the end of the period you paid for, and within ${days} days of starting we refund all of it.`,
        },
      },
    },
    cta: {
      title: "Somewhere out there is a morning waiting for you.",
      lede: "The account is free. This month's quest is already open.",
      primary: "Join the monthly quest",
      secondary: "See the plans",
    },
    footer: {
      blurb: "One big quest a month, a smaller one every week. Go outside.",
      product: "Product",
      account: "Account",
      legal: "Legal",
      login: "Log in",
      signup: "Create an account",
      terms: "Terms",
      privacy: "Privacy",
      safety: "Safety notice",
      motto: "Go outside · Leave no trace · Tell someone where you went",
      rights: (year: number) => `© ${year} Summit Quest`,
    },
  },

  auth: {
    login: {
      overline: "Welcome back",
      title: "Pick up where you left off.",
      lede: "Your quests, your proof and your stickers are where you left them.",
      submit: "Log in",
      swap: "No account yet?",
      swapLink: "Create one",
    },
    signup: {
      overline: "Free account",
      title: "Start your quest log.",
      lede: (quests: number) =>
        `One account holds your quests, your history and your stickers. ${quests} real quests free, no card.`,
      submit: "Create account",
      swap: "Already have an account?",
      swapLink: "Log in",
    },
    name: "First name",
    email: "Email",
    password: "Password",
    passwordHint: (min: number) => `At least ${min} characters.`,
    pending: "One moment…",
    terms: {
      before: "By creating an account you agree to the",
      terms: "terms",
      between: "and the",
      privacy: "privacy policy",
      after: ".",
    },
    side: {
      overline: "This month's quest",
      fallbackTitle: "One mountain a month, for everybody.",
      fallbackBody: "A real route, a time window and a sticker at the end.",
    },
    errors: {
      nameRequired: "What should we call you?",
      emailRequired: "Enter your email.",
      emailInvalid: "That doesn't look like an email address.",
      passwordRequired: "Enter your password.",
      passwordShort: (min: number) => `Use at least ${min} characters.`,
      passwordLong: "That's longer than we can handle.",
      tooMany: "Too many attempts. Try again in a few minutes.",
      emailTaken: "There's already an account with this email.",
      signupFailed: "We couldn't create your account. Please try again in a moment.",
      mismatch: "That email and password don't match.",
    },
  },

  legal: {
    overline: "Legal",
    /** Shown above a legal text that has not been translated yet. */
    englishOnly: null as string | null,
    nav: "Legal pages",
    terms: "Terms",
    privacy: "Privacy",
    safety: "Safety notice",
    back: "Back to the start",
  },

  notFound: {
    code: "404",
    title: "This one isn't on the map.",
    body: "The page you were looking for doesn't exist — or it belongs to someone else's adventure.",
    toQuests: "Go to your quests",
    toStart: "Back to the start",
  },
};

export type MarketingMessages = typeof marketingEn;
