/** Words for filing proof that were written in English in the old form. */
export const proofEn = {
  proof: {
    titleNew: "File your proof",
    titleEdit: "Edit your proof",
    lede: (quest: string) =>
      `${quest}. A person reads every one of these, so write it as you would tell somebody at the trailhead.`,
    closesIn: "Closes in",
    closed: "Closed",
    offCadence: "Outside the weekly and monthly windows",
    back: "Back to the quest",
    characters: (count: number) => `${count} characters, no maximum`,
    noteHint: "Conditions and hazards help the next person.",
    photoAlt: (n: number) => `Photograph ${n}`,
    photoRequired: "Add at least one photograph.",
    photoLimit: "Required, up to four",
    photoNote:
      "A photograph with the ground in it beats a summit selfie. Location data is stripped on upload, and nothing here is published unless you publish your page.",
    asked: (value: string) => `The quest asked for ${value}`,
    day: "The day you went",
    dayHint: "The board counts a quest into the window it was walked in, not the one it was written up in.",
    stravaLink: "Link to the Strava activity",
    useFigures: "Use its figures",
    turnedBack: "I turned back",
    turnedBackBody:
      "File it as an honest retreat. It scores half, and it is worth more than nothing. Say where you got to and why you stopped.",
    editable: "You can edit it until somebody reads it.",
    declineTitle: "A decline is not a door closing",
    declineBody:
      "If it comes back you keep the photographs and the note, you get the reason in the reviewer's own words, and you can file again inside the same window.",
  },
};

export const proofSk: typeof proofEn = {
  proof: {
    titleNew: "Odovzdaj dôkaz",
    titleEdit: "Uprav svoj dôkaz",
    lede: (quest: string) =>
      `${quest}. Každý dôkaz číta človek, tak ho napíš tak, ako by si to povedal niekomu na parkovisku pod kopcom.`,
    closesIn: "Zatvára sa o",
    closed: "Zatvorené",
    offCadence: "Mimo týždenného a mesačného okna",
    back: "Späť na quest",
    characters: (count: number) => `${count} znakov, bez obmedzenia`,
    noteHint: "Podmienky a nástrahy pomôžu ďalšiemu.",
    photoAlt: (n: number) => `Fotka ${n}`,
    photoRequired: "Pridaj aspoň jednu fotku.",
    photoLimit: "Povinné, najviac štyri",
    photoNote:
      "Fotka, na ktorej je vidno terén, je lepšia než selfie z vrcholu. Údaje o polohe sa pri nahraní odstránia a nič z toho sa nezverejní, kým si nezverejníš profil.",
    asked: (value: string) => `Quest žiadal ${value}`,
    day: "Deň, keď si šiel",
    dayHint: "Rebríček počíta quest do okna, v ktorom si ho prešiel, nie do toho, v ktorom si ho zapísal.",
    stravaLink: "Odkaz na aktivitu v Strave",
    useFigures: "Použiť jej čísla",
    turnedBack: "Otočil som sa",
    turnedBackBody:
      "Zapíš to ako poctivý ústup. Je za polovicu bodov a je to viac než nič. Napíš, kam si došiel a prečo si sa vrátil.",
    editable: "Upraviť ho môžeš, kým ho niekto neprečíta.",
    declineTitle: "Vrátený dôkaz nie sú zatvorené dvere",
    declineBody:
      "Ak sa vráti, fotky aj poznámka ti ostanú, dôvod dostaneš slovami kontrolóra a v tom istom okne ho môžeš odovzdať znova.",
  },
};

export const proofDe: typeof proofEn = {
  proof: {
    titleNew: "Nachweis einreichen",
    titleEdit: "Deinen Nachweis bearbeiten",
    lede: (quest: string) =>
      `${quest}. Jeden Nachweis liest ein Mensch. Schreib ihn so, wie du es jemandem am Parkplatz erzählen würdest.`,
    closesIn: "Schließt in",
    closed: "Geschlossen",
    offCadence: "Außerhalb des Wochen- und Monatsfensters",
    back: "Zurück zum Quest",
    characters: (count: number) => `${count} Zeichen, ohne Obergrenze`,
    noteHint: "Bedingungen und Gefahren helfen dem Nächsten.",
    photoAlt: (n: number) => `Foto ${n}`,
    photoRequired: "Füge mindestens ein Foto hinzu.",
    photoLimit: "Pflicht, höchstens vier",
    photoNote:
      "Ein Foto, auf dem man das Gelände sieht, ist besser als ein Gipfelselfie. Standortdaten werden beim Hochladen entfernt, und nichts davon wird veröffentlicht, solange du deine Seite nicht veröffentlichst.",
    asked: (value: string) => `Der Quest verlangte ${value}`,
    day: "Der Tag, an dem du gegangen bist",
    dayHint:
      "Die Rangliste zählt einen Quest in das Fenster, in dem du ihn gegangen bist, nicht in das, in dem du ihn eingetragen hast.",
    stravaLink: "Link zur Strava-Aktivität",
    useFigures: "Ihre Werte übernehmen",
    turnedBack: "Ich bin umgekehrt",
    turnedBackBody:
      "Reiche es als ehrlichen Rückzug ein. Er zählt die Hälfte und ist mehr als nichts. Schreib, wie weit du gekommen bist und warum du umgekehrt bist.",
    editable: "Du kannst ihn bearbeiten, bis ihn jemand gelesen hat.",
    declineTitle: "Eine Ablehnung ist keine geschlossene Tür",
    declineBody:
      "Kommt er zurück, behältst du Fotos und Notiz, bekommst den Grund in den Worten des Prüfers und kannst im selben Fenster erneut einreichen.",
  },
};
