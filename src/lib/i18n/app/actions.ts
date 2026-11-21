/**
 * What the member's server actions answer with: refusals, confirmations and
 * form checks. These used to be written in English inside the actions, so a
 * Slovak screen could answer a wrong password in English.
 */
export const actionsEn = {
  actions: {
    checkForm: "Check the form.",
    checkField: "Check this field.",

    proofNote: "Tell us what happened.",
    proofFutureDate: "That date hasn't happened yet.",
    proofPhoto: "Add at least one photo before filing.",
    questGone: "That quest is gone.",
    questClosed: "That quest isn't open to file against.",
    questUnknown: "Unknown quest.",
    questNotYours: "That quest isn't yours.",
    noFeatured: "There's no quest placed for this period yet.",

    stravaLink: "That is not a Strava activity link.",
    stravaConnect: "Connect Strava in Settings first.",
    stravaRefused: "Strava would not hand that activity over.",

    groupName: "Give it a name.",
    groupMissing: "There is no group at that link.",
    groupHandOver: "Hand the group to somebody else before you leave it.",

    countryPick: "Pick a country.",
    countryUnknown: "That isn't a country we cover yet.",
    countryUltra: "Outside Europe is Ultra. Your plan stops at Europe.",
    typePhrase: (phrase: string) => `Type ${phrase} exactly.`,

    handleShort: "A handle needs at least two characters.",
    handleUnusable: "That reduces to nothing usable — try letters and numbers.",
    handleTaken: "Somebody already walks under that one.",

    displayInvalid: "Those settings didn't make sense.",
    addressInvalid: "That address didn't save.",

    passwordCurrent: "Type your current password.",
    passwordShort: (min: number) => `A new password needs at least ${min} characters.`,
    passwordWrong: "That is not your current password.",
    passwordChanged: "Password changed. Every session has been signed out.",
    accountGone: "That account is gone.",

    billingOff: "Billing isn't configured on this deployment.",
    noPaidPlan: "There's no paid plan on this account.",
    alreadyStopping: "That plan is already set to stop.",
    paddleRefused: "The payment provider wouldn't accept that just now. Nothing was changed — try again.",
    cancelledRefund: "Cancelled. The refund has been filed.",
    cancelledAtEnd: "Cancelled. You keep everything until the period ends.",
    nothingToPause: "There is no live subscription to pause.",
    pausedUntil: (date: string) => `Paused until ${date}.`,
    nothingPaused: "There is nothing paused.",
    resumed: "Billing resumed.",
    staffNoPlan: "Staff accounts can't hold a subscription.",
    planUnknown: "That isn't a plan you can buy.",
    planUnavailable: "That plan isn't available right now.",
  },
};

export const actionsSk: typeof actionsEn = {
  actions: {
    checkForm: "Skontroluj formulár.",
    checkField: "Skontroluj toto pole.",

    proofNote: "Napíš, ako to prebehlo.",
    proofFutureDate: "Ten dátum ešte nebol.",
    proofPhoto: "Pred odovzdaním pridaj aspoň jednu fotku.",
    questGone: "Tento quest už neexistuje.",
    questClosed: "K tomuto questu sa dôkaz odovzdať nedá.",
    questUnknown: "Neznámy quest.",
    questNotYours: "Tento quest nie je tvoj.",
    noFeatured: "Na toto obdobie zatiaľ nie je naplánovaný žiadny quest.",

    stravaLink: "Toto nie je odkaz na aktivitu zo Stravy.",
    stravaConnect: "Najprv prepoj Stravu v nastaveniach.",
    stravaRefused: "Strava túto aktivitu nevydala.",

    groupName: "Daj skupine názov.",
    groupMissing: "Na tomto odkaze nie je žiadna skupina.",
    groupHandOver: "Kým odídeš, odovzdaj skupinu niekomu inému.",

    countryPick: "Vyber krajinu.",
    countryUnknown: "Túto krajinu zatiaľ nepokrývame.",
    countryUltra: "Mimo Európy platí plán Ultra. Tvoj plán končí na hraniciach Európy.",
    typePhrase: (phrase) => `Napíš presne ${phrase}.`,

    handleShort: "Prezývka potrebuje aspoň dva znaky.",
    handleUnusable: "Z toho nezostalo nič použiteľné — skús písmená a čísla.",
    handleTaken: "Pod touto prezývkou už niekto chodí.",

    displayInvalid: "Tieto nastavenia nedávajú zmysel.",
    addressInvalid: "Adresa sa neuložila.",

    passwordCurrent: "Napíš svoje súčasné heslo.",
    passwordShort: (min) => `Nové heslo potrebuje aspoň ${min} znakov.`,
    passwordWrong: "Toto nie je tvoje súčasné heslo.",
    passwordChanged: "Heslo je zmenené. Odhlásili sme ťa na všetkých zariadeniach.",
    accountGone: "Tento účet už neexistuje.",

    billingOff: "Platby tu nie sú nastavené.",
    noPaidPlan: "Tento účet nemá platený plán.",
    alreadyStopping: "Tento plán už má nastavený koniec.",
    paddleRefused: "Platobná brána to práve neprijala. Nič sa nezmenilo — skús to znova.",
    cancelledRefund: "Zrušené. Vrátenie peňazí je zadané.",
    cancelledAtEnd: "Zrušené. Všetko ti ostáva do konca zaplateného obdobia.",
    nothingToPause: "Nemáš aktívne predplatné, ktoré by sa dalo pozastaviť.",
    pausedUntil: (date) => `Pozastavené do ${date}.`,
    nothingPaused: "Nič nie je pozastavené.",
    resumed: "Platby opäť bežia.",
    staffNoPlan: "Účty tímu nemôžu mať predplatné.",
    planUnknown: "Taký plán sa kúpiť nedá.",
    planUnavailable: "Tento plán teraz nie je dostupný.",
  },
};

