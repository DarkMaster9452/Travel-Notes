/** Words the rebuilt leaderboard needed. */
export const leaderboardEn = {
  board: {
    standing: "Your standing",
    open: "Open",
    notRanked: "Not on this board yet",
    againstLeader: "Your points against the leader's",
    podium: "The top three",
    everyone: "Everyone on the board",
    howTitle: "How the score works",
    grades: (grades: string) => `${grades}, for the difficulty.`,
    perUnit: "One point a kilometre, one for every hundred metres of ascent.",
    bonuses: (weekly: number, monthly: number) =>
      `The weekly quest carries +${weekly}, the monthly quest +${monthly}.`,
    retreat: "An honest retreat scores half. Proof still waiting for approval scores nothing.",
    sealedTitle: "Sealed boards keep their podium",
    sealedBody:
      "Once a window closes the top three are fixed for good. A verdict changed three weeks later moves the points, never the medal. Winners' stickers go out with the next envelope.",
  },
};

export const leaderboardSk: typeof leaderboardEn = {
  board: {
    standing: "Tvoje poradie",
    open: "Otvorený",
    notRanked: "Na tomto rebríčku ešte nie si",
    againstLeader: "Tvoje body oproti prvému",
    podium: "Prví traja",
    everyone: "Všetci v rebríčku",
    howTitle: "Ako sa boduje",
    grades: (grades: string) => `${grades}, podľa obtiažnosti.`,
    perUnit: "Bod za každý kilometer a bod za každých sto metrov stúpania.",
    bonuses: (weekly: number, monthly: number) =>
      `Týždenný quest pridáva +${weekly}, mesačný quest +${monthly}.`,
    retreat: "Poctivý ústup je za polovicu. Dôkaz, ktorý čaká na schválenie, zatiaľ nič nepridáva.",
    sealedTitle: "Uzavretý rebríček si drží stupne víťazov",
    sealedBody:
      "Keď sa okno zatvorí, prví traja ostávajú navždy. Rozhodnutie zmenené o tri týždne pohne bodmi, nikdy nie medailou. Nálepky víťazov idú s ďalšou obálkou.",
  },
};

export const leaderboardDe: typeof leaderboardEn = {
  board: {
    standing: "Dein Platz",
    open: "Offen",
    notRanked: "Noch nicht auf dieser Rangliste",
    againstLeader: "Deine Punkte im Vergleich zum Ersten",
    podium: "Die ersten drei",
    everyone: "Alle auf der Rangliste",
    howTitle: "So wird gewertet",
    grades: (grades: string) => `${grades}, je nach Schwierigkeit.`,
    perUnit: "Ein Punkt pro Kilometer und einer für je hundert Höhenmeter.",
    bonuses: (weekly: number, monthly: number) =>
      `Der Wochenquest bringt +${weekly}, der Monatsquest +${monthly}.`,
    retreat: "Ein ehrlicher Rückzug zählt die Hälfte. Ein Nachweis, der auf Freigabe wartet, zählt noch nichts.",
    sealedTitle: "Geschlossene Ranglisten behalten ihr Podium",
    sealedBody:
      "Sobald ein Fenster schließt, stehen die ersten drei endgültig fest. Eine Entscheidung, die drei Wochen später geändert wird, verschiebt Punkte, nie die Medaille. Die Sticker der Sieger kommen mit dem nächsten Umschlag.",
  },
};
