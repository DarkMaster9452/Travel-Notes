/**
 * English, and the shape every other language has to match.
 *
 * This file is the source of truth twice over: it is what the app reads by
 * default, and `type Messages = typeof en` makes it the contract `sk.ts` and
 * `de.ts` are checked against. Add a key here and the other two stop
 * compiling until somebody translates it, which is the whole point — a missing
 * translation should be a build error, not a sentence a customer finds in the
 * wrong language.
 *
 * Two conventions worth knowing before adding to it:
 *
 *   · Anything with a value in it is a *function*, not a string with a
 *     placeholder. `(n: number) => …` lets TypeScript check the call site and
 *     forces every translation to accept the same arguments. It also means
 *     word order is the translator's to choose, which matters a great deal in
 *     German and not at all in English.
 *   · Anything that varies with a count goes through `plural()` in
 *     `i18n/format`, because Slovak has three forms and appending an "s" is
 *     right in exactly one of the three languages here.
 *
 * Keys are grouped by where they are read, not by what they say, so finding
 * the string for a screen means opening the screen's namespace.
 */
import type { PluralForms } from "@/lib/i18n/format";

export const en = {
  /* ---- words the whole app shares --------------------------------------- */
  common: {
    save: "Save",
    saving: "Saving…",
    saved: "Saved",
    cancel: "Cancel",
    close: "Close",
    back: "Back",
    open: "Open",
    edit: "Edit",
    remove: "Remove",
    none: "—",
    yours: "Yours",
    free: "Free",
    perMonth: "/mo",
    perYear: "/yr",
    points: "points",
    somethingWrong: "That didn't work. Try again.",
    /** "12 of 36" */
    ofTotal: (held: number, total: number) => `${held} of ${total}`,
    /* Plural forms, spelled out per language. `#` is replaced by the number.
       Annotated rather than inferred so Slovak can supply the `few` form
       (2–4) that English simply does not have. */
    quests: { one: "# quest", other: "# quests" } as PluralForms,
    days: { one: "# day", other: "# days" } as PluralForms,
    people: { one: "# person", other: "# people" } as PluralForms,
    things: { one: "# thing", other: "# things" } as PluralForms,
  },

  /* ---- the rail --------------------------------------------------------- */
  nav: {
    dashboard: "Dashboard",
    monthly: "The monthly",
    quests: "Quest database",
    leaderboard: "Leaderboard",
    stickers: "Stickers",
    submissions: "Submissions",
    people: "People & groups",
    settings: "Settings",
    signOut: "Sign out",
    menu: "Menu",
    alongside: "Alongside",
  },

  /* ---- settings --------------------------------------------------------- */
  settings: {
    heading: "Settings",
    kicker: "Your account",
    groups: {
      settings: "Settings",
      you: "You",
      membership: "Membership",
      account: "Account",
    },
    items: {
      general: "General",
      units: "Units & language",
      profile: "Profile",
      address: "Shipping address",
      notifications: "Notifications",
      billing: "Plan & billing",
      invoices: "Invoices",
      cancel: "Pause or cancel",
      password: "Password",
      connected: "Connected apps",
      privacy: "Privacy",
    },
    units: {
      heading: "Units & language",
      footer:
        "Quests are written in metres and kilometres. Imperial converts on the way out; nothing is stored twice.",
      units: "Units",
      metric: "Metric — km and metres",
      imperial: "Imperial — miles and feet",
      language: "Language",
      languageHint: "Everything you read here. Quest briefs stay in English for now.",
    },
  },

  /* ---- plans and what they include -------------------------------------- */
  plans: {
    free: {
      name: "Free",
      kicker: (quests: number) => `${quests} quests`,
      description: "Three real quests, to find out whether being told what to do suits you.",
      features: (quests: number, stickers: number) => [
        `${quests} real quests`,
        "Your own country",
        `The first ${stickers} stickers`,
      ],
      missing: ["No inbox delivery", "No partner matching"],
    },
    explorer: {
      name: "Explorer",
      kicker: "Unlimited quests",
      description: "Unlimited quests anywhere in Europe, in your inbox on the morning you pick.",
      features: (stickers: number) => [
        "Unlimited quests",
        "Anywhere in Europe",
        `${stickers} stickers to collect`,
        "Quests by mail",
        "Re-roll, skip and pause",
        "Partner matching & the board",
        "Printed sticker sheets, posted",
      ],
      missing: ["Europe only — not worldwide"],
      badge: "Most taken",
    },
    ultra: {
      name: "Ultra Explorer",
      kicker: "Worldwide, priority",
      description: "Every range on the map, and quests built around something specific.",
      features: (stickers: number) => [
        "Everything in Explorer",
        "Worldwide range, every continent",
        `All ${stickers} stickers`,
        "Custom quests you commission",
        "Multi-day and trip-week quests",
        "Priority support, real replies",
        "Private crews & invite links",
      ],
      missing: [] as string[],
    },
  },

  capabilities: {
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
  },

  /* ---- the envelope ----------------------------------------------------- */
  envelope: {
    posting: {
      title: "Posting on the 2nd",
      detail:
        "Your quest card and two stickers go out by post on the 2nd of each month. An address changed after the 28th applies to the envelope after next.",
    },
    not_included: {
      title: "Screen only",
      detail:
        "Free accounts read their quest card here rather than receiving one. Explorer and above get the printed envelope.",
    },
    no_address: {
      title: "Email instead of post",
      detail:
        "Your plan includes the printed envelope, but we have no address to send it to — so the quest card and your stickers arrive by email instead. Add an address and the next envelope goes in the post.",
    },
  },

  /* ---- the sticker sheet ------------------------------------------------ */
  stickers: {
    kicker: "Printed, gummed, posted",
    heading: "Stickers",
    lede: "Nothing here is a screen trophy. Each one is a real sticker, and an envelope carries at most two of them alongside the monthly quest card — the rest wait their turn.",
    earned: "Earned",
    onYourPlan: "On your plan",
    printedInAll: "Printed in all",
    posted: "Posted to you",
    onScreen: "On screen",
    withdrawn: "Withdrawn by the desk",
    /** The progress line under a sticker that is not earned yet. */
    progress: (value: string, target: string) => `${value} / ${target}`,
    beyondHeading: (count: number) => `${count} sheets you cannot see yet`,
    beyondBody: (plan: string, reachable: number, total: number) =>
      `The ${plan} plan prints ${reachable} of the ${total}. The rest are cut for members further up — what they are stays sealed until the plan is.`,
    seePlans: "See the plans",
    addAddress: "Add an address",
  },

  /* ---- every sticker, by id ---------------------------------------------
     Keyed by the achievement id, which is frozen in `lib/achievements`
     precisely so a translation can point at one and keep pointing at it. The
     labels are the half that says the number ("Sixty logged"), so a target
     that moves moves these too — in three languages. */
  sheet: {
    "first-light": { label: "First Light", description: "You actually went. Log your first quest." },
    "second-wind": { label: "Second wind", description: "Five logged. The first one was not a fluke." },
    "into-the-trees": { label: "Into the trees", description: "Three days spent under a canopy." },
    "first-ridge": { label: "First ridge", description: "Three quests with a mountain in them." },
    "twenty-five": { label: "Sixty", description: "Sixty kilometres, all told." },
    "thousand-up": { label: "Two and a half", description: "Two and a half thousand metres of ascent behind you." },
    "ten-logged": { label: "Twenty-five logged", description: "Twenty-five quests logged, no repeats." },
    cartographer: { label: "Cartographer", description: "Eight different regions." },
    "gorge-rat": { label: "Gorge Rat", description: "Six quests with water in them." },
    "long-hauler": { label: "Long hauler", description: "Two hundred and fifty kilometres under your boots." },
    "twenty-five-logged": { label: "Sixty logged", description: "Sixty quests. More than a season of them." },
    "fifty-logged": { label: "Hundred and twenty", description: "A hundred and twenty quests logged." },
    "hundred-logged": { label: "Two hundred and fifty", description: "Two hundred and fifty quests. Go outside less, perhaps." },
    "two-hundred-logged": { label: "Five hundred", description: "Five hundred logged. We have run out of things to say." },
    "five-thousand-up": { label: "Twelve thousand up", description: "Twelve thousand metres of ascent, all told." },
    everest: { label: "Sea level to summit", description: "8,848 metres climbed. The height of the big one." },
    "ten-thousand-up": { label: "Twenty-five thousand up", description: "Twenty-five thousand metres of ascent." },
    "twenty-five-thousand-up": { label: "Sixty thousand", description: "Sixty thousand metres up. Nearly seven Everests." },
    "two-fifty-km": { label: "Six hundred", description: "Six hundred kilometres walked." },
    "five-hundred-km": { label: "Twelve hundred", description: "Twelve hundred kilometres. A long country's worth." },
    "thousand-km": { label: "Four figures, twice", description: "Two and a half thousand kilometres logged." },
    "ten-regions": { label: "Fifteen regions", description: "Fifteen different regions visited." },
    "twenty-regions": { label: "Thirty regions", description: "Thirty regions. You are running out of map." },
    "border-crosser": { label: "Border crosser", description: "A quest in a second country." },
    "five-countries": { label: "Eight countries", description: "Eight countries on the log." },
    "peak-bagger": { label: "Peak bagger", description: "Twenty-five quests with a mountain in them." },
    "deep-woods": { label: "Deep woods", description: "Twenty-five quests under trees." },
    "lake-district": { label: "Lake district", description: "Twelve quests with a lake on the route." },
    "waterfall-chaser": { label: "Waterfall chaser", description: "Twenty-five quests with falling water." },
    "ruin-hunter": { label: "Ruin hunter", description: "Twelve castles or ruins reached." },
    "every-grade": { label: "All four grades", description: "Easy, Moderate, Hard and Expert \u2014 one of each, at least once." },
    "four-seasons": { label: "Four seasons", description: "A quest in winter, in spring, in summer and in autumn." },
    "twelve-months": { label: "Every month", description: "You have walked in all twelve months of the year." },
    unbroken: { label: "Unbroken", description: "Eight weeks running with something logged in every one." },
    "all-terrain": { label: "All terrain", description: "Mountain, forest, lake, waterfall and ruin. Every kind of ground." },
    "the-long-year": { label: "The long year", description: "A thousand kilometres inside a single calendar year." },
  },

  /* ---- the profile ------------------------------------------------------ */
  /* ---- plan & billing ---------------------------------------------------- */
  /* ---- the dashboard ------------------------------------------------------ */
  dashboard: {
    title: "Dashboard",
    headline: {
      nothing: "Nothing open. The next one drops Monday.",
      twoRunning: "Two quests open, both clocks running.",
      twoOneRunning: "Two quests open, one clock running.",
      twoFiled: "Two quests open, both already filed.",
      oneRunning: "One quest open, and its window is closing.",
      oneFiled: "One quest open, already filed.",
    },
    pointsLabel: (period: string) => `Points, ${period}`,
    rankLabel: (total: number) => `Of ${total} on the board`,
    coming: "What's coming",
    comingNote: "Weeklies drop Monday 06:00 · the monthly on the 1st",
    theMonthly: "The monthly",
    theWeekly: "The weekly",
    generatedForYou: "Generated for you",
    nothingOpenHeading: "Nothing is open right now",
    nothingOpenBody:
      "The next weekly drops Monday at 06:00. Until then the quest database is open, and anything you file against it still scores.",
    openDatabase: "Open the quest database",
    board: "Around you on the board",
    fullBoard: "Full board →",
    boardEmpty: "Nothing on the board yet this month. Approved proof is what puts you on it.",
    sheet: "Sticker sheet",
    sheetCount: (earned: number, total: number) => `${earned} of ${total} earned`,
    sheetNote:
      "Two go out with each envelope, alongside the monthly quest card. Stick them where you earned them.",
    wholeSheet: "The whole sheet",
    waitingTag: "Proof filed · waiting on a reader",
  },

  /* ---- the open-quest card ------------------------------------------------ */
  questCard: {
    fileProof: "File proof",
    openMonthly: "Open the monthly",
    seeQuest: "See the quest",
    closesIn: "Closes in",
    waiting: "Waiting on a reader",
    readByHuman: "Read by a human",
    windowShut: "Window shut",
    approved: (points: number) => `Approved · +${points}`,
    sentBack: "Sent back",
    stamp: (points: number) => `+${points} points`,
    filedOn: (weekday: string) => `Filed ${weekday}`,
    trailhead: "Trailhead",
    summit: "Summit",
    distance: "Distance",
    ascent: "Ascent",
    grade: "Grade",
    fileAgain: "File it again",
    expertFigures: "Expert figures",
  },

  /* ---- the third column --------------------------------------------------- */
  rail: {
    openNow: "Open now",
    nextDrop: "The next drop",
    thenMonthly: "Then the monthly",
    untilWeekly: (when: string) => `until the next weekly opens, ${when} at 06:00. Whatever is open now stays open until its own window closes.`,
    standing: "Where you stand",
    fullBoard: "Full board",
    open: "Open →",
    behind: (points: number, name: string) => `${points} points behind ${name}.`,
    youAreOn: (points: number, quests: string) => `You are on ${points} from ${quests}.`,
    topOfBoard: (points: number) =>
      `Top of the board on ${points} points. There is a month left to hold it.`,
    notOnBoard:
      "Not on the board this month. Approved proof is what puts you on it — one logged quest is enough.",
    desk: "On a reader's desk",
    deskEmpty: "Nothing waiting on a reader. Proof is usually read within a day of being filed.",
    closest: "Closest sticker",
    wholeSheet: "The whole sheet",
    logbook: "The logbook",
    allTime: "All time",
    questsLogged: "Quests logged",
    kilometres: "Kilometres",
    metresClimbed: "Metres climbed",
    regions: "Regions",
    countries: (count: number) => `${count} countries`,
  },

  /* ---- unlocking a plan --------------------------------------------------- */
  unlock: {
    unlocked: "Unlocked",
    lede: "It is on now, and it is free while we are in demo. Everything below opened the moment you pressed the button.",
    envelopeNote:
      "The printed envelope is part of this. We will ask where to send it in a day or so — not now.",
    good: "Good",
    unlocking: "Unlocking…",
  },

  /* ---- the monthly -------------------------------------------------------- */
  monthly: {
    title: "The monthly",
    theBigOne: (slot: string) => `The big one · ${slot}`,
    nothingBooked: "Nothing booked for this month",
    nothingBookedBody:
      "A monthly is either booked by the desk or generated against your preferences. Widen your range in settings and it will find you one.",
    openSettings: "Open settings",
    noMonthly: "No monthly is placed yet.",
    brief: "The brief",
    asked: "Asked",
    ground: "Ground",
    lookFor: "Look for",
    mood: "Mood",
    window: "Window",
    shut: "Shut",
    forThisMonth: "for this month",
    leftToFile: "left to file",
    daysGone: (gone: number, total: number) => `${gone} of ${total} days gone`,
    haveFiled: (people: string) => `${people} filed`,
    approvedSoFar: (count: number) => `${count} approved so far`,
    fileProof: "File your proof",
    editProof: "Edit your proof",
    whatCounts: "What counts as proof",
    whatCountsBody:
      "A written account, at least one photo, and your figures if a watch recorded them. A retreat filed honestly scores half — turning back and saying so is worth more than nothing.",
    approach: "The approach",
    parkHere: "Park here",
    parkHereNote: "Leave the car here.",
    start: "Start",
    startNote: "Where the route proper begins.",
    withoutCar: "Without a car",
    askedLine: (km: string, up: string, moving: string) =>
      `${km} km, ${up} m of ascent, about ${moving} moving.`,
    fromStart: (km: string) => `${km} km from the start.`,
    howItScores: "How it scores",
    ifApproved: "If it is approved",
    conditions: "Conditions, as filed by others",
    conditionsEmpty:
      "Nobody has filed approved proof of this one yet. Yours would be the first word on the ground.",
    expertFigures: "Expert figures",
    expertNote: "On because you turned them on in Settings",
    expert: {
      metresPerKm: "Metres per kilometre",
      metresPerKmNote: "How steep the day is on average, before any single climb.",
      askedPace: "Asked pace",
      askedPaceNote: "What the moving-time estimate assumes you keep up.",
      travel: "Travel from home",
      travelNote: "From the country you measure from, not from an address.",
      filedSoFar: "Filed so far",
      filedSoFarNote: (approved: number) => `${approved} of them have been approved.`,
      approvalRate: "Approval rate",
      approvalRateNote: "Of the proof a reader has already reached.",
      worth: "Worth, approved",
      worthNote: "Grade, distance, ascent and the monthly bonus.",
    },
  },

  /* ---- the quest database ------------------------------------------------- */
  questsPage: {
    kicker: "Everything ever issued",
    title: "Quest database",
    lede: "Every quest the engine has written, including the ones that were never yours. Yours are marked, and anything here can be filed against.",
    count: (n: string) => `${n} quests`,
    homeOnly: (country: string) =>
      `Showing ${country} only. Explorer opens every European range; Ultra opens the rest of the map.`,
    yourCountry: "your country",
    find: "Find",
    findPlaceholder: "Region or trailhead",
    region: "Region",
    everyRegion: "Every region",
    grade: "Grade",
    anyGrade: "Any grade",
    cadence: "Cadence",
    any: "Any",
    wasMonthly: "Was a monthly",
    wasWeekly: "Was a weekly",
    neverBooked: "Never booked",
    written: "Written",
    anyMonth: "Any month",
    noMatch: "Nothing matches that",
    noMatchBody:
      "Widen the filters — region and grade together will cut a catalogue of thousands down to nothing quite quickly.",
    clearFilters: "Clear the filters",
    done: "DONE",
    yours: "YOURS",
    newer: "← Newer",
    older: "Older →",
    page: (page: number, pages: number) => `${page} of ${pages}`,
  },

  /* ---- the board ---------------------------------------------------------- */
  leaderboard: {
    yourPoints: (points: number) => `${points} points`,
    tookFeatured: "took the featured one",
    toOvertake: (points: number) => `+${points} points`,
    takesPlaceAbove: "takes the place above.",
    offTheLead: (points: number) => `${points} off the lead.`,
    everybodyRanked: "Everybody, ranked",
    lede: "Points for approved proof, on the same weekly and monthly clock as everything else. The top three of a closed board take a sticker — a different one for each cadence.",
    monthlyTab: "Monthly",
    weeklyTab: "Weekly",
    window: "Window",
    openNow: (count: number) => `Open now · ${count} contenders`,
    sealed: "Sealed",
    closed: "Closed",
    openMonthly: "Open the monthly",
    first: "First",
    second: "Second",
    third: "Third",
    title: "Leaderboard",
    cadence: "Board cadence",
    approvedOnly:
      "A board counts approved proof only. Until a reader has passed something, there is nothing to rank.",
    empty: "Nothing on this board yet",
    emptyWindow: "Nothing approved in this window yet",
    emptyBody: "Approved proof is what puts you on it.",
    leading: "You are leading this one.",
  },

  /* ---- submissions -------------------------------------------------------- */
  submissions: {
    title: "Your submissions",
    filed: "Filed",
    summary: (filed: number, approved: number, waiting: number) =>
      `${filed} filed · ${approved} approved · ${waiting} waiting`,
    inReview: "In review",
    approvedTag: "Approved",
    photos: { one: "# photo", other: "# photos" } as PluralForms,
    stravaAttached: "Strava attached",
    readOn: (when: string) => `Read ${when}.`,
    retreat: "retreat",
    approved: "Approved.",
    sentBack: "Sent back.",
    waiting: "Waiting on a reader.",
    unread: "Nobody has read it yet — everything is read in the order it was filed.",
    editWhileWaiting: "Edit while it waits",
    addAndRefile: "Add to it and file again",
    seeQuest: "See the quest",
    empty: "Nothing filed yet",
    emptyBody:
      "Proof is what makes a quest count. File against the monthly, the weekly, or anything in the database.",
  },

  /* ---- people and groups -------------------------------------------------- */
  people: {
    groupsTitle: "Groups",
    peopleTitle: "People",
    title: "People & groups",
    tabs: "People or groups",
    directory: "Who else is out there",
    directoryLede:
      "Everybody who has published a page. Nobody is here who has not chosen to be, and nothing here says whether anyone else has an account.",
    nobodyYet: "Nobody has published a page yet",
    nobodyYetBody:
      "Publishing yours is what puts you here. It shows what you have logged, and nothing about your account.",
    publishYours: "Publish your page",
    editYours: "Edit your page",
    noGroup: "You are not in a group",
    noGroupBody:
      "Start one and send the link to whoever you walk with. A group is a board of its own, on the same points as everything else.",
    groupsNote:
      "A group is a smaller board and a page to find each other on. Who is in one is visible to the people in it, and to nobody else.",
    logged: (n: number) => `${n} logged`,
  },

  billing: {
    currentPlan: "Current plan",
    monthly: ", monthly",
    yearly: ", yearly",
    aMonth: (price: string) => `${price} a month`,
    aYear: (price: string) => `${price} a year`,
    renews: (when: string) => `renews ${when}`,
    ends: (when: string) => `ends ${when}`,
    freeLeft: (left: number, total: number) => `${left} of ${total} free quests left`,
    retrying: "Payment retrying · access holds",
    switchToYearly: "Switch to yearly",
    managePayment: "Manage payment",
    facts: {
      stickers: "Stickers",
      quests: "Quests",
      unlimited: "Unlimited",
      questsLeft: (left: number) => `${left} left`,
      reach: "Reach",
      worldwide: "Worldwide",
      europe: "Europe",
      homeCountry: "Home country",
      post: "Post",
      envelope: "Monthly envelope",
      screenOnly: "Screen only",
    },
    includesHeading: "What your plan includes",
    plansHeading: "The plans",
    cancelAnyTime: "Cancel any time",
    notConfigured: "Billing not configured here",
    demoFree: "Free while we are in demo",
    upgrade: "Upgrade",
    switch: "Switch",
    unlockIt: "Unlock it",
    switchToIt: "Switch to it",
    envelopeHeading: "Where the envelope goes",
    editAddress: "Edit address →",
    addAddress: "Add an address →",
    noAddress: "No address on file.",
    partialAddress: "Not enough of an address to post to — a street, a town and a country.",
  },

  /* ---- locked features --------------------------------------------------- */
  locked: {
    /** The chip on a row that a cheaper plan does not reach. */
    paidFeature: (plan: string) => `${plan} feature`,
    onPlan: (plan: string) => `On ${plan}`,
    seePlans: "See the plans",
    unlock: "Unlock",
    unlockWith: (plan: string) => `Unlock with ${plan}`,
  },

  /* ---- the notice that waited -------------------------------------------- */
  nudge: {
    address: {
      title: "Where should the envelope go?",
      body: "Your plan includes the printed quest card and two stickers each month. Without an address we cannot post it — the month's card would arrive by email instead.",
      action: "Add an address",
    },
    notNow: "Not now",
  },

  profile: {
    yearHeading: "A year of turning up",
    nothingApproved: "Nothing approved yet",
    walked: (count: number) => `${count} walked`,
    less: "Less",
    more: "More",
    /** The grid's own summary, read out to screen readers. */
    yearSummary: (name: string, days: number, best: number) =>
      `${days} days here in the last year, busiest ${best}. ${name}'s year.`,
    yearEmpty: (name: string) => `${name} has not been around in the last year.`,
    dayTooltip: (when: string, count: number) =>
      `${when} — ${count === 0 ? "nothing" : count === 1 ? "1 thing" : `${count} things`}`,
    about: "About",
    elsewhere: "Elsewhere",
    earnedHeading: "Earned",
    walkedHeading: (name: string) => `What ${name} has walked`,
    approvedOnly: "Approved only",
    nothingHere: "Nothing approved yet. Only proof a reader has passed shows up here.",
    editYourPage: "Edit your page",
    walkTogether: "Walk together",
    since: (when: string) => `Walking since ${when}`,
    logged: "Logged",
    kilometres: "Kilometres",
    metresUp: "Metres up",
    regions: "Regions",
    retreat: "retreat",
    switches: {
      stats: {
        label: "What you have logged",
        detail: "The four figures — quests, kilometres, ascent, regions.",
      },
      country: {
        label: "Your country",
        detail: "The country you measure from. Never a town, never an address.",
      },
      activities: {
        label: "What you have walked",
        detail: "Approved proof only, with your own account of each day.",
      },
      stickers: {
        label: "Stickers",
        detail: "The ones you have earned. Locked ones are never shown to a reader.",
      },
      activityGrid: {
        label: "Your year",
        detail: "The grid of days you have been here. How often, never what you did.",
      },
    },
  },
};
