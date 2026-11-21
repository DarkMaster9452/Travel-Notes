import type { MarketingMessages } from "./en";

/** Deutsch für Landingpage, Anmeldung, Rechtliches und Fehlerseiten. */
export const marketingDe: MarketingMessages = {
  meta: {
    title: "Summit Quest — jeden Monat ein Berg für alle",
    description:
      "Jeden Monat ein großer Quest, jede Woche ein kleinerer. Eine echte Route mit Markierung, Länge und Aufstieg. Geh sie, reiche deinen Nachweis ein, hol dir den Sticker und deinen Platz in der Rangliste.",
  },

  ui: {
    dismiss: "Hinweis schließen",
    close: "Schließen",
    menu: "Menü",
    language: "Sprache",
    skipToContent: "Zum Inhalt springen",
    home: "Summit Quest, Startseite",
    required: "Pflichtfeld",
    optional: "optional",
  },

  landing: {
    nav: {
      how: "So funktioniert es",
      quests: "Wochenquests",
      proof: "Nachweis & Rangliste",
      stickers: "Sticker",
      pricing: "Tarife",
      faq: "Fragen",
      login: "Anmelden",
      start: "Loslegen",
      yourQuests: "Meine Quests",
      openPanel: "Panel öffnen",
      label: "Abschnitte",
    },
    hero: {
      overline: "Ein großer Quest im Monat · jede Woche ein neuer kleiner",
      title: "Diesen Monat steigen alle auf denselben Berg.",
      lede: "Summit Quest gibt dir eine echte Route mit Markierung, Länge und Aufstieg, ein Zeitfenster und am Ende einen Sticker. Geh sie, reiche deinen Nachweis ein und sieh, wo du in der Rangliste landest.",
      join: "Beim Monatsquest mitmachen",
      open: "Monatsquest öffnen",
      how: "So funktioniert es",
      example: "Beispiel",
      emptyTitle: "Der nächste Monatsquest öffnet am Ersten.",
      emptyBody: "Leg jetzt ein kostenloses Konto an, dann wartet der Quest am Morgen seines Starts auf dich.",
    },
    how: {
      overline: "So funktioniert es",
      title: "Vier Schritte vom Sofa bis zum Gipfel.",
      lede: "Keine Planung, kein Routenvergleich bis Mitternacht. Die Route steht fest, du gehst einfach los.",
      steps: [
        {
          title: "Du bekommst eine Route",
          body: "Der Monatsquest erscheint am Ersten, ein Wochenquest jeden Montag. Jeder zeigt Markierung, Länge, Aufstieg, Zeit und Parkplatz.",
        },
        {
          title: "Du gehst los",
          body: "Allein, mit Freunden oder mit dem Hund. Du hast das ganze Fenster: einen Monat für den großen, eine Woche für den kleinen.",
        },
        {
          title: "Du reichst den Nachweis ein",
          body: "Ein paar Fotos von der Route, ein Strava-Link oder ein paar Zeilen über den Tag. Jeden Nachweis liest ein Mensch.",
        },
        {
          title: "Du bekommst den Sticker",
          body: "Nach der Freigabe gibt es Punkte in der Rangliste und einen Sticker für die Sammlung. Abonnenten bekommen ihn auch per Post.",
        },
      ],
    },
    weekly: {
      overline: "Wochenquests",
      title: "Für jede Woche ein kleinerer Ausflug.",
      lede: "Kürzere Routen für den Samstagvormittag. Sie öffnen montags um 6:00 Uhr und schließen sonntags um Mitternacht. Hier sind drei aus der Datenbank.",
      cta: "Alle Quests ansehen",
      cardFoot: "Routendetails nach der Anmeldung",
      cardFootSignedIn: "Route öffnen",
      empty: "Die Quest-Datenbank wird gerade gefüllt. Schau bald wieder vorbei.",
    },
    proof: {
      overline: "Nachweis & Rangliste",
      title: "Es zählt erst, wenn jemand nachgesehen hat.",
      lede: "Die Sticker sind echt und die Rangliste ist gemeinsam, also muss „ich war dort“ etwas bedeuten. Ein Nachweis dauert zwei Minuten.",
      points: [
        {
          title: "Fotos, Strava oder ein paar Zeilen",
          body: "Lade bis zu vier Fotos von der Route hoch, hänge eine Strava-Aktivität an oder beschreibe den Tag in eigenen Worten.",
        },
        {
          title: "Ein Mensch liest es",
          body: "Keine Automatik. Meist weißt du innerhalb eines Tages, ob dein Nachweis freigegeben ist.",
        },
        {
          title: "Umkehren zählt auch",
          body: "Das Wetter ist umgeschlagen? Trag es als Rückzug ein. Eine vernünftige Entscheidung ist auch ein Ergebnis.",
        },
      ],
      card: {
        title: "Dein Nachweis",
        sent: "Eingereicht",
        sentNote: "Fotos und eine Notiz von der Route",
        review: "Wartet auf Freigabe",
        reviewNote: "Ein Mensch liest ihn gerade",
        approved: "Freigegeben",
        approvedNote: "Punkte in der Rangliste, Sticker freigeschaltet",
      },
      board: {
        title: "Eine Rangliste jede Woche und jeden Monat",
        body: "Punkte gibt es für Länge, Aufstieg und Schwierigkeit. Die ersten drei bekommen eine Medaille.",
        gold: "Gold",
        silver: "Silber",
        bronze: "Bronze",
      },
    },
    stickers: {
      overline: "Sticker",
      title: "Für jeden Meilenstein ein Sticker.",
      lede: "Der erste Quest, tausend Höhenmeter, zehn Regionen. Sie werden freigeschaltet, sobald dein Nachweis freigegeben ist, und bleiben in deiner Sammlung.",
      points: {
        count: {
          title: (count: number) => `${count} Sticker zum Sammeln`,
          body: "Von der ersten Tour bis zum ganzen Jahr ohne ausgelassenen Monat.",
        },
        post: {
          title: "Per Post nach Hause",
          body: "Abonnenten bekommen jeden Monat einen Umschlag mit der Questkarte und zwei gestanzten Stickern.",
        },
        show: {
          title: "Eine Sammlung zum Zeigen",
          body: "Zeig deine Sticker auf deiner öffentlichen Seite. Oder behalte sie für dich.",
        },
      },
      cta: "Mit dem Sammeln anfangen",
      sheetLabel: "Ein Ausschnitt des Stickerbogens",
    },
    pricing: {
      overline: "Tarife",
      title: "Kostenlos ausprobieren. Abonnieren, wenn es dich gepackt hat.",
      lede: (days: number) =>
        `Jederzeit kündbar. Überlegst du es dir innerhalb von ${days} Tagen anders, bekommst du alles zurück.`,
      billing: "Abrechnungszeitraum",
      monthly: "Monatlich",
      yearly: "Jährlich",
      perMonth: "/ Monat",
      perYear: "/ Jahr",
      forever: "für immer",
      free: "Kostenlos",
      save: (percent: number) => `${percent} % sparen`,
      includes: "Enthalten",
      notIncluded: "Nicht enthalten",
      cta: {
        free: "Kostenloses Konto anlegen",
        explorer: "Mit Explorer starten",
        ultra: "Ultra nehmen",
      },
      note: "Zahlung über Paddle · jederzeit kündbar",
      noteFree: "Keine Karte nötig",
    },
    faq: {
      overline: "Bevor du fragst",
      title: "Berechtigte Fragen.",
      items: {
        picker: {
          q: "Ist das nur ein zufälliger Routenwähler?",
          a: "Nein. Ein Quest ist eine Route mit Ziel: Er hat Markierung, Länge, Aufstieg, Zeitschätzung, einen Parkplatz und obendrauf eine Bonusaufgabe. Und den Monatsquest geht die ganze Community im selben Monat.",
        },
        free: {
          q: "Was bekomme ich kostenlos?",
          a: (quests: number, stickers: number) =>
            `Ein Konto, ${quests} echte Quests aus der Datenbank und die ersten ${stickers} Sticker. Ohne Karte. Unbegrenzte Quests, Sticker per Post und weitere Regionen gibt es ab Explorer.`,
        },
        proof: {
          q: "Wie beweise ich, dass ich dort war?",
          a: "Du reichst einen Nachweis ein: bis zu vier Fotos, einen Link zu einer Strava-Aktivität oder einen Bericht über den Tag. Ein Mensch liest ihn und gibt ihn meist innerhalb eines Tages frei oder schickt ihn mit einer Notiz zurück.",
        },
        weather: {
          q: "Was, wenn das Wetter umschlägt oder die Route zu viel ist?",
          a: "Kehr um. Auch einen Rückzug kannst du eintragen, und er wird als Rückzug freigegeben, nicht als Scheitern. Die Schwierigkeit jedes Quests siehst du vorab auf der Gipfelanzeige.",
        },
        safety: {
          q: "Sind die Routen sicher?",
          a: "Quests folgen markierten Wegen und zeigen Länge, Aufstieg und Zeitschätzung. Sie ersetzen aber weder Karte noch Wetterbericht noch dein eigenes Urteil. Bitte lies den Sicherheitshinweis.",
        },
        stickers: {
          q: "Was sind die Sticker?",
          a: "Jeder Meilenstein hat seinen eigenen Sticker. Er wird freigeschaltet, sobald dein Nachweis freigegeben ist. Abonnenten bekommen gestanzte Sticker auch per Post, zusammen mit der Karte des Monatsquests.",
        },
        company: {
          q: "Muss ich mit Fremden gehen?",
          a: "Nein. Solo ist eine vollwertige Art, das zu machen. Wenn du Gesellschaft willst, findest du in der App Leute und Gruppen, mit denen du dich vergleichen kannst.",
        },
        cancel: {
          q: "Kann ich kündigen?",
          a: (days: number) =>
            `Jederzeit in den Einstellungen. Der Zugang bleibt bis zum Ende des bezahlten Zeitraums, und innerhalb von ${days} Tagen nach dem Start erstatten wir alles.`,
        },
      },
    },
    cta: {
      title: "Irgendwo da draußen wartet ein Morgen auf dich.",
      lede: "Das Konto ist kostenlos. Der Quest dieses Monats ist schon offen.",
      primary: "Beim Monatsquest mitmachen",
      secondary: "Tarife ansehen",
    },
    footer: {
      blurb: "Ein großer Quest im Monat, jede Woche ein kleinerer. Geh raus.",
      product: "Produkt",
      account: "Konto",
      legal: "Rechtliches",
      login: "Anmelden",
      signup: "Konto anlegen",
      terms: "Bedingungen",
      privacy: "Datenschutz",
      safety: "Sicherheitshinweis",
      motto: "Geh raus · Hinterlasse keine Spuren · Sag jemandem, wohin du gehst",
      rights: (year: number) => `© ${year} Summit Quest`,
    },
  },

  auth: {
    login: {
      overline: "Willkommen zurück",
      title: "Mach dort weiter, wo du aufgehört hast.",
      lede: "Deine Quests, Nachweise und Sticker sind dort, wo du sie gelassen hast.",
      submit: "Anmelden",
      swap: "Noch kein Konto?",
      swapLink: "Leg eins an",
    },
    signup: {
      overline: "Kostenloses Konto",
      title: "Beginne dein Quest-Logbuch.",
      lede: (quests: number) =>
        `Ein Konto hält deine Quests, deinen Verlauf und deine Sticker. ${quests} echte Quests kostenlos, ohne Karte.`,
      submit: "Konto anlegen",
      swap: "Schon ein Konto?",
      swapLink: "Melde dich an",
    },
    name: "Vorname",
    email: "E-Mail",
    password: "Passwort",
    passwordHint: (min: number) => `Mindestens ${min} Zeichen.`,
    pending: "Einen Moment…",
    terms: {
      before: "Mit dem Anlegen eines Kontos stimmst du den",
      terms: "Bedingungen",
      between: "und der",
      privacy: "Datenschutzerklärung",
      after: " zu.",
    },
    side: {
      overline: "Der Quest dieses Monats",
      fallbackTitle: "Jeden Monat ein Berg für alle.",
      fallbackBody: "Eine echte Route, ein Zeitfenster und am Ende ein Sticker.",
    },
    errors: {
      nameRequired: "Wie sollen wir dich nennen?",
      emailRequired: "Gib deine E-Mail-Adresse ein.",
      emailInvalid: "Das sieht nicht nach einer E-Mail-Adresse aus.",
      passwordRequired: "Gib dein Passwort ein.",
      passwordShort: (min: number) => `Das Passwort braucht mindestens ${min} Zeichen.`,
      passwordLong: "So ein langes Passwort können wir nicht verarbeiten.",
      tooMany: "Zu viele Versuche. Probier es in ein paar Minuten noch einmal.",
      emailTaken: "Mit dieser E-Mail-Adresse gibt es schon ein Konto.",
      signupFailed: "Das Konto konnte nicht angelegt werden. Bitte versuch es gleich noch einmal.",
      mismatch: "E-Mail und Passwort passen nicht zusammen.",
    },
  },

  legal: {
    overline: "Rechtliches",
    /** Shown above a legal text that has not been translated yet. */
    englishOnly: "Dieser Text ist vorerst nur auf Englisch verfügbar.",
    nav: "Rechtliche Seiten",
    terms: "Bedingungen",
    privacy: "Datenschutz",
    safety: "Sicherheitshinweis",
    back: "Zurück zum Start",
  },

  notFound: {
    code: "404",
    title: "Das hier ist nicht auf der Karte.",
    body: "Die Seite, die du suchst, gibt es nicht — oder sie gehört zum Abenteuer von jemand anderem.",
    toQuests: "Zu meinen Quests",
    toStart: "Zurück zum Start",
  },
};
