/**
 * Words for the customer app's furniture: the shell, forms, filters and the
 * states every screen shares. English is the shape; Slovak and German are
 * checked against it.
 */
export const shellEn = {
  shell: {
    main: "Main navigation",
    tabs: "Quick navigation",
    /** The monthly quest in the phone tab bar, where there is room for one word. */
    tabMonthly: "Monthly",
    more: "More",
    moreTitle: "Everything else",
    account: "Account",
    monthlyOpen: "open now",
    waiting: (count: number) => `${count} waiting for approval`,
  },
  form: {
    failed: "That would not save.",
    saved: "Saved.",
    done: "Done.",
    notDone: "That didn't work.",
    working: "Working…",
    keep: "Keep it",
    typePhrase: (phrase: string) => `Type ${phrase}`,
    notThrough: "That did not go through.",
    find: "Find",
    clear: "Clear",
  },
  theme: {
    system: "Follow the device",
    light: "Light",
    dark: "Evening",
    failed: "That theme would not save.",
    note: "Stored on the account rather than in the browser, so the first paint on a new device is already the one you chose.",
  },
  state: {
    errorOverline: "Something went wrong",
    errorTitle: "That page did not load.",
    notFoundOverline: "404",
    notFoundTitle: "This one isn't on the map.",
    loading: "Loading",
  },
};

export const shellSk: typeof shellEn = {
  shell: {
    main: "Hlavná navigácia",
    tabs: "Rýchla navigácia",
    tabMonthly: "Mesačný",
    more: "Viac",
    moreTitle: "Všetko ostatné",
    account: "Účet",
    monthlyOpen: "práve otvorený",
    waiting: (count: number) => `${count} čaká na schválenie`,
  },
  form: {
    failed: "To sa nepodarilo uložiť.",
    saved: "Uložené.",
    done: "Hotovo.",
    notDone: "To sa nepodarilo.",
    working: "Pracujem…",
    keep: "Nechať tak",
    typePhrase: (phrase: string) => `Napíš ${phrase}`,
    notThrough: "To neprešlo.",
    find: "Hľadať",
    clear: "Zrušiť",
  },
  theme: {
    system: "Podľa zariadenia",
    light: "Svetlý",
    dark: "Večerný",
    failed: "Tému sa nepodarilo uložiť.",
    note: "Ukladá sa k účtu, nie do prehliadača, takže na novom zariadení uvidíš hneď tú, ktorú si si vybral.",
  },
  state: {
    errorOverline: "Niečo sa pokazilo",
    errorTitle: "Táto stránka sa nenačítala.",
    notFoundOverline: "404",
    notFoundTitle: "Toto miesto na mape nie je.",
    loading: "Načítava sa",
  },
};

export const shellDe: typeof shellEn = {
  shell: {
    main: "Hauptnavigation",
    tabs: "Schnellnavigation",
    tabMonthly: "Monat",
    more: "Mehr",
    moreTitle: "Alles Weitere",
    account: "Konto",
    monthlyOpen: "jetzt offen",
    waiting: (count: number) => `${count} warten auf Freigabe`,
  },
  form: {
    failed: "Das ließ sich nicht speichern.",
    saved: "Gespeichert.",
    done: "Erledigt.",
    notDone: "Das hat nicht geklappt.",
    working: "Moment…",
    keep: "So lassen",
    typePhrase: (phrase: string) => `Tippe ${phrase}`,
    notThrough: "Das ging nicht durch.",
    find: "Suchen",
    clear: "Zurücksetzen",
  },
  theme: {
    system: "Wie das Gerät",
    light: "Hell",
    dark: "Abend",
    failed: "Das Farbschema ließ sich nicht speichern.",
    note: "Wird am Konto gespeichert, nicht im Browser. Auf einem neuen Gerät siehst du also sofort das, was du gewählt hast.",
  },
  state: {
    errorOverline: "Etwas ist schiefgegangen",
    errorTitle: "Diese Seite wurde nicht geladen.",
    notFoundOverline: "404",
    notFoundTitle: "Das hier ist nicht auf der Karte.",
    loading: "Lädt",
  },
};
