import type { PluralForms } from "@/lib/i18n/format";

/** Words for the settings panes that were written in English in the markup. */
export const settingsEn = {
  settingsPane: {
    nav: "Settings sections",
    profile: {
      heading: "Your public page",
      see: "See your page",
      published: "Published",
      publishedDetail: "Visible to signed-in members only, and never indexed. Un-publishing takes it away immediately.",
      handle: "Handle",
      handleHint: "The part after /people/. Letters, numbers and hyphens.",
      displayName: "Name on the page",
      headline: "One line",
      bio: "About",
      accent: "Profile colour",
      accentHint: "The band behind your name and your avatar.",
      accents: {
        PINE: "Pine",
        MOSS: "Moss",
        STONE: "Stone",
        WATER: "Water",
        CLAY: "Clay",
        DUSK: "Dusk",
        SIGNAL: "Signal",
      } as Record<string, string>,
      sections: "What the page shows",
      footer: "Nothing you file is public unless this page is.",
    },
    privacy: {
      pageBody:
        "Unpublished is the default and stays the default. A published page is visible to signed-in members only, never indexed, and un-publishing takes it away immediately. Nothing you file is public unless the page is.",
      clearHeading: "Clear what you have logged",
      clearBody: (submissions: string) =>
        `Removes your quest history and your ${submissions}, including the photographs. The account stays; the record of what you have walked does not. This cannot be undone.`,
      submissions: { one: "# submission", other: "# submissions" } as PluralForms,
      deleteHeading: "Delete the account",
      deleteBody:
        "A hard delete: sessions, preferences, subscription, history and profile go with it. There is no soft-delete flag quietly keeping the row.",
    },
    connected: {
      connected: "Connected",
      connectedAs: (who: string, since: string) =>
        `Connected as ${who} since ${since}. The proof form can read distance, ascent and moving time straight off an activity.`,
      connect: "Connect Strava",
      notConfigured: "Not configured",
      footer: "Nothing is pushed to Strava, and nothing is read from it unless you paste an activity link into a proof form.",
      stateMismatch: "That handshake did not match. Start it again from here.",
      failed: "That connection did not complete.",
    },
    invoices: {
      paid: "Paid",
      open: "Open",
    },
    cancel: {
      paused: "Paused",
      pauseBody:
        "A pause holds your board history and everything you have earned for up to three months. Billing stops; nothing else changes. The quests simply do not arrive while it is paused.",
      noPause: "There is no live subscription to pause.",
      cancelHeading: "Cancel",
      cancelBody: (until: string | null, days: number) =>
        `Cancelling keeps everything you have already earned: the stickers are yours, and so is your place on every board that has already sealed. Access runs to the end of the period you have paid for${until ? `, which is ${until}` : ""}. A full refund is available within ${days} days of a payment.`,
      alreadyCancelling: "Already cancelling at the end of this period",
      confirmCancel: "Yes, cancel my plan",
      nothing: "There is nothing to cancel.",
    },
    billing: {
      opening: "Opening…",
      checkoutFailed: "Checkout would not open.",
      paymentTaken: "Payment taken. Your plan will appear in a moment.",
      portalFailed: "The billing portal would not open.",
    },
  },
};

export const settingsSk: typeof settingsEn = {
  settingsPane: {
    nav: "Sekcie nastavení",
    profile: {
      heading: "Tvoja verejná stránka",
      see: "Pozrieť stránku",
      published: "Zverejnená",
      publishedDetail:
        "Vidia ju len prihlásení členovia a vyhľadávače ju nikdy neindexujú. Keď zverejnenie zrušíš, zmizne okamžite.",
      handle: "Prezývka v adrese",
      handleHint: "Časť za /people/. Písmená, čísla a pomlčky.",
      displayName: "Meno na stránke",
      headline: "Jedna veta",
      bio: "O mne",
      accent: "Farba profilu",
      accentHint: "Pás za tvojím menom a tvoj avatar.",
      accents: {
        PINE: "Borovica",
        MOSS: "Mach",
        STONE: "Kameň",
        WATER: "Voda",
        CLAY: "Hlina",
        DUSK: "Súmrak",
        SIGNAL: "Signál",
      },
      sections: "Čo stránka ukazuje",
      footer: "Nič, čo odovzdáš, nie je verejné, kým nie je zverejnená táto stránka.",
    },
    privacy: {
      pageBody:
        "Nezverejnená stránka je predvolená a takou aj ostane. Zverejnenú stránku vidia len prihlásení členovia, vyhľadávače ju neindexujú a zrušenie zverejnenia ju skryje okamžite. Nič, čo odovzdáš, nie je verejné, kým nie je verejná stránka.",
      clearHeading: "Vymazať, čo si zapísal",
      clearBody: (submissions: string) =>
        `Odstráni históriu questov a ${submissions} vrátane fotiek. Účet ostane, záznam o tom, kde si chodil, nie. Nedá sa to vrátiť.`,
      submissions: { one: "# dôkaz", few: "# dôkazy", other: "# dôkazov" },
      deleteHeading: "Zmazať účet",
      deleteBody:
        "Úplné zmazanie: prihlásenia, nastavenia, predplatné, história aj profil. Žiadny skrytý príznak, ktorý by riadok potichu držal.",
    },
    connected: {
      connected: "Prepojené",
      connectedAs: (who: string, since: string) =>
        `Prepojené ako ${who} od ${since}. Formulár dôkazu vie prečítať dĺžku, stúpanie a čas v pohybe priamo z aktivity.`,
      connect: "Prepojiť Stravu",
      notConfigured: "Nenastavené",
      footer: "Do Stravy sa nič neposiela a nič sa z nej nečíta, kým do dôkazu nevložíš odkaz na aktivitu.",
      stateMismatch: "Prepojenie nesedelo. Začni ho odtiaľto znova.",
      failed: "Prepojenie sa nedokončilo.",
    },
    invoices: {
      paid: "Zaplatená",
      open: "Otvorená",
    },
    cancel: {
      paused: "Pozastavené",
      pauseBody:
        "Pozastavenie podrží históriu v rebríčkoch aj všetko, čo si získal, až na tri mesiace. Platby sa zastavia, nič iné sa nemení. Questy počas pozastavenia jednoducho neprídu.",
      noPause: "Nie je čo pozastaviť, predplatné nie je aktívne.",
      cancelHeading: "Zrušiť",
      cancelBody: (until: string | null, days: number) =>
        `Po zrušení ti ostane všetko, čo si už získal: nálepky sú tvoje a tvoje miesto v každom uzavretom rebríčku tiež. Prístup trvá do konca zaplateného obdobia${until ? `, teda do ${until}` : ""}. Do ${days} dní od platby ti vrátime celú sumu.`,
      alreadyCancelling: "Predplatné sa už ruší ku koncu obdobia",
      confirmCancel: "Áno, zrušiť plán",
      nothing: "Nie je čo zrušiť.",
    },
    billing: {
      opening: "Otváram…",
      checkoutFailed: "Platbu sa nepodarilo otvoriť.",
      paymentTaken: "Platba prebehla. Plán sa o chvíľu objaví.",
      portalFailed: "Platobný portál sa nepodarilo otvoriť.",
    },
  },
};

