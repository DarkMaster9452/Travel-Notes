/** Words for the set-up steps that were written in English in the markup. */
export const onboardingEn = {
  onboarding: {
    overline: "Four short answers",
    title: (name: string) => `Let's get you a quest, ${name}.`,
    progress: (step: number, total: number) => `Step ${step} of ${total}`,
    stepLabels: ["Where you walk", "How it reads", "Which plan", "Your watch"],
    countryBody:
      "A country, never a town and never an address. It is what quests are measured from, and the only thing a quest ever knows about where you are.",
    country: "Country",
    pickOne: "Pick one",
    ultraOnly: "Ultra",
    units: "Units",
    language: "Language",
    next: "Next",
    back: "Back",
    planBody:
      "Free gets you three quests to see whether this is for you. Explorer is the product as intended: the weekly, the monthly and the envelope. Ultra adds the rest of the world and the rest of the sticker sheet.",
    noBilling: "Payments are not set up here, so everybody is on Free.",
    cancelAnyTime: "Cancel any time",
    stravaBody:
      "Connect Strava and the proof form reads distance, ascent and moving time straight off an activity instead of asking you to type them. Read-only, and only when you paste a link.",
    connected: "Already connected.",
    connect: "Connect Strava",
    noStrava: "Strava is not set up here.",
    finish: "Open the dashboard",
    welcome: "Welcome in.",
    done: "That is everything.",
  },
};

export const onboardingSk: typeof onboardingEn = {
  onboarding: {
    overline: "Štyri krátke odpovede",
    title: (name: string) => `Poďme ti nájsť quest, ${name}.`,
    progress: (step: number, total: number) => `Krok ${step} z ${total}`,
    stepLabels: ["Kde chodíš", "Ako to čítaš", "Aký plán", "Tvoje hodinky"],
    countryBody:
      "Krajina, nikdy nie mesto a nikdy nie adresa. Od nej sa questy merajú a je to jediné, čo quest o tom, kde si, kedy vie.",
    country: "Krajina",
    pickOne: "Vyber",
    ultraOnly: "Ultra",
    units: "Jednotky",
    language: "Jazyk",
    next: "Ďalej",
    back: "Späť",
    planBody:
      "Zadarmo dostaneš tri questy, aby si zistil, či je to pre teba. Explorer je produkt tak, ako má byť: týždenný quest, mesačný quest a obálka. Ultra pridá zvyšok sveta a zvyšok hárku nálepiek.",
    noBilling: "Platby tu nie sú nastavené, takže všetci sú na pláne Zadarmo.",
    cancelAnyTime: "Zrušíš kedykoľvek",
    stravaBody:
      "Prepoj Stravu a formulár dôkazu prečíta dĺžku, stúpanie a čas v pohybe priamo z aktivity, takže ich nemusíš písať. Len na čítanie a len keď vložíš odkaz.",
    connected: "Už je prepojená.",
    connect: "Prepojiť Stravu",
    noStrava: "Strava tu nie je nastavená.",
    finish: "Otvoriť prehľad",
    welcome: "Vitaj.",
    done: "To je všetko.",
  },
};

export const onboardingDe: typeof onboardingEn = {
  onboarding: {
    overline: "Vier kurze Antworten",
    title: (name: string) => `Lass uns einen Quest für dich finden, ${name}.`,
    progress: (step: number, total: number) => `Schritt ${step} von ${total}`,
    stepLabels: ["Wo du gehst", "Wie es sich liest", "Welcher Tarif", "Deine Uhr"],
    countryBody:
      "Ein Land, nie eine Stadt und nie eine Adresse. Von dort werden Quests gemessen, und mehr erfährt ein Quest nie darüber, wo du bist.",
    country: "Land",
    pickOne: "Bitte wählen",
    ultraOnly: "Ultra",
    units: "Einheiten",
    language: "Sprache",
    next: "Weiter",
    back: "Zurück",
    planBody:
      "Kostenlos bekommst du drei Quests, um herauszufinden, ob das etwas für dich ist. Explorer ist das Produkt, wie es gedacht ist: der Wochenquest, der Monatsquest und der Umschlag. Ultra bringt den Rest der Welt und den Rest des Stickerbogens.",
    noBilling: "Zahlungen sind hier nicht eingerichtet, also sind alle auf Kostenlos.",
    cancelAnyTime: "Jederzeit kündbar",
    stravaBody:
      "Verbinde Strava, und das Nachweisformular liest Länge, Aufstieg und Bewegungszeit direkt aus einer Aktivität, statt dass du sie eintippst. Nur lesend und nur, wenn du einen Link einfügst.",
    connected: "Schon verbunden.",
    connect: "Strava verbinden",
    noStrava: "Strava ist hier nicht eingerichtet.",
    finish: "Zur Übersicht",
    welcome: "Willkommen.",
    done: "Das ist alles.",
  },
};