export const actionsDe: typeof actionsEn = {
  actions: {
    checkForm: "Prüf das Formular.",
    checkField: "Prüf dieses Feld.",

    proofNote: "Erzähl, wie es war.",
    proofFutureDate: "Dieses Datum liegt in der Zukunft.",
    proofPhoto: "Füge vor dem Einreichen mindestens ein Foto hinzu.",
    questGone: "Diesen Quest gibt es nicht mehr.",
    questClosed: "Für diesen Quest kann kein Nachweis eingereicht werden.",
    questUnknown: "Unbekannter Quest.",
    questNotYours: "Dieser Quest gehört nicht dir.",
    noFeatured: "Für diesen Zeitraum ist noch kein Quest geplant.",

    stravaLink: "Das ist kein Link zu einer Strava-Aktivität.",
    stravaConnect: "Verbinde zuerst Strava in den Einstellungen.",
    stravaRefused: "Strava hat diese Aktivität nicht herausgegeben.",

    groupName: "Gib der Gruppe einen Namen.",
    groupMissing: "Unter diesem Link gibt es keine Gruppe.",
    groupHandOver: "Übergib die Gruppe an jemand anderen, bevor du sie verlässt.",

    countryPick: "Wähle ein Land.",
    countryUnknown: "Dieses Land decken wir noch nicht ab.",
    countryUltra: "Außerhalb Europas gilt Ultra. Dein Plan endet an Europas Grenzen.",
    typePhrase: (phrase) => `Tippe genau ${phrase}.`,

    handleShort: "Ein Handle braucht mindestens zwei Zeichen.",
    handleUnusable: "Davon bleibt nichts Brauchbares — versuch Buchstaben und Zahlen.",
    handleTaken: "Unter diesem Namen ist schon jemand unterwegs.",

    displayInvalid: "Diese Einstellungen ergeben keinen Sinn.",
    addressInvalid: "Die Adresse wurde nicht gespeichert.",

    passwordCurrent: "Gib dein aktuelles Passwort ein.",
    passwordShort: (min) => `Ein neues Passwort braucht mindestens ${min} Zeichen.`,
    passwordWrong: "Das ist nicht dein aktuelles Passwort.",
    passwordChanged: "Passwort geändert. Du wurdest auf allen Geräten abgemeldet.",
    accountGone: "Dieses Konto gibt es nicht mehr.",

    billingOff: "Zahlungen sind hier nicht eingerichtet.",
    noPaidPlan: "Dieses Konto hat keinen bezahlten Plan.",
    alreadyStopping: "Dieser Plan ist bereits gekündigt.",
    paddleRefused: "Der Zahlungsdienst hat das gerade nicht angenommen. Nichts wurde geändert — versuch es noch einmal.",
    cancelledRefund: "Gekündigt. Die Rückerstattung ist veranlasst.",
    cancelledAtEnd: "Gekündigt. Du behältst alles bis zum Ende des Zeitraums.",
    nothingToPause: "Es gibt kein aktives Abo zum Pausieren.",
    pausedUntil: (date) => `Pausiert bis ${date}.`,
    nothingPaused: "Nichts ist pausiert.",
    resumed: "Zahlungen laufen wieder.",
    staffNoPlan: "Team-Konten können kein Abo haben.",
    planUnknown: "Diesen Plan kann man nicht kaufen.",
    planUnavailable: "Dieser Plan ist gerade nicht verfügbar.",
  },
};
