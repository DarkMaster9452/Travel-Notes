/** Words the rebuilt dashboard and its rail needed. */
export const dashboardEn = {
  dashboard: {
    weekly: "This week's quest",
    noWeekly: "No weekly quest is open right now. The next one opens on Monday at 06:00.",
    /** "Week 47 opens Mon 16 Nov, 06:00" */
    opens: (label: string, when: string) => `${label} opens ${when}`,
    stickers: "stickers earned",
    you: "you",
    proofWaiting: "Your proof is waiting for approval",
    proofApproved: "Done. Your proof is approved",
    proofReturned: "Your proof was sent back",
    untilNext: "Time until the next weekly quest",
    progress: (label: string) => `Progress towards ${label}`,
    activity: "Your year",
    activityNote: "The days you were here. How often, never what you did.",
  },
};

export const dashboardSk: typeof dashboardEn = {
  dashboard: {
    weekly: "Quest tohto týždňa",
    noWeekly: "Práve nie je otvorený žiadny týždenný quest. Ďalší sa otvorí v pondelok o 6:00.",
    opens: (label: string, when: string) => `${label} sa otvorí ${when}`,
    stickers: "získaných nálepiek",
    you: "ty",
    proofWaiting: "Tvoj dôkaz čaká na schválenie",
    proofApproved: "Splnené. Tvoj dôkaz je schválený",
    proofReturned: "Tvoj dôkaz sa vrátil",
    untilNext: "Čas do ďalšieho týždenného questu",
    progress: (label: string) => `Postup k nálepke ${label}`,
    activity: "Tvoj rok",
    activityNote: "Dni, keď si tu bol. Ako často, nikdy nie čo si robil.",
  },
};

export const dashboardDe: typeof dashboardEn = {
  dashboard: {
    weekly: "Der Quest dieser Woche",
    noWeekly: "Gerade ist kein Wochenquest offen. Der nächste öffnet am Montag um 6:00 Uhr.",
    opens: (label: string, when: string) => `${label} öffnet ${when}`,
    stickers: "Sticker verdient",
    you: "du",
    proofWaiting: "Dein Nachweis wartet auf Freigabe",
    proofApproved: "Geschafft. Dein Nachweis ist freigegeben",
    proofReturned: "Dein Nachweis kam zurück",
    untilNext: "Zeit bis zum nächsten Wochenquest",
    progress: (label: string) => `Fortschritt zum Sticker ${label}`,
    activity: "Dein Jahr",
    activityNote: "Die Tage, an denen du hier warst. Wie oft, nie was du getan hast.",
  },
};
