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

  dashboard: {
    title: "Übersicht",
    headline: {
      nothing: "Nichts offen. Der nächste kommt am Montag.",
      twoRunning: "Zwei Quests offen, bei beiden läuft die Uhr.",
      twoOneRunning: "Zwei Quests offen, bei einem läuft die Uhr.",
      twoFiled: "Zwei Quests offen, beide schon eingereicht.",
      oneRunning: "Ein Quest offen, und das Fenster schließt sich.",
      oneFiled: "Ein Quest offen, schon eingereicht.",
    },
    pointsLabel: (period) => `Punkte, ${period}`,
    rankLabel: (total) => `von ${total} in der Rangliste`,
    coming: "Was kommt",
    comingNote: "Wöchentliche montags um 06:00 · der monatliche am 1.",
    theMonthly: "Der Monatliche",
    theWeekly: "Der Wöchentliche",
    generatedForYou: "Wird für dich erzeugt",
    nothingOpenHeading: "Gerade ist nichts offen",
    nothingOpenBody:
      "Der nächste wöchentliche kommt am Montag um 06:00. Bis dahin ist die Quest-Datenbank offen, und alles, was du daraus einreichst, zählt weiterhin.",
    openDatabase: "Quest-Datenbank öffnen",
    board: "Um dich herum in der Rangliste",
    fullBoard: "Ganze Rangliste →",
    boardEmpty:
      "Diesen Monat steht noch niemand in der Rangliste. Hinein kommt man mit bestätigten Nachweisen.",
    sheet: "Stickerbogen",
    sheetCount: (earned, total) => `${earned} von ${total} verdient`,
    sheetNote:
      "Zwei liegen jedem Umschlag bei, neben der Questkarte des Monats. Kleb sie dorthin, wo du sie verdient hast.",
    wholeSheet: "Der ganze Bogen",
    waitingTag: "Nachweis eingereicht · wartet auf Prüfung",
  },

  questCard: {
    fileProof: "Nachweis einreichen",
    openMonthly: "Den monatlichen öffnen",
    seeQuest: "Quest ansehen",
    closesIn: "Schließt in",
    waiting: "Wartet auf Prüfung",
    readByHuman: "Geprüft",
    windowShut: "Fenster zu",
    approved: (points) => `Bestätigt · +${points}`,
    sentBack: "Zurückgeschickt",
    stamp: (points) => `+${points} Punkte`,
    filedOn: (weekday) => `Eingereicht am ${weekday}`,
    trailhead: "Startpunkt",
    summit: "Gipfel",
    distance: "Distanz",
    ascent: "Anstieg",
    grade: "Stufe",
    fileAgain: "Erneut einreichen",
    expertFigures: "Expertenzahlen",
  },

  rail: {
    openNow: "Jetzt offen",
    nextDrop: "Der nächste",
    thenMonthly: "Dann der monatliche",
    untilWeekly: (when) => `bis der nächste wöchentliche öffnet, ${when} um 06:00. Was jetzt offen ist, bleibt bis zum Ende seines eigenen Fensters offen.`,
    standing: "Wo du stehst",
    fullBoard: "Ganze Rangliste",
    open: "Öffnen →",
    behind: (points, name) => `${points} Punkte hinter ${name}.`,
    youAreOn: (points, quests) => `Du hast ${points} aus ${quests}.`,
    topOfBoard: (points) =>
      `An der Spitze mit ${points} Punkten. Ein Monat bleibt, um sie zu halten.`,
    notOnBoard:
      "Diesen Monat nicht in der Rangliste. Hinein kommt man mit bestätigten Nachweisen — ein eingetragener Quest reicht.",
    desk: "Auf dem Tisch der Prüfung",
    deskEmpty:
      "Nichts wartet auf Prüfung. Ein Nachweis wird meist innerhalb eines Tages gelesen.",
    closest: "Nächster Sticker",
    wholeSheet: "Der ganze Bogen",
    logbook: "Das Logbuch",
    allTime: "Insgesamt",
    questsLogged: "Eingetragene Quests",
    kilometres: "Kilometer",
    metresClimbed: "Höhenmeter",
    regions: "Regionen",
    countries: (count) => `${count} Länder`,
  },

  unlock: {
    unlocked: "Freigeschaltet",
    lede: "Es ist an, und während der Demo kostenlos. Alles unten hat sich in dem Moment geöffnet, als du geklickt hast.",
    envelopeNote:
      "Der gedruckte Umschlag gehört dazu. Wohin er soll, fragen wir in einem Tag oder zwei — nicht jetzt.",
    good: "Gut",
    unlocking: "Wird freigeschaltet…",
  },

  monthly: {
    title: "Der Monatliche",
    theBigOne: (slot) => `Der große · ${slot}`,
    nothingBooked: "Für diesen Monat ist nichts geplant",
    nothingBookedBody:
      "Ein monatlicher Quest wird entweder von der Redaktion geplant oder nach deinen Vorlieben erzeugt. Erweitere deine Reichweite in den Einstellungen, dann findet sich einer.",
    openSettings: "Einstellungen öffnen",
    noMonthly: "Noch kein monatlicher Quest gesetzt.",
    brief: "Das Briefing",
    asked: "Verlangt",
    ground: "Boden",
    lookFor: "Achte auf",
    mood: "Stimmung",
    window: "Fenster",
    shut: "Zu",
    forThisMonth: "für diesen Monat",
    leftToFile: "zum Einreichen",
    daysGone: (gone, total) => `${gone} von ${total} Tagen vorbei`,
    haveFiled: (people) => `${people} eingereicht`,
    approvedSoFar: (count) => `${count} bisher bestätigt`,
    fileProof: "Nachweis einreichen",
    editProof: "Nachweis bearbeiten",
    whatCounts: "Was als Nachweis zählt",
    whatCountsBody:
      "Ein geschriebener Bericht, mindestens ein Foto, und deine Zahlen, falls eine Uhr sie aufgezeichnet hat. Eine ehrlich gemeldete Umkehr zählt halb — umzudrehen und es zu sagen ist mehr wert als nichts.",
    approach: "Der Anmarsch",
    parkHere: "Hier parken",
    parkHereNote: "Lass das Auto hier.",
    start: "Start",
    startNote: "Wo die eigentliche Route beginnt.",
    withoutCar: "Ohne Auto",
    askedLine: (km, up, moving) => `${km} km, ${up} m Anstieg, etwa ${moving} in Bewegung.`,
    fromStart: (km) => `${km} km vom Start.`,
    howItScores: "Wie es zählt",
    ifApproved: "Wenn es bestätigt wird",
    conditions: "Verhältnisse, wie andere sie gemeldet haben",
    conditionsEmpty:
      "Zu diesem hat noch niemand einen bestätigten Nachweis eingereicht. Deiner wäre das erste Wort vom Boden.",
    expertFigures: "Expertenzahlen",
    expertNote: "An, weil du sie in den Einstellungen eingeschaltet hast",
    expert: {
      metresPerKm: "Höhenmeter pro Kilometer",
      metresPerKmNote: "Wie steil der Tag im Schnitt ist, vor jedem einzelnen Anstieg.",
      askedPace: "Erwartetes Tempo",
      askedPaceNote: "Wovon die Schätzung der Bewegungszeit ausgeht.",
      travel: "Anreise von zu Hause",
      travelNote: "Aus dem Land, von dem aus du misst, nicht von einer Adresse.",
      filedSoFar: "Bisher eingereicht",
      filedSoFarNote: (approved) => `${approved} davon wurden bestätigt.`,
      approvalRate: "Bestätigungsquote",
      approvalRateNote: "Von den Nachweisen, die schon geprüft wurden.",
      worth: "Wert bei Bestätigung",
      worthNote: "Stufe, Distanz, Anstieg und der Monatsbonus.",
    },
  },

  questsPage: {
    kicker: "Alles, was je herausging",
    title: "Quest-Datenbank",
    lede: "Jeder Quest, den die Maschine geschrieben hat, auch die, die nie deine waren. Deine sind markiert, und gegen alles hier kann ein Nachweis eingereicht werden.",
    count: (n) => `${n} Quests`,
    homeOnly: (country) =>
      `Es wird nur ${country} gezeigt. Explorer öffnet jedes europäische Gebirge, Ultra den Rest der Karte.`,
    yourCountry: "dein Land",
    find: "Suchen",
    findPlaceholder: "Region oder Startpunkt",
    region: "Region",
    everyRegion: "Jede Region",
    grade: "Stufe",
    anyGrade: "Beliebige Stufe",
    cadence: "Rhythmus",
    any: "Beliebig",
    wasMonthly: "War ein monatlicher",
    wasWeekly: "War ein wöchentlicher",
    neverBooked: "Nie geplant",
    written: "Geschrieben",
    anyMonth: "Beliebiger Monat",
    noMatch: "Dazu passt nichts",
    noMatchBody:
      "Lockere die Filter — Region und Stufe zusammen schrumpfen einen Katalog von Tausenden sehr schnell auf null.",
    clearFilters: "Filter zurücksetzen",
    done: "FERTIG",
    yours: "DEINS",
    newer: "← Neuer",
    older: "Älter →",
    page: (page, pages) => `${page} von ${pages}`,
  },

  leaderboard: {
    yourPoints: (points) => `${points} Punkte`,
    tookFeatured: "hat den ausgewählten genommen",
    toOvertake: (points) => `+${points} Punkte`,
    takesPlaceAbove: "bringt dich einen Platz höher.",
    offTheLead: (points) => `${points} hinter der Spitze.`,
    everybodyRanked: "Alle, sortiert",
    lede: "Punkte für bestätigte Nachweise, auf derselben wöchentlichen und monatlichen Uhr wie alles andere. Die ersten drei einer geschlossenen Rangliste bekommen einen Sticker — für jeden Rhythmus einen anderen.",
    monthlyTab: "Monatlich",
    weeklyTab: "Wöchentlich",
    window: "Fenster",
    openNow: (count) => `Jetzt offen · ${count} im Rennen`,
    sealed: "Versiegelt",
    closed: "Geschlossen",
    openMonthly: "Den monatlichen öffnen",
    first: "Erster",
    second: "Zweiter",
    third: "Dritter",
    title: "Rangliste",
    cadence: "Rhythmus der Rangliste",
    approvedOnly:
      "Eine Rangliste zählt nur bestätigte Nachweise. Solange niemand geprüft hat, gibt es nichts zu ordnen.",
    empty: "In dieser Rangliste steht noch niemand",
    emptyWindow: "In diesem Zeitraum noch nichts bestätigt",
    emptyBody: "Hinein kommt man mit bestätigten Nachweisen.",
    leading: "Die hier führst du.",
  },

  submissions: {
    title: "Deine Einreichungen",
    filed: "Eingereicht",
    summary: (filed, approved, waiting) =>
      `${filed} eingereicht · ${approved} bestätigt · ${waiting} wartend`,
    inReview: "In Prüfung",
    approvedTag: "Bestätigt",
    photos: { one: "# Foto", other: "# Fotos" },
    stravaAttached: "Strava angehängt",
    readOn: (when) => `Gelesen am ${when}.`,
    retreat: "Umkehr",
    approved: "Bestätigt.",
    sentBack: "Zurückgeschickt.",
    waiting: "Wartet auf Prüfung.",
    unread: "Es hat noch niemand gelesen — alles wird in der Reihenfolge des Eingangs gelesen.",
    editWhileWaiting: "Bearbeiten, solange es wartet",
    addAndRefile: "Ergänzen und erneut einreichen",
    seeQuest: "Quest ansehen",
    empty: "Noch nichts eingereicht",
    emptyBody:
      "Der Nachweis ist das, was einen Quest zählen lässt. Reiche ihn zum monatlichen, zum wöchentlichen oder zu allem aus der Datenbank ein.",
  },

  people: {
    groupsTitle: "Gruppen",
    peopleTitle: "Leute",
    title: "Leute & Gruppen",
    tabs: "Leute oder Gruppen",
    directory: "Wer sonst noch unterwegs ist",
    directoryLede:
      "Alle, die ihre Seite veröffentlicht haben. Niemand ist hier, der sich nicht dafür entschieden hat, und nichts hier verrät, ob sonst jemand ein Konto hat.",
    nobodyYet: "Noch hat niemand eine Seite veröffentlicht",
    nobodyYetBody:
      "Deine zu veröffentlichen bringt dich hierher. Sie zeigt, was du eingetragen hast, und nichts über dein Konto.",
    publishYours: "Deine Seite veröffentlichen",
    editYours: "Deine Seite bearbeiten",
    noGroup: "Du bist in keiner Gruppe",
    noGroupBody:
      "Gründe eine und schick den Link an die, mit denen du gehst. Eine Gruppe ist eine eigene Rangliste, auf denselben Punkten wie alles andere.",
    groupsNote:
      "Eine Gruppe ist eine kleinere Rangliste und eine Seite, um einander zu finden. Wer drin ist, sehen nur die Leute darin, sonst niemand.",
    logged: (n) => `${n} eingetragen`,
  },

  settingsPages: {
    general: {
      heading: "Allgemein",
      kicker: "Gilt für jeden Quest",
      expertFigures: "Expertenzahlen",
      expertDetail:
        "Die zusätzlichen Zahlen je Quest — Steigung, Ausgesetztheit, die Verteilung über das Volumen — auf der Karte in der Übersicht und beim monatlichen.",
      expertFooter:
        "Expertenzahlen gehören zu Explorer und Ultra. Im kostenlosen Tarif zeigt ein Quest die vier Zahlen auf seiner Karte und sonst nichts.",
      palette: "Palette",
    },
    address: {
      heading: "Wohin der Umschlag geht",
      footer:
        "Questkarten und Sticker gehen am 2. jedes Monats raus. Eine nach dem 28. geänderte Adresse gilt erst für den übernächsten Umschlag.",
      recipient: "Name auf dem Umschlag",
      line1: "Straße",
      line2: "Zweite Zeile",
      city: "Ort oder Stadt",
      postcode: "PLZ",
      country: "Land",
    },
    notifications: {
      heading: "Benachrichtigungen",
      footer:
        "Alles außer Produktneuigkeiten dreht sich um deine eigenen Quests und deine eigenen Bewertungen.",
      questDrop: "Neuer Quest",
      questDropDetail:
        "Montags um 06:00 für den wöchentlichen, am 1. für den monatlichen. Eine E-Mail, mit dem Quest darin.",
      verdict: "Eine Bewertung deines Nachweises",
      verdictDetail: "Bestätigt oder zurückgeschickt, mit der Notiz der Prüfung, falls es eine gibt.",
      boardSealed: "Eine Rangliste schließt mit deinem Namen",
      boardSealedDetail:
        "Nur wenn du in einem gerade geschlossenen Zeitraum unter den ersten drei warst.",
      productNews: "Produktneuigkeiten",
      productNewsDetail: "Gelegentlich, nie öfter als einmal im Monat. Aus, bis du danach fragst.",
    },
  },

  shell: {
    brand: "Summit Quest",
    closeMenu: "Menü schließen",
  },

  proof: {
    readerLooksFor: "Worauf jemand achtet",
    whatHappened: "Was passiert ist",
    whatHappenedHint: "Ein Bericht über den Tag in deinen eigenen Worten, keine Bildunterschrift.",
    notePlaceholder: "Um 04:40 vom Parkplatz los, um das Licht auf dem Grat zu erwischen…",
    required: "Pflicht",
    optional: "Optional",
    photographs: "Fotos",
    photographsHint: "Fotos mit Boden darauf — wo du warst, nicht nur dein Gesicht.",
    upToFour: "Höchstens vier",
    addPhoto: "Foto hinzufügen",
    removePhoto: "Dieses Foto entfernen",
    uploading: "Wird hochgeladen…",
    uploadFailed: "Dieses Foto ließ sich nicht hochladen.",
    yourFigures: "Deine Zahlen",
    figuresHint:
      "Zahlen, die nahe an dem liegen, was der Quest verlangt hat, oder eine Zeile, warum nicht.",
    distance: "Distanz",
    ascent: "Anstieg",
    movingTime: "Bewegungszeit",
    strava: "Strava-Aktivität",
    stravaConnected: "Strava verbunden",
    stravaRead: "Zahlen aus der Aktivität übernommen.",
    stravaUnreadable: "Diese Aktivität ließ sich nicht lesen.",
    stravaBadLink: "Das muss ein vollständiger Link sein.",
    retreat: "Als Umkehr einreichen",
    retreatHint: "Eine Umkehr, klar gesagt. Umzudrehen ist ein Urteil, kein Versagen.",
    ifApproved: "Wenn das bestätigt wird",
    file: "Einreichen",
    fileRetreat: "Umkehr einreichen",
    filed: "Eingereicht. Jemand wird es lesen.",
    retreatFiled: "Umkehr eingereicht. Jemand wird es lesen.",
    failed: "Das ließ sich nicht einreichen.",
    tellUs: "Sag uns, was passiert ist — ein Satz reicht.",
  },

  questPage: {
    fromCatalogue: "Aus dem Katalog",
    objective: "Ziel",
    parkHere: "Hier parken",
    walkedBy: "Gelaufen von",
    fileProof: "Nachweis dafür einreichen",
    editProof: "Nachweis bearbeiten",
    waiting: "Wartet auf Prüfung",
    sentBack: "Zurückgeschickt",
    briefInEnglish: "Quest-Briefings sind auf Englisch geschrieben.",
  },

  panes: {
    cancel: {
      heading: "Pausieren oder kündigen",
      pauseMonth: "Einen Monat pausieren",
      pauseOne: "Einen Monat pausieren",
      pauseThree: "Drei Monate pausieren",
      pauseThreeShort: "Drei pausieren",
      resume: "Zahlung fortsetzen",
      resumeNow: "Jetzt fortsetzen",
      cancelPlan: "Meinen Tarif kündigen",
    },
    privacy: {
      published: "Veröffentlicht",
      notPublished: "Nicht veröffentlicht",
      editWhatItShows: "Bearbeiten, was sie zeigt",
      setItUp: "Einrichten",
      deleteEverything: "Alles löschen",
    },
    password: {
      currentPassword: "Aktuelles Passwort",
      newPassword: "Neues Passwort",
      heading: "Passwort",
      changeIt: "Ändern",
      signsOut: "Ein Passwortwechsel meldet alle Sitzungen ab, auch diese.",
    },
    invoices: {
      none: "Noch keine Rechnungen",
      noneBody:
        "Eine Rechnung erscheint, sobald die erste Zahlung durchgeht. Ein kostenloser Tarif erzeugt nie eine.",
      notConfigured: "Zahlungen sind hier nicht eingerichtet",
      notConfiguredBody: "Diese Installation hat keine Stripe-Schlüssel, also gibt es nichts zu lesen.",
      openPortal: "Zahlungsportal öffnen",
    },
    connected: {
      heading: "Verbundene Apps",
      stravaDetail:
        "Lies Distanz, Anstieg und Bewegungszeit direkt aus einer Aktivität, statt sie zu tippen. Nur Lesezugriff, und nur auf Aktivitäten.",
      disconnect: "Trennen",
      disconnectIt: "Trennen",
      disconnected: "Strava getrennt.",
      notConfigured: "Strava ist auf dieser Installation nicht eingerichtet.",
      denied: "Strava wurde keine Erlaubnis erteilt.",
      handshakeFailed: "Strava konnte die Verbindung nicht abschließen. Versuch es noch einmal.",
    },
  },

  errors: {
    unreadable: "Das konnten wir nicht lesen",
    unreadableBody:
      "Nichts von dem, was du eingereicht hast, ist verloren. Versuch es noch einmal — wenn es weiter passiert, sieht die Redaktion es in den Logs.",
    notFound: "Hier ist nichts",
    notFoundBody:
      "Die Seite, die du gesucht hast, gibt es nicht — oder sie gehört zum Konto von jemand anderem.",
    tryAgain: "Noch einmal versuchen",
    backToDashboard: "Zurück zur Übersicht",
  },

  onboarding: {
    steps: "Einrichtungsschritte",
    whereYouWalk: "Wo du unterwegs bist",
    oneCountry: "Ein Land",
    outsideEurope: "Außerhalb Europas ist Ultra. Alles andere gibt es in jedem Tarif.",
    howItReads: "Wie es sich liest",
    unitsAndLanguage: "Einheiten und Sprache",
    metricNote: "Quests sind metrisch geschrieben. Imperial wird bei der Anzeige umgerechnet.",
    whichPlan: "Welcher Tarif",
    takeExplorer: "Explorer nehmen",
    takeUltra: "Ultra nehmen",
    changeLater: "Das lässt sich später in den Einstellungen ändern.",
    skip: "Vorerst überspringen",
  },

  groups: {
    kicker: "Gruppe",
    notIn: "Du bist nicht in dieser Gruppe",
    notInBody:
      "Wer in einer Gruppe ist, sehen nur die Leute darin. Tritt mit dem Link bei, den dir jemand geschickt hat, dann öffnen sich Liste und Rangliste.",
    cadence: "Rhythmus der Rangliste",
    nothingScored: "In diesem Zeitraum wurde nichts erzielt",
    nothingScoredBody:
      "In eine Rangliste kommt man mit bestätigten Nachweisen. Niemand in der Gruppe hat innerhalb dieser Daten welche.",
    namePlaceholder: "Dienstagabende",
    blurbPlaceholder: "Kurze nach der Arbeit, das ganze Jahr.",
  },

  privacyPane: {
    clearIt: "Löschen",
  },

  theme: {
    palette: "Palette",
  },

  billing: {
    currentPlan: "Aktueller Tarif",
    monthly: ", monatlich",
    yearly: ", jährlich",
    aMonth: (price) => `${price} im Monat`,
    aYear: (price) => `${price} im Jahr`,
    renews: (when) => `verlängert sich am ${when}`,
    ends: (when) => `endet am ${when}`,
    freeLeft: (left, total) => `Noch ${left} von ${total} kostenlosen Quests`,
    retrying: "Zahlung wird wiederholt · Zugang bleibt",
    switchToYearly: "Auf jährlich wechseln",
    managePayment: "Zahlung verwalten",
    facts: {
      stickers: "Sticker",
      quests: "Quests",
      unlimited: "Unbegrenzt",
      questsLeft: (left) => `noch ${left}`,
      reach: "Reichweite",
      worldwide: "Weltweit",
      europe: "Europa",
      homeCountry: "Eigenes Land",
      post: "Post",
      envelope: "Monatlicher Umschlag",
      screenOnly: "Nur Bildschirm",
    },
    includesHeading: "Was dein Tarif enthält",
    plansHeading: "Die Tarife",
    cancelAnyTime: "Jederzeit kündbar",
    notConfigured: "Zahlungen sind hier nicht eingerichtet",
    demoFree: "Kostenlos während der Demo",
    upgrade: "Upgrade",
    switch: "Wechseln",
    unlockIt: "Freischalten",
    switchToIt: "Dahin wechseln",
    envelopeHeading: "Wohin der Umschlag geht",
    editAddress: "Adresse bearbeiten →",
    addAddress: "Adresse hinzufügen →",
    noAddress: "Keine Adresse hinterlegt.",
    partialAddress: "Als Adresse zu wenig — es braucht Straße, Ort und Land.",
  },

  locked: {
    paidFeature: (plan) => `${plan}-Funktion`,
    onPlan: (plan) => `Ab ${plan}`,
    seePlans: "Tarife ansehen",
    unlock: "Freischalten",
    unlockWith: (plan) => `Mit ${plan} freischalten`,
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