export const settingsDe: typeof settingsEn = {
  settingsPane: {
    nav: "Bereiche der Einstellungen",
    profile: {
      heading: "Deine öffentliche Seite",
      see: "Seite ansehen",
      published: "Veröffentlicht",
      publishedDetail:
        "Nur für angemeldete Mitglieder sichtbar und nie indexiert. Wenn du die Veröffentlichung aufhebst, verschwindet sie sofort.",
      handle: "Name in der Adresse",
      handleHint: "Der Teil nach /people/. Buchstaben, Zahlen und Bindestriche.",
      displayName: "Name auf der Seite",
      headline: "Ein Satz",
      bio: "Über mich",
      accent: "Profilfarbe",
      accentHint: "Der Streifen hinter deinem Namen und dein Avatar.",
      accents: {
        PINE: "Kiefer",
        MOSS: "Moos",
        STONE: "Stein",
        WATER: "Wasser",
        CLAY: "Ton",
        DUSK: "Dämmerung",
        SIGNAL: "Signal",
      },
      sections: "Was die Seite zeigt",
      footer: "Nichts, was du einreichst, ist öffentlich, solange diese Seite es nicht ist.",
    },
    privacy: {
      pageBody:
        "Unveröffentlicht ist die Voreinstellung und bleibt es. Eine veröffentlichte Seite sehen nur angemeldete Mitglieder, sie wird nie indexiert, und das Aufheben wirkt sofort. Nichts, was du einreichst, ist öffentlich, solange die Seite es nicht ist.",
      clearHeading: "Löschen, was du eingetragen hast",
      clearBody: (submissions: string) =>
        `Entfernt deinen Questverlauf und ${submissions} samt Fotos. Das Konto bleibt, die Aufzeichnung, wo du gegangen bist, nicht. Das lässt sich nicht rückgängig machen.`,
      submissions: { one: "# Nachweis", other: "# Nachweise" },
      deleteHeading: "Konto löschen",
      deleteBody:
        "Endgültiges Löschen: Sitzungen, Einstellungen, Abo, Verlauf und Profil gehen mit. Kein verstecktes Merkmal hält die Zeile still fest.",
    },
    connected: {
      connected: "Verbunden",
      connectedAs: (who: string, since: string) =>
        `Verbunden als ${who} seit ${since}. Das Nachweisformular kann Länge, Aufstieg und Bewegungszeit direkt aus einer Aktivität lesen.`,
      connect: "Strava verbinden",
      notConfigured: "Nicht eingerichtet",
      footer: "Nichts wird an Strava gesendet, und nichts wird gelesen, solange du keinen Aktivitätslink in einen Nachweis einfügst.",
      stateMismatch: "Die Verbindung passte nicht. Starte sie hier noch einmal.",
      failed: "Die Verbindung wurde nicht abgeschlossen.",
    },
    invoices: {
      paid: "Bezahlt",
      open: "Offen",
    },
    cancel: {
      paused: "Pausiert",
      pauseBody:
        "Eine Pause hält deine Ranglistenhistorie und alles, was du verdient hast, bis zu drei Monate. Die Abrechnung stoppt, sonst ändert sich nichts. Quests kommen während der Pause einfach nicht.",
      noPause: "Es gibt kein laufendes Abo zum Pausieren.",
      cancelHeading: "Kündigen",
      cancelBody: (until: string | null, days: number) =>
        `Nach der Kündigung behältst du alles, was du schon verdient hast: Die Sticker gehören dir, ebenso dein Platz auf jeder geschlossenen Rangliste. Der Zugang läuft bis zum Ende des bezahlten Zeitraums${until ? `, also bis ${until}` : ""}. Innerhalb von ${days} Tagen nach einer Zahlung erstatten wir alles.`,
      alreadyCancelling: "Wird zum Ende dieses Zeitraums bereits gekündigt",
      confirmCancel: "Ja, Tarif kündigen",
      nothing: "Es gibt nichts zu kündigen.",
    },
    billing: {
      opening: "Öffne…",
      checkoutFailed: "Die Zahlung ließ sich nicht öffnen.",
      paymentTaken: "Zahlung erhalten. Dein Tarif erscheint gleich.",
      portalFailed: "Das Zahlungsportal ließ sich nicht öffnen.",
    },
  },
};
