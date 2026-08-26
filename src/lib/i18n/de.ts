import type { Messages } from "@/lib/i18n";

/**
 * Deutsch.
 *
 * Typed as `Messages`, so this file cannot compile while anything in `en.ts`
 * is missing from it.
 *
 * German has two plural forms, like English, so the `few` slot stays empty
 * here. What it does have that English does not is word order that moves —
 * which is exactly why the interpolating entries are functions. Write the
 * German sentence and put the value where German wants it, rather than
 * translating the English one word by word.
 *
 * Address form: `du` throughout. This is a product about going for a walk, and
 * `Sie` would make it sound like a bank.
 */
export const de: Messages = {
  common: {
    save: "Speichern",
    saving: "Wird gespeichert…",
    saved: "Gespeichert",
    cancel: "Abbrechen",
    close: "Schließen",
    back: "Zurück",
    open: "Öffnen",
    edit: "Bearbeiten",
    remove: "Entfernen",
    none: "—",
    yours: "Deins",
    free: "Kostenlos",
    perMonth: "/Mon.",
    perYear: "/Jahr",
    points: "Punkte",
    somethingWrong: "Das hat nicht geklappt. Versuch es noch einmal.",
    ofTotal: (held, total) => `${held} von ${total}`,
    quests: { one: "# Quest", other: "# Quests" },
    days: { one: "# Tag", other: "# Tage" },
    people: { one: "# Person", other: "# Personen" },
    things: { one: "# Sache", other: "# Sachen" },
  },

  nav: {
    dashboard: "Übersicht",
    monthly: "Der Monatliche",
    quests: "Quest-Datenbank",
    leaderboard: "Rangliste",
    stickers: "Sticker",
    submissions: "Eingereicht",
    people: "Leute & Gruppen",
    settings: "Einstellungen",
    signOut: "Abmelden",
    menu: "Menü",
    alongside: "Daneben",
  },

  settings: {
    heading: "Einstellungen",
    kicker: "Dein Konto",
    groups: {
      settings: "Einstellungen",
      you: "Du",
      membership: "Mitgliedschaft",
      account: "Konto",
    },
    items: {
      general: "Allgemein",
      units: "Einheiten & Sprache",
      profile: "Profil",
      address: "Versandadresse",
      notifications: "Benachrichtigungen",
      billing: "Tarif & Zahlung",
      invoices: "Rechnungen",
      cancel: "Pausieren oder kündigen",
      password: "Passwort",
      connected: "Verbundene Apps",
      privacy: "Privatsphäre",
    },
    units: {
      heading: "Einheiten & Sprache",
      footer:
        "Quests sind in Metern und Kilometern geschrieben. Imperiale Einheiten werden erst bei der Anzeige umgerechnet; nichts wird doppelt gespeichert.",
      units: "Einheiten",
      metric: "Metrisch — km und Meter",
      imperial: "Imperial — Meilen und Fuß",
      language: "Sprache",
      languageHint: "Alles, was du hier liest. Quest-Briefings bleiben vorerst auf Englisch.",
    },
  },

  plans: {
    free: {
      name: "Kostenlos",
      kicker: (quests) => `${quests} Quests`,
      description:
        "Drei echte Quests, um herauszufinden, ob es dir liegt, wenn dir jemand sagt, wo es langgeht.",
      features: (quests, stickers) => [
        `${quests} echte Quests`,
        "Dein eigenes Land",
        `Die ersten ${stickers} Sticker`,
      ],
      missing: ["Keine Zustellung per Post", "Keine Partnersuche"],
    },
    explorer: {
      name: "Explorer",
      kicker: "Unbegrenzte Quests",
      description:
        "Unbegrenzte Quests überall in Europa, im Briefkasten an dem Morgen, den du wählst.",
      features: (stickers) => [
        "Unbegrenzte Quests",
        "Überall in Europa",
        `${stickers} Sticker zum Sammeln`,
        "Quests per Post",
        "Neu würfeln, überspringen, pausieren",
        "Partnersuche & Rangliste",
        "Gedruckte Stickerbögen, per Post",
      ],
      missing: ["Nur Europa — nicht weltweit"],
      badge: "Am meisten gewählt",
    },
    ultra: {
      name: "Ultra Explorer",
      kicker: "Weltweit, bevorzugt",
      description: "Jedes Gebirge auf der Karte, und Quests rund um etwas Bestimmtes.",
      features: (stickers) => [
        "Alles aus Explorer",
        "Weltweit, jeder Kontinent",
        `Alle ${stickers} Sticker`,
        "Quests nach deinen Wünschen",
        "Mehrtages- und Wochenquests",
        "Bevorzugter Support, echte Antworten",
        "Private Crews & Einladungslinks",
      ],
      missing: [],
    },
  },

  capabilities: {
    unlimited: {
      title: "Unbegrenzte Quests",
      detail: "Der Zähler ist weg. Nimm den nächsten, sobald du einen einträgst.",
    },
    europe: {
      title: "Überall in Europa",
      detail: "Jedes europäische Gebirge im Katalog, nicht nur dein eigenes Land.",
    },
    worldwide: {
      title: "Weltweit",
      detail: "Jeder Kontinent im Katalog. Explorer hört in Europa auf.",
    },
    mail: {
      title: "Quests per Post",
      detail: "Ein Quest, an dem Morgen, den du gewählt hast, schon entschieden.",
    },
    reroll: {
      title: "Neu würfeln, überspringen, pausieren",
      detail: "Wetter gekippt? Würfle neu. Nichts wird dir angerechnet.",
    },
    matching: {
      title: "Partnersuche",
      detail: "Frag nach Gesellschaft, und die Rangliste öffnet sich.",
    },
    printedStickers: {
      title: "Sticker per Post",
      detail: "Zwei gestanzte Sticker liegen am 2. jedes Monats der Questkarte bei.",
    },
    customQuests: {
      title: "Quests auf Bestellung",
      detail: "Lass dir einen bauen — um eine Jahreszeit, ein Gebirge oder ein Ziel herum.",
    },
    multiDay: {
      title: "Mehrtagesquests",
      detail: "Von Hütte zu Hütte, ganze Wochen, die mit einem freien Freitag.",
    },
    priority: {
      title: "Bevorzugter Support",
      detail: "Echte Antworten von den Leuten, die das gebaut haben.",
    },
    crews: {
      title: "Private Crews",
      detail: "Einladungslinks, eine geschlossene Rangliste, Gruppenquests mit je einer Sendung.",
    },
  },

  envelope: {
    posting: {
      title: "Geht am 2. raus",
      detail:
        "Deine Questkarte und zwei Sticker gehen am 2. jedes Monats per Post raus. Eine nach dem 28. geänderte Adresse gilt erst für den übernächsten Umschlag.",
    },
    not_included: {
      title: "Nur am Bildschirm",
      detail:
        "Kostenlose Konten lesen ihre Questkarte hier, statt eine zu bekommen. Ab Explorer kommt der gedruckte Umschlag.",
    },
    no_address: {
      title: "E-Mail statt Post",
      detail:
        "Dein Tarif enthält den gedruckten Umschlag, aber wir haben keine Adresse dafür — deshalb kommen Questkarte und Sticker per E-Mail. Trag eine Adresse ein, und der nächste Umschlag geht mit der Post.",
    },
  },

  stickers: {
    kicker: "Gedruckt, gummiert, verschickt",
    heading: "Sticker",
    lede: "Nichts hier ist eine Trophäe am Bildschirm. Jeder ist ein echter Sticker, und ein Umschlag trägt höchstens zwei davon neben der Questkarte des Monats — der Rest wartet.",
    earned: "Verdient",
    onYourPlan: "In deinem Tarif",
    printedInAll: "Insgesamt gedruckt",
    posted: "Kommt per Post",
    onScreen: "Am Bildschirm",
    withdrawn: "Von der Redaktion zurückgenommen",
    progress: (value, target) => `${value} / ${target}`,
    beyondHeading: (count) => `${count} Bögen, die du noch nicht siehst`,
    beyondBody: (plan, reachable, total) =>
      `Der Tarif ${plan} druckt ${reachable} von ${total}. Der Rest ist für Mitglieder weiter oben gestanzt — was sie sind, bleibt versiegelt, solange der Tarif es ist.`,
    seePlans: "Tarife ansehen",
    addAddress: "Adresse hinzufügen",
  },

  sheet: {
    "first-light": { label: "Erstes Licht", description: "Du bist wirklich los. Trag deinen ersten Quest ein." },
    "second-wind": { label: "Zweiter Wind", description: "Fünf eingetragen. Der erste war kein Zufall." },
    "into-the-trees": { label: "Zwischen die Bäume", description: "Drei Tage unter Blätterdach." },
    "first-ridge": { label: "Erster Grat", description: "Drei Quests mit einem Berg darin." },
    "twenty-five": { label: "Sechzig", description: "Sechzig Kilometer, alles zusammen." },
    "thousand-up": {
      label: "Zweieinhalb",
      description: "Zweieinhalbtausend Höhenmeter liegen hinter dir.",
    },
    "ten-logged": {
      label: "Fünfundzwanzig eingetragen",
      description: "Fünfundzwanzig Quests, keine Wiederholung.",
    },
    cartographer: { label: "Kartograf", description: "Acht verschiedene Regionen." },
    "gorge-rat": { label: "Schluchtenratte", description: "Sechs Quests mit Wasser." },
    "long-hauler": {
      label: "Langstrecke",
      description: "Zweihundertfünfzig Kilometer unter den Schuhen.",
    },
    "twenty-five-logged": {
      label: "Sechzig eingetragen",
      description: "Sechzig Quests. Mehr als eine ganze Saison.",
    },
    "fifty-logged": { label: "Hundertzwanzig", description: "Hundertzwanzig eingetragene Quests." },
    "hundred-logged": {
      label: "Zweihundertfünfzig",
      description: "Zweihundertfünfzig Quests. Geh vielleicht weniger raus.",
    },
    "two-hundred-logged": {
      label: "Fünfhundert",
      description: "Fünfhundert eingetragen. Uns gehen die Worte aus.",
    },
    "five-thousand-up": {
      label: "Zwölftausend hoch",
      description: "Zwölftausend Höhenmeter, alles zusammen.",
    },
    everest: {
      label: "Vom Meer zum Gipfel",
      description: "8.848 Höhenmeter geklettert. Die Höhe des großen.",
    },
    "ten-thousand-up": {
      label: "Fünfundzwanzigtausend hoch",
      description: "Fünfundzwanzigtausend Höhenmeter.",
    },
    "twenty-five-thousand-up": {
      label: "Sechzigtausend",
      description: "Sechzigtausend Meter hoch. Fast sieben Everests.",
    },
    "two-fifty-km": { label: "Sechshundert", description: "Sechshundert gelaufene Kilometer." },
    "five-hundred-km": {
      label: "Zwölfhundert",
      description: "Zwölfhundert Kilometer. Ein langes Land von Rand zu Rand.",
    },
    "thousand-km": {
      label: "Vier Stellen, zweimal",
      description: "Zweieinhalbtausend eingetragene Kilometer.",
    },
    "ten-regions": { label: "Fünfzehn Regionen", description: "Fünfzehn verschiedene Regionen." },
    "twenty-regions": {
      label: "Dreißig Regionen",
      description: "Dreißig Regionen. Dir geht die Karte aus.",
    },
    "border-crosser": { label: "Grenzgänger", description: "Ein Quest in einem zweiten Land." },
    "five-countries": { label: "Acht Länder", description: "Acht Länder im Verzeichnis." },
    "peak-bagger": { label: "Gipfelsammler", description: "Fünfundzwanzig Quests mit einem Berg." },
    "deep-woods": { label: "Tiefer Wald", description: "Fünfundzwanzig Quests unter Bäumen." },
    "lake-district": { label: "Seenland", description: "Zwölf Quests mit einem See auf der Route." },
    "waterfall-chaser": {
      label: "Wasserfalljäger",
      description: "Fünfundzwanzig Quests mit fallendem Wasser.",
    },
    "ruin-hunter": { label: "Ruinenjäger", description: "Zwölf Burgen oder Ruinen erreicht." },
    "every-grade": {
      label: "Alle vier Stufen",
      description: "Leicht, mittel, schwer und Experte — von jeder mindestens eine.",
    },
    "four-seasons": {
      label: "Vier Jahreszeiten",
      description: "Ein Quest im Winter, im Frühling, im Sommer und im Herbst.",
    },
    "twelve-months": {
      label: "Jeder Monat",
      description: "Du warst in allen zwölf Monaten des Jahres unterwegs.",
    },
    unbroken: {
      label: "Ohne Unterbrechung",
      description: "Acht Wochen am Stück, und in jeder etwas eingetragen.",
    },
    "all-terrain": {
      label: "Jedes Gelände",
      description: "Berg, Wald, See, Wasserfall und Ruine. Jede Art von Boden.",
    },
    "the-long-year": {
      label: "Das lange Jahr",
      description: "Tausend Kilometer innerhalb eines Kalenderjahres.",
    },
  },

  nudge: {
    address: {
      title: "Wohin soll der Umschlag?",
      body: "Dein Tarif enthält jeden Monat die gedruckte Questkarte und zwei Sticker. Ohne Adresse können wir sie nicht schicken — die Karte käme dann per E-Mail.",
      action: "Adresse hinzufügen",
    },
    notNow: "Jetzt nicht",
  },

  profile: {
    yearHeading: "Ein Jahr des Dabeiseins",
    nothingApproved: "Noch nichts bestätigt",
    walked: (count) => `${count} gelaufen`,
    less: "Weniger",
    more: "Mehr",
    yearSummary: (name, days, best) =>
      `${days} Tage hier im letzten Jahr, am meisten ${best}. Das Jahr von ${name}.`,
    yearEmpty: (name) => `${name} war im letzten Jahr nicht hier.`,
    dayTooltip: (when, count) =>
      `${when} — ${count === 0 ? "nichts" : count === 1 ? "1 Sache" : `${count} Sachen`}`,
    about: "Über mich",
    elsewhere: "Anderswo",
    earnedHeading: "Verdient",
    walkedHeading: (name) => `Was ${name} gelaufen ist`,
    approvedOnly: "Nur Bestätigtes",
    nothingHere:
      "Noch nichts bestätigt. Hierher kommt nur ein Nachweis, den jemand geprüft hat.",
    editYourPage: "Deine Seite bearbeiten",
    walkTogether: "Zusammen gehen",
    since: (when) => `Unterwegs seit ${when}`,
    logged: "Eingetragen",
    kilometres: "Kilometer",
    metresUp: "Höhenmeter",
    regions: "Regionen",
    retreat: "Umkehr",
    switches: {
      stats: {
        label: "Was du eingetragen hast",
        detail: "Die vier Zahlen — Quests, Kilometer, Höhenmeter, Regionen.",
      },
      country: {
        label: "Dein Land",
        detail: "Das Land, von dem aus du misst. Nie eine Stadt, nie eine Adresse.",
      },
      activities: {
        label: "Was du gelaufen bist",
        detail: "Nur bestätigte Nachweise, mit deinem eigenen Bericht zu jedem Tag.",
      },
      stickers: {
        label: "Sticker",
        detail: "Die, die du verdient hast. Gesperrte sieht ein Leser nie.",
      },
      activityGrid: {
        label: "Dein Jahr",
        detail: "Das Raster der Tage, an denen du hier warst. Wie oft, nie was du getan hast.",
      },
    },
  },
};
