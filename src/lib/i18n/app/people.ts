import type { PluralForms } from "@/lib/i18n/format";

/** Words for people, profiles and groups that were written in English in the markup. */
export const peopleEn = {
  people: {
    people: "People",
    groups: "Groups",
    members: { one: "# member", other: "# members" } as PluralForms,
    starter: {
      title: "Start a group",
      body: "Whoever you send the link to is in it. The board is the same board, filtered to the people in the group.",
      name: "Name",
      blurb: "One line about it",
      submit: "Start the group",
      starting: "Starting…",
      started: "Group started. Send the link to whoever you walk with.",
    },
    membership: {
      join: "Join this group",
      joining: "Joining…",
      joinFailed: "That would not join.",
      copy: "Copy invite link",
      copied: "Invite link copied.",
      copyFailed: "Copy the address bar instead. The clipboard refused.",
      leave: "Leave the group",
      leaveOwner: "Leave (you own it)",
      leaveConfirm: "Leave the group",
      leaveFailed: "That would not leave.",
      left: "Left the group.",
    },
    group: {
      roster: "Who is in it",
      membersOnly: "Members only",
      owner: "Owner",
      linkNote: "Anybody with this page's link can join. Send it to whoever you walk with.",
      board: "The group's board",
    },
    profile: {
      handleLine: (handle: string) => `@${handle}`,
      figures: "Figures",
    },
  },
};

export const peopleSk: typeof peopleEn = {
  people: {
    people: "Ľudia",
    groups: "Skupiny",
    members: { one: "# člen", few: "# členovia", other: "# členov" },
    starter: {
      title: "Založ skupinu",
      body: "Kto dostane odkaz, je v nej. Rebríček je ten istý rebríček, len zúžený na ľudí zo skupiny.",
      name: "Názov",
      blurb: "Jedna veta o nej",
      submit: "Založiť skupinu",
      starting: "Zakladá sa…",
      started: "Skupina je založená. Pošli odkaz tým, s ktorými chodíš.",
    },
    membership: {
      join: "Pridať sa do skupiny",
      joining: "Pridávam…",
      joinFailed: "Pridať sa nepodarilo.",
      copy: "Skopírovať odkaz na pozvanie",
      copied: "Odkaz na pozvanie je skopírovaný.",
      copyFailed: "Skopíruj adresu z prehliadača. Schránka to odmietla.",
      leave: "Odísť zo skupiny",
      leaveOwner: "Odísť (si jej vlastník)",
      leaveConfirm: "Odísť zo skupiny",
      leaveFailed: "Odísť sa nepodarilo.",
      left: "Zo skupiny si odišiel.",
    },
    group: {
      roster: "Kto v nej je",
      membersOnly: "Vidia len členovia",
      owner: "Vlastník",
      linkNote: "Pridať sa môže každý, kto má odkaz na túto stránku. Pošli ho tým, s ktorými chodíš.",
      board: "Rebríček skupiny",
    },
    profile: {
      handleLine: (handle: string) => `@${handle}`,
      figures: "Čísla",
    },
  },
};

export const peopleDe: typeof peopleEn = {
  people: {
    people: "Leute",
    groups: "Gruppen",
    members: { one: "# Mitglied", other: "# Mitglieder" },
    starter: {
      title: "Gruppe gründen",
      body: "Wer den Link bekommt, ist dabei. Die Rangliste ist dieselbe, nur auf die Leute der Gruppe begrenzt.",
      name: "Name",
      blurb: "Ein Satz dazu",
      submit: "Gruppe gründen",
      starting: "Wird gegründet…",
      started: "Die Gruppe steht. Schick den Link an alle, mit denen du gehst.",
    },
    membership: {
      join: "Dieser Gruppe beitreten",
      joining: "Trete bei…",
      joinFailed: "Der Beitritt hat nicht geklappt.",
      copy: "Einladungslink kopieren",
      copied: "Einladungslink kopiert.",
      copyFailed: "Kopiere stattdessen die Adresszeile. Die Zwischenablage hat abgelehnt.",
      leave: "Gruppe verlassen",
      leaveOwner: "Verlassen (sie gehört dir)",
      leaveConfirm: "Gruppe verlassen",
      leaveFailed: "Das Verlassen hat nicht geklappt.",
      left: "Du hast die Gruppe verlassen.",
    },
    group: {
      roster: "Wer dabei ist",
      membersOnly: "Nur für Mitglieder",
      owner: "Besitzer",
      linkNote: "Beitreten kann jeder, der den Link zu dieser Seite hat. Schick ihn an alle, mit denen du gehst.",
      board: "Die Rangliste der Gruppe",
    },
    profile: {
      handleLine: (handle: string) => `@${handle}`,
      figures: "Zahlen",
    },
  },
};
