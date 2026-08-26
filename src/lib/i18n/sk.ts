import type { Messages } from "@/lib/i18n";

/**
 * Slovenčina.
 *
 * Typed as `Messages`, so this file cannot compile while anything in `en.ts`
 * is missing from it. That is the check — nothing else enforces completeness,
 * and nothing else needs to.
 *
 * Two things to keep in mind when editing:
 *
 *   · Slovak has three plural forms, not two. One quest, dva/tri/štyri questy,
 *     päť questov. Every `PluralForms` entry here fills in `few`, which
 *     English leaves out because it has no such form.
 *   · The interpolating entries are functions, so word order is yours. Do not
 *     translate the English sentence — write the Slovak one, and put the value
 *     where Slovak wants it.
 */
export const sk: Messages = {
  common: {
    save: "Uložiť",
    saving: "Ukladá sa…",
    saved: "Uložené",
    cancel: "Zrušiť",
    close: "Zavrieť",
    back: "Späť",
    open: "Otvoriť",
    edit: "Upraviť",
    remove: "Odstrániť",
    none: "—",
    yours: "Tvoje",
    free: "Zadarmo",
    perMonth: "/mes",
    perYear: "/rok",
    points: "bodov",
    somethingWrong: "Nepodarilo sa. Skús to znova.",
    ofTotal: (held, total) => `${held} z ${total}`,
    quests: { one: "# quest", few: "# questy", other: "# questov" },
    days: { one: "# deň", few: "# dni", other: "# dní" },
    people: { one: "# človek", few: "# ľudia", other: "# ľudí" },
    things: { one: "# vec", few: "# veci", other: "# vecí" },
  },

  nav: {
    dashboard: "Prehľad",
    monthly: "Mesačný",
    quests: "Databáza questov",
    leaderboard: "Rebríček",
    stickers: "Nálepky",
    submissions: "Odovzdané",
    people: "Ľudia a skupiny",
    settings: "Nastavenia",
    signOut: "Odhlásiť sa",
    menu: "Menu",
    alongside: "Vedľa",
  },

  settings: {
    heading: "Nastavenia",
    kicker: "Tvoj účet",
    groups: {
      settings: "Nastavenia",
      you: "Ty",
      membership: "Členstvo",
      account: "Účet",
    },
    items: {
      general: "Všeobecné",
      units: "Jednotky a jazyk",
      profile: "Profil",
      address: "Doručovacia adresa",
      notifications: "Notifikácie",
      billing: "Plán a platby",
      invoices: "Faktúry",
      cancel: "Pozastaviť alebo zrušiť",
      password: "Heslo",
      connected: "Prepojené aplikácie",
      privacy: "Súkromie",
    },
    units: {
      heading: "Jednotky a jazyk",
      footer:
        "Questy sú písané v metroch a kilometroch. Imperiálne jednotky sa prepočítajú až pri zobrazení; nič sa neukladá dvakrát.",
      units: "Jednotky",
      metric: "Metrické — km a metre",
      imperial: "Imperiálne — míle a stopy",
      language: "Jazyk",
      languageHint: "Všetko, čo tu čítaš. Zadania questov zatiaľ zostávajú po anglicky.",
    },
  },

  plans: {
    free: {
      name: "Zadarmo",
      kicker: (quests) => `${quests} questy`,
      description: "Tri skutočné questy, aby si zistil, či ti sedí, keď ti niekto povie, kam ísť.",
      features: (quests, stickers) => [
        `${quests} skutočné questy`,
        "Tvoja vlastná krajina",
        `Prvých ${stickers} nálepiek`,
      ],
      missing: ["Bez doručenia poštou", "Bez hľadania parťáka"],
    },
    explorer: {
      name: "Explorer",
      kicker: "Neobmedzené questy",
      description:
        "Neobmedzené questy kdekoľvek v Európe, v schránke ráno, ktoré si si vybral.",
      features: (stickers) => [
        "Neobmedzené questy",
        "Kdekoľvek v Európe",
        `${stickers} nálepiek na zbieranie`,
        "Questy poštou",
        "Prehodiť, preskočiť a pozastaviť",
        "Hľadanie parťáka a rebríček",
        "Tlačené hárky nálepiek, poštou",
      ],
      missing: ["Len Európa — nie celý svet"],
      badge: "Najčastejší",
    },
    ultra: {
      name: "Ultra Explorer",
      kicker: "Celý svet, prednostne",
      description: "Každé pohorie na mape a questy postavené na niečom konkrétnom.",
      features: (stickers) => [
        "Všetko z Explorera",
        "Celý svet, každý kontinent",
        `Všetkých ${stickers} nálepiek`,
        "Questy na objednávku",
        "Viacdňové a týždňové questy",
        "Prednostná podpora, skutočné odpovede",
        "Súkromné partie a pozvánky",
      ],
      missing: [],
    },
  },

  capabilities: {
    unlimited: {
      title: "Neobmedzené questy",
      detail: "Počítadlo je preč. Ďalší si vezmi hneď, ako jeden zapíšeš.",
    },
    europe: {
      title: "Kdekoľvek v Európe",
      detail: "Každé európske pohorie v katalógu, nielen tvoja krajina.",
    },
    worldwide: {
      title: "Celý svet",
      detail: "Každý kontinent v katalógu. Explorer končí v Európe.",
    },
    mail: {
      title: "Questy poštou",
      detail: "Jeden quest, ráno, ktoré si si vybral, už rozhodnutý.",
    },
    reroll: {
      title: "Prehodiť, preskočiť a pozastaviť",
      detail: "Obrátilo sa počasie? Prehoď ho. Nič sa ti nepočíta na ťarchu.",
    },
    matching: {
      title: "Hľadanie parťáka",
      detail: "Popýtaj sa o spoločnosť a rebríček sa otvorí.",
    },
    printedStickers: {
      title: "Nálepky poštou",
      detail: "Dve vyrezané nálepky idú spolu s kartou questu 2. každého mesiaca.",
    },
    customQuests: {
      title: "Questy na objednávku",
      detail: "Objednaj si quest postavený na ročnom období, pohorí alebo cieli.",
    },
    multiDay: {
      title: "Viacdňové questy",
      detail: "Z chaty na chatu, celé týždne, tie, na ktoré treba voľný piatok.",
    },
    priority: {
      title: "Prednostná podpora",
      detail: "Skutočné odpovede od ľudí, ktorí to postavili.",
    },
    crews: {
      title: "Súkromné partie",
      detail: "Pozvánky, uzavretý rebríček, skupinové questy s jednou zásielkou pre každého.",
    },
  },

  envelope: {
    posting: {
      title: "Odchádza 2. v mesiaci",
      detail:
        "Karta questu a dve nálepky idú poštou 2. každého mesiaca. Adresa zmenená po 28. platí až pre ďalšiu obálku.",
    },
    not_included: {
      title: "Len na obrazovke",
      detail:
        "Účty zadarmo si kartu questu čítajú tu, namiesto toho, aby ju dostali. Explorer a vyššie dostávajú tlačenú obálku.",
    },
    no_address: {
      title: "E-mail namiesto pošty",
      detail:
        "Tvoj plán zahŕňa tlačenú obálku, ale nemáme adresu, kam ju poslať — takže karta questu a nálepky prídu e-mailom. Pridaj adresu a ďalšia obálka pôjde poštou.",
    },
  },

  stickers: {
    kicker: "Tlačené, lepiace, poslané",
    heading: "Nálepky",
    lede: "Nič tu nie je trofej na obrazovke. Každá je skutočná nálepka a v obálke idú nanajvýš dve spolu s mesačnou kartou questu — ostatné počkajú.",
    earned: "Získané",
    onYourPlan: "V tvojom pláne",
    printedInAll: "Celkovo vytlačených",
    posted: "Príde poštou",
    onScreen: "Na obrazovke",
    withdrawn: "Odobraté redakciou",
    progress: (value, target) => `${value} / ${target}`,
    beyondHeading: (count) => `${count} hárkov, na ktoré zatiaľ nevidíš`,
    beyondBody: (plan, reachable, total) =>
      `Plán ${plan} tlačí ${reachable} z ${total}. Ostatné sú vyrezané pre členov vyššie — čo sú, zostáva zapečatené, kým nie je aj plán.`,
    seePlans: "Pozrieť plány",
    addAddress: "Pridať adresu",
  },

  sheet: {
    "first-light": { label: "Prvé svetlo", description: "Naozaj si šiel. Zapíš si prvý quest." },
    "second-wind": { label: "Druhý dych", description: "Päť zapísaných. Ten prvý nebola náhoda." },
    "into-the-trees": { label: "Medzi stromy", description: "Tri dni strávené pod korunami." },
    "first-ridge": { label: "Prvý hrebeň", description: "Tri questy, v ktorých bol kopec." },
    "twenty-five": { label: "Šesťdesiat", description: "Šesťdesiat kilometrov, dokopy." },
    "thousand-up": {
      label: "Dva a pol",
      description: "Dva a pol tisíca metrov prevýšenia máš za sebou.",
    },
    "ten-logged": {
      label: "Dvadsaťpäť zapísaných",
      description: "Dvadsaťpäť questov, žiadne opakovanie.",
    },
    cartographer: { label: "Kartograf", description: "Osem rôznych regiónov." },
    "gorge-rat": { label: "Potkan z tiesňavy", description: "Šesť questov s vodou." },
    "long-hauler": {
      label: "Dlhá trať",
      description: "Dvestopäťdesiat kilometrov pod topánkami.",
    },
    "twenty-five-logged": {
      label: "Šesťdesiat zapísaných",
      description: "Šesťdesiat questov. Viac než celá sezóna.",
    },
    "fifty-logged": {
      label: "Stodvadsať",
      description: "Stodvadsať zapísaných questov.",
    },
    "hundred-logged": {
      label: "Dvestopäťdesiat",
      description: "Dvestopäťdesiat questov. Možno choď von menej.",
    },
    "two-hundred-logged": {
      label: "Päťsto",
      description: "Päťsto zapísaných. Došli nám slová.",
    },
    "five-thousand-up": {
      label: "Dvanásťtisíc hore",
      description: "Dvanásťtisíc metrov prevýšenia, dokopy.",
    },
    everest: {
      label: "Od mora po vrchol",
      description: "8 848 nastúpaných metrov. Výška tej najväčšej.",
    },
    "ten-thousand-up": {
      label: "Dvadsaťpäťtisíc hore",
      description: "Dvadsaťpäťtisíc metrov prevýšenia.",
    },
    "twenty-five-thousand-up": {
      label: "Šesťdesiattisíc",
      description: "Šesťdesiattisíc metrov hore. Takmer sedem Everestov.",
    },
    "two-fifty-km": { label: "Šesťsto", description: "Šesťsto prejdených kilometrov." },
    "five-hundred-km": {
      label: "Tisícdvesto",
      description: "Tisícdvesto kilometrov. Dlhá krajina od okraja po okraj.",
    },
    "thousand-km": {
      label: "Štyri číslice, dvakrát",
      description: "Dva a pol tisíca zapísaných kilometrov.",
    },
    "ten-regions": { label: "Pätnásť regiónov", description: "Pätnásť rôznych regiónov." },
    "twenty-regions": {
      label: "Tridsať regiónov",
      description: "Tridsať regiónov. Dochádza ti mapa.",
    },
    "border-crosser": { label: "Cez hranicu", description: "Quest v druhej krajine." },
    "five-countries": { label: "Osem krajín", description: "Osem krajín v zázname." },
    "peak-bagger": { label: "Zberač vrcholov", description: "Dvadsaťpäť questov s kopcom." },
    "deep-woods": { label: "Hlboký les", description: "Dvadsaťpäť questov pod stromami." },
    "lake-district": { label: "Kraj jazier", description: "Dvanásť questov s jazerom na trase." },
    "waterfall-chaser": {
      label: "Lovec vodopádov",
      description: "Dvadsaťpäť questov s padajúcou vodou.",
    },
    "ruin-hunter": { label: "Lovec ruín", description: "Dvanásť hradov alebo zrúcanín." },
    "every-grade": {
      label: "Všetky štyri stupne",
      description: "Ľahký, stredný, ťažký a expert — od každého aspoň raz.",
    },
    "four-seasons": {
      label: "Štyri ročné obdobia",
      description: "Quest v zime, na jar, v lete aj na jeseň.",
    },
    "twelve-months": {
      label: "Každý mesiac",
      description: "Šiel si vo všetkých dvanástich mesiacoch roka.",
    },
    unbroken: {
      label: "Bez prerušenia",
      description: "Osem týždňov po sebe a v každom niečo zapísané.",
    },
    "all-terrain": {
      label: "Každý terén",
      description: "Hora, les, jazero, vodopád a ruina. Každý druh zeme.",
    },
    "the-long-year": {
      label: "Dlhý rok",
      description: "Tisíc kilometrov v rámci jedného kalendárneho roka.",
    },
  },

  dashboard: {
    title: "Prehľad",
    headline: {
      nothing: "Nič otvorené. Ďalší príde v pondelok.",
      twoRunning: "Dva questy otvorené, obom beží čas.",
      twoOneRunning: "Dva questy otvorené, jednému beží čas.",
      twoFiled: "Dva questy otvorené, oba už odovzdané.",
      oneRunning: "Jeden quest otvorený a okno sa zatvára.",
      oneFiled: "Jeden quest otvorený, už odovzdaný.",
    },
    pointsLabel: (period) => `Body, ${period}`,
    rankLabel: (total) => `Z ${total} v rebríčku`,
    coming: "Čo prichádza",
    comingNote: "Týždenné v pondelok o 06:00 · mesačný 1.",
    theMonthly: "Mesačný",
    theWeekly: "Týždenný",
    generatedForYou: "Vygeneruje sa ti",
    nothingOpenHeading: "Práve nie je nič otvorené",
    nothingOpenBody:
      "Ďalší týždenný príde v pondelok o 06:00. Dovtedy je otvorená databáza questov a čokoľvek z nej odovzdáš, stále sa počíta.",
    openDatabase: "Otvoriť databázu questov",
    board: "Okolo teba v rebríčku",
    fullBoard: "Celý rebríček →",
    boardEmpty: "Tento mesiac zatiaľ v rebríčku nikto nie je. Dostane ťa doň schválený dôkaz.",
    sheet: "Hárok nálepiek",
    sheetCount: (earned, total) => `${earned} z ${total} získaných`,
    sheetNote:
      "Dve idú v každej obálke spolu s mesačnou kartou questu. Nalep si ich tam, kde si ich získal.",
    wholeSheet: "Celý hárok",
    waitingTag: "Dôkaz odovzdaný · čaká na kontrolu",
  },

  questCard: {
    fileProof: "Odovzdať dôkaz",
    openMonthly: "Otvoriť mesačný",
    seeQuest: "Pozrieť quest",
    closesIn: "Zatvára sa o",
    waiting: "Čaká na kontrolu",
    readByHuman: "Skontrolované",
    windowShut: "Okno zatvorené",
    approved: (points) => `Schválené · +${points}`,
    sentBack: "Vrátené",
    stamp: (points) => `+${points} bodov`,
    filedOn: (weekday) => `Odovzdané v ${weekday}`,
    trailhead: "Začiatok",
    summit: "Vrchol",
    distance: "Vzdialenosť",
    ascent: "Prevýšenie",
    grade: "Stupeň",
    fileAgain: "Odovzdať znova",
    expertFigures: "Expertné čísla",
  },

  rail: {
    openNow: "Otvorené",
    nextDrop: "Ďalší príde",
    thenMonthly: "Potom mesačný",
    untilWeekly: (when) => `do otvorenia ďalšieho týždenného, ${when} o 06:00. Čo je otvorené teraz, zostáva otvorené do konca svojho okna.`,
    standing: "Kde stojíš",
    fullBoard: "Celý rebríček",
    open: "Otvoriť →",
    behind: (points, name) => `${points} bodov za tebou je ${name}.`,
    youAreOn: (points, quests) => `Máš ${points} z ${quests}.`,
    topOfBoard: (points) => `Na čele rebríčka s ${points} bodmi. Zostáva mesiac, aby si to udržal.`,
    notOnBoard:
      "Tento mesiac nie si v rebríčku. Dostane ťa doň schválený dôkaz — stačí jeden zapísaný quest.",
    desk: "Na stole kontrolóra",
    deskEmpty: "Nič nečaká na kontrolu. Dôkaz sa zvyčajne prečíta do dňa od odovzdania.",
    closest: "Najbližšia nálepka",
    wholeSheet: "Celý hárok",
    logbook: "Denník",
    allTime: "Za celý čas",
    questsLogged: "Zapísaných questov",
    kilometres: "Kilometrov",
    metresClimbed: "Nastúpaných metrov",
    regions: "Regiónov",
    countries: (count) => `${count} krajín`,
  },

  unlock: {
    unlocked: "Odomknuté",
    lede: "Je to zapnuté a počas dema zadarmo. Všetko nižšie sa otvorilo v momente, keď si stlačil tlačidlo.",
    envelopeNote:
      "Tlačená obálka je súčasťou. Kam ju poslať sa spýtame o deň či dva — nie teraz.",
    good: "Dobre",
    unlocking: "Odomyká sa…",
  },

  monthly: {
    title: "Mesačný",
    theBigOne: (slot) => `Ten veľký · ${slot}`,
    nothingBooked: "Na tento mesiac nie je nič naplánované",
    nothingBookedBody:
      "Mesačný quest buď naplánuje redakcia, alebo sa vygeneruje podľa tvojich preferencií. Rozšír si dosah v nastaveniach a nejaký sa nájde.",
    openSettings: "Otvoriť nastavenia",
    noMonthly: "Mesačný quest zatiaľ nie je zadaný.",
    brief: "Zadanie",
    asked: "Žiada sa",
    ground: "Terén",
    lookFor: "Hľadaj",
    mood: "Nálada",
    window: "Okno",
    shut: "Zatvorené",
    forThisMonth: "pre tento mesiac",
    leftToFile: "na odovzdanie",
    daysGone: (gone, total) => `${gone} z ${total} dní preč`,
    haveFiled: (people) => `${people} odovzdalo`,
    approvedSoFar: (count) => `${count} zatiaľ schválených`,
    fileProof: "Odovzdať dôkaz",
    editProof: "Upraviť dôkaz",
    whatCounts: "Čo sa počíta ako dôkaz",
    whatCountsBody:
      "Písaný záznam, aspoň jedna fotka a tvoje čísla, ak ich zaznamenali hodinky. Poctivo priznaný návrat má polovicu — otočiť sa a povedať to je viac než nič.",
    approach: "Príchod",
    parkHere: "Zaparkuj tu",
    parkHereNote: "Auto nechaj tu.",
    start: "Štart",
    startNote: "Kde začína samotná trasa.",
    withoutCar: "Bez auta",
    askedLine: (km, up, moving) => `${km} km, ${up} m prevýšenia, asi ${moving} v pohybe.`,
    fromStart: (km) => `${km} km od štartu.`,
    howItScores: "Ako sa boduje",
    ifApproved: "Ak to schvália",
    conditions: "Podmienky, ako ich zapísali iní",
    conditionsEmpty:
      "Tento quest zatiaľ nikto neodovzdal so schválením. Tvoj by bol prvým slovom z terénu.",
    expertFigures: "Expertné čísla",
    expertNote: "Zapnuté, lebo si si ich zapol v nastaveniach",
    expert: {
      metresPerKm: "Metrov na kilometer",
      metresPerKmNote: "Aký strmý je deň v priemere, ešte pred akýmkoľvek jedným stúpaním.",
      askedPace: "Očakávané tempo",
      askedPaceNote: "S akým tempom počíta odhad času v pohybe.",
      travel: "Cesta z domu",
      travelNote: "Z krajiny, z ktorej meriaš, nie z adresy.",
      filedSoFar: "Zatiaľ odovzdaných",
      filedSoFarNote: (approved) => `${approved} z nich bolo schválených.`,
      approvalRate: "Miera schválenia",
      approvalRateNote: "Z dôkazov, ku ktorým sa kontrolór už dostal.",
      worth: "Hodnota po schválení",
      worthNote: "Stupeň, vzdialenosť, prevýšenie a mesačný bonus.",
    },
  },

  questsPage: {
    kicker: "Všetko, čo kedy vyšlo",
    title: "Databáza questov",
    lede: "Každý quest, ktorý engine napísal, vrátane tých, ktoré nikdy neboli tvoje. Tvoje sú označené a proti čomukoľvek tu sa dá odovzdať dôkaz.",
    count: (n) => `${n} questov`,
    homeOnly: (country) =>
      `Zobrazuje sa len ${country}. Explorer otvorí každé európske pohorie, Ultra zvyšok mapy.`,
    yourCountry: "tvoja krajina",
    find: "Hľadať",
    findPlaceholder: "Región alebo východisko",
    region: "Región",
    everyRegion: "Každý región",
    grade: "Stupeň",
    anyGrade: "Ktorýkoľvek stupeň",
    cadence: "Kadencia",
    any: "Akákoľvek",
    wasMonthly: "Bol mesačný",
    wasWeekly: "Bol týždenný",
    neverBooked: "Nikdy nezadaný",
    written: "Napísaný",
    anyMonth: "Ktorýkoľvek mesiac",
    noMatch: "Tomu nič nezodpovedá",
    noMatchBody:
      "Uvoľni filtre — región a stupeň spolu zredukujú katalóg tisícok na nulu veľmi rýchlo.",
    clearFilters: "Zrušiť filtre",
    done: "HOTOVO",
    yours: "TVOJE",
    newer: "← Novšie",
    older: "Staršie →",
    page: (page, pages) => `${page} z ${pages}`,
  },

  leaderboard: {
    yourPoints: (points) => `${points} bodov`,
    tookFeatured: "vzal si ten hlavný",
    toOvertake: (points) => `+${points} bodov`,
    takesPlaceAbove: "ťa posunie o miesto vyššie.",
    offTheLead: (points) => `${points} za vedúcim.`,
    everybodyRanked: "Všetci, zoradení",
    lede: "Body za schválený dôkaz, na tých istých týždenných a mesačných hodinách ako všetko ostatné. Prví traja uzavretého rebríčka dostanú nálepku — pre každú kadenciu inú.",
    monthlyTab: "Mesačný",
    weeklyTab: "Týždenný",
    window: "Okno",
    openNow: (count) => `Otvorené · ${count} v hre`,
    sealed: "Uzavreté",
    closed: "Zatvorené",
    openMonthly: "Otvoriť mesačný",
    first: "Prvý",
    second: "Druhý",
    third: "Tretí",
    title: "Rebríček",
    cadence: "Kadencia rebríčka",
    approvedOnly:
      "Rebríček počíta len schválený dôkaz. Kým ho kontrolór nepustí ďalej, nie je čo radiť.",
    empty: "V tomto rebríčku zatiaľ nikto nie je",
    emptyWindow: "V tomto okne zatiaľ nič schválené",
    emptyBody: "Dostane ťa doň schválený dôkaz.",
    leading: "Tento vedieš.",
  },

  submissions: {
    title: "Tvoje odovzdané",
    filed: "Odovzdané",
    summary: (filed, approved, waiting) =>
      `${filed} odovzdaných · ${approved} schválených · ${waiting} čaká`,
    inReview: "V kontrole",
    approvedTag: "Schválené",
    photos: { one: "# fotka", few: "# fotky", other: "# fotiek" },
    stravaAttached: "Strava priložená",
    readOn: (when) => `Prečítané ${when}.`,
    retreat: "návrat",
    approved: "Schválené.",
    sentBack: "Vrátené.",
    waiting: "Čaká na kontrolóra.",
    unread: "Zatiaľ to nikto nečítal — všetko sa číta v poradí odovzdania.",
    editWhileWaiting: "Upraviť, kým čaká",
    addAndRefile: "Doplniť a odovzdať znova",
    seeQuest: "Pozrieť quest",
    empty: "Zatiaľ nič odovzdané",
    emptyBody:
      "Dôkaz je to, čo dá questu platnosť. Odovzdaj ho k mesačnému, týždennému alebo k čomukoľvek z databázy.",
  },

  people: {
    groupsTitle: "Skupiny",
    peopleTitle: "Ľudia",
    title: "Ľudia a skupiny",
    tabs: "Ľudia alebo skupiny",
    directory: "Kto ďalší tam vonku je",
    directoryLede:
      "Každý, kto zverejnil svoju stránku. Nikto tu nie je bez toho, aby sa tak rozhodol, a nič tu nehovorí, či niekto iný má účet.",
    nobodyYet: "Zatiaľ nikto nezverejnil stránku",
    nobodyYetBody:
      "Zverejnenie tej tvojej ťa sem dostane. Ukazuje, čo máš zapísané, a nič o tvojom účte.",
    publishYours: "Zverejniť stránku",
    editYours: "Upraviť stránku",
    noGroup: "Nie si v žiadnej skupine",
    noGroupBody:
      "Založ jednu a pošli odkaz tým, s ktorými chodíš. Skupina je vlastný rebríček, na rovnakých bodoch ako všetko ostatné.",
    groupsNote:
      "Skupina je menší rebríček a stránka, kde sa nájdete. Kto v nej je, vidia len ľudia v nej a nikto iný.",
    logged: (n) => `${n} zapísaných`,
  },

  settingsPages: {
    general: {
      heading: "Všeobecné",
      kicker: "Platí pre každý quest",
      expertFigures: "Expertné čísla",
      expertDetail:
        "Doplnkové čísla ku questu — sklon, exponovanosť, rozloženie objemu — na karte v prehľade a na mesačnom.",
      expertFooter:
        "Expertné čísla sú súčasťou plánov Explorer a Ultra. V pláne zadarmo quest ukazuje na karte štyri čísla a nič viac.",
      palette: "Paleta",
    },
    address: {
      heading: "Kam ide obálka",
      footer:
        "Karty questov a nálepky odchádzajú 2. každého mesiaca. Adresa zmenená po 28. platí až pre ďalšiu obálku.",
      recipient: "Meno na obálke",
      line1: "Ulica",
      line2: "Druhý riadok",
      city: "Mesto alebo obec",
      postcode: "PSČ",
      country: "Krajina",
    },
    notifications: {
      heading: "Notifikácie",
      footer: "Všetko okrem noviniek o produkte sa týka tvojich vlastných questov a verdiktov.",
      questDrop: "Nový quest",
      questDropDetail:
        "Pondelok o 06:00 pre týždenný, 1. pre mesačný. Jeden e-mail, aj s questom v ňom.",
      verdict: "Verdikt k tvojmu dôkazu",
      verdictDetail: "Schválené alebo vrátené, spolu s poznámkou kontrolóra, ak nejaká je.",
      boardSealed: "Uzavretie rebríčka s tvojím menom",
      boardSealedDetail: "Len ak si skončil v prvej trojke práve uzavretého okna.",
      productNews: "Novinky o produkte",
      productNewsDetail: "Občas, nikdy nie viac než raz mesačne. Vypnuté, kým si o to nepovieš.",
    },
  },

  shell: {
    brand: "Summit Quest",
    closeMenu: "Zavrieť menu",
  },

  billing: {
    currentPlan: "Aktuálny plán",
    monthly: ", mesačne",
    yearly: ", ročne",
    aMonth: (price) => `${price} mesačne`,
    aYear: (price) => `${price} ročne`,
    renews: (when) => `obnoví sa ${when}`,
    ends: (when) => `končí ${when}`,
    freeLeft: (left, total) => `Zostáva ${left} z ${total} questov zadarmo`,
    retrying: "Platba sa opakuje · prístup zostáva",
    switchToYearly: "Prejsť na ročný",
    managePayment: "Spravovať platbu",
    facts: {
      stickers: "Nálepky",
      quests: "Questy",
      unlimited: "Neobmedzene",
      questsLeft: (left) => `zostáva ${left}`,
      reach: "Dosah",
      worldwide: "Celý svet",
      europe: "Európa",
      homeCountry: "Domáca krajina",
      post: "Pošta",
      envelope: "Mesačná obálka",
      screenOnly: "Len obrazovka",
    },
    includesHeading: "Čo tvoj plán zahŕňa",
    plansHeading: "Plány",
    cancelAnyTime: "Zrušiť kedykoľvek",
    notConfigured: "Platby tu nie sú nastavené",
    demoFree: "Zadarmo počas dema",
    upgrade: "Prejsť vyššie",
    switch: "Prepnúť",
    unlockIt: "Odomknúť",
    switchToIt: "Prepnúť naň",
    envelopeHeading: "Kam ide obálka",
    editAddress: "Upraviť adresu →",
    addAddress: "Pridať adresu →",
    noAddress: "Žiadna adresa.",
    partialAddress: "Adresa nestačí na doručenie — treba ulicu, mesto a krajinu.",
  },

  locked: {
    paidFeature: (plan) => `Funkcia plánu ${plan}`,
    onPlan: (plan) => `V pláne ${plan}`,
    seePlans: "Pozrieť plány",
    unlock: "Odomknúť",
    unlockWith: (plan) => `Odomknúť s ${plan}`,
  },

  nudge: {
    address: {
      title: "Kam má ísť obálka?",
      body: "Tvoj plán zahŕňa tlačenú kartu questu a dve nálepky každý mesiac. Bez adresy ju nemáme kam poslať — karta by prišla e-mailom.",
      action: "Pridať adresu",
    },
    notNow: "Teraz nie",
  },

  profile: {
    yearHeading: "Rok, čo si tu bol",
    nothingApproved: "Zatiaľ nič schválené",
    walked: (count) => `${count} prejdených`,
    less: "Menej",
    more: "Viac",
    yearSummary: (name, days, best) =>
      `${days} dní tu za posledný rok, najrušnejší ${best}. Rok používateľa ${name}.`,
    yearEmpty: (name) => `${name} tu za posledný rok nebol.`,
    dayTooltip: (when, count) =>
      `${when} — ${count === 0 ? "nič" : count === 1 ? "1 vec" : count < 5 ? `${count} veci` : `${count} vecí`}`,
    about: "O mne",
    elsewhere: "Inde",
    earnedHeading: "Získané",
    walkedHeading: (name) => `Čo ${name} prešiel`,
    approvedOnly: "Len schválené",
    nothingHere: "Zatiaľ nič schválené. Sem sa dostane len dôkaz, ktorý prešiel kontrolou.",
    editYourPage: "Upraviť svoju stránku",
    walkTogether: "Ísť spolu",
    since: (when) => `Chodí od ${when}`,
    logged: "Zapísaných",
    kilometres: "Kilometrov",
    metresUp: "Metrov hore",
    regions: "Regiónov",
    retreat: "návrat",
    switches: {
      stats: {
        label: "Čo máš zapísané",
        detail: "Štyri čísla — questy, kilometre, prevýšenie, regióny.",
      },
      country: {
        label: "Tvoja krajina",
        detail: "Krajina, z ktorej meriaš. Nikdy nie mesto, nikdy nie adresa.",
      },
      activities: {
        label: "Čo si prešiel",
        detail: "Len schválený dôkaz, s tvojím vlastným popisom každého dňa.",
      },
      stickers: {
        label: "Nálepky",
        detail: "Tie, ktoré si získal. Zamknuté sa čitateľovi nikdy nezobrazia.",
      },
      activityGrid: {
        label: "Tvoj rok",
        detail: "Mriežka dní, keď si tu bol. Ako často, nikdy nie čo si robil.",
      },
    },
  },
};
