import type { MarketingMessages } from "./en";

/** Slovenčina pre landing, prihlásenie, právne a chybové stránky. */
export const marketingSk: MarketingMessages = {
  meta: {
    title: "Summit Quest — každý mesiac jeden kopec pre všetkých",
    description:
      "Každý mesiac jeden veľký quest, každý týždeň jeden menší. Skutočná trasa so značkou, dĺžkou a stúpaním. Prejdi ju, odovzdaj dôkaz, získaj nálepku a miesto v rebríčku.",
  },

  ui: {
    dismiss: "Zavrieť oznámenie",
    close: "Zavrieť",
    menu: "Menu",
    language: "Jazyk",
    skipToContent: "Preskočiť na obsah",
    home: "Summit Quest, úvod",
    required: "Povinné",
    optional: "nepovinné",
  },

  landing: {
    nav: {
      how: "Ako to funguje",
      quests: "Týždenné questy",
      proof: "Dôkaz a rebríček",
      stickers: "Nálepky",
      pricing: "Plány",
      faq: "Otázky",
      login: "Prihlásiť sa",
      start: "Začať",
      yourQuests: "Moje questy",
      openPanel: "Otvoriť panel",
      label: "Sekcie",
    },
    hero: {
      overline: "Jeden veľký quest mesačne · každý týždeň nový menší",
      title: "Tento mesiac ideme všetci na ten istý kopec.",
      lede: "Summit Quest ti dá skutočnú trasu so značkou, dĺžkou a stúpaním, časové okno a nálepku na konci. Prejdi ju, odovzdaj dôkaz a pozri sa, kde si skončil v rebríčku.",
      join: "Pridaj sa k mesačnému questu",
      open: "Otvoriť mesačný quest",
      how: "Ako to funguje",
      example: "Ukážka",
      emptyTitle: "Ďalší mesačný quest sa otvorí prvého.",
      emptyBody: "Vytvor si účet zadarmo už teraz a quest ťa bude čakať v to ráno, keď vyjde.",
    },
    how: {
      overline: "Ako to funguje",
      title: "Štyri kroky od gauča po vrchol.",
      lede: "Žiadne plánovanie, žiadne porovnávanie trás do noci. Trasa je vybraná, ty len vyrazíš.",
      steps: [
        {
          title: "Dostaneš trasu",
          body: "Prvého v mesiaci vyjde mesačný quest, každý pondelok týždenný. Pri každom vidíš značku, dĺžku, stúpanie, čas a kde zaparkovať.",
        },
        {
          title: "Vyrazíš",
          body: "Sám, s partiou alebo so psom. Máš na to celé okno: mesiac na veľký quest, týždeň na menší.",
        },
        {
          title: "Odovzdáš dôkaz",
          body: "Pár fotiek z trasy, odkaz na Stravu alebo pár viet o tom, aký bol deň. Každý dôkaz číta človek.",
        },
        {
          title: "Získaš nálepku",
          body: "Po schválení ti pribudnú body v rebríčku a nálepka do zbierky. Predplatiteľom chodia nálepky aj poštou.",
        },
      ],
    },
    weekly: {
      overline: "Týždenné questy",
      title: "Na každý týždeň jedna menšia výprava.",
      lede: "Kratšie trasy na sobotné dopoludnie. Otvárajú sa v pondelok o 6:00 a zatvárajú v nedeľu o polnoci. Toto sú tri z databázy.",
      cta: "Pozrieť všetky questy",
      cardFoot: "Detail trasy po prihlásení",
      cardFootSignedIn: "Otvoriť trasu",
      empty: "Databáza questov sa práve plní. Pozri sa sem o chvíľu.",
    },
    proof: {
      overline: "Dôkaz a rebríček",
      title: "Počíta sa to, až keď to niekto skontroluje.",
      lede: "Nálepky sú skutočné a rebríček spoločný, takže „bol som tam“ musí niečo znamenať. Odovzdať dôkaz trvá dve minúty.",
      points: [
        {
          title: "Fotky, Strava alebo pár viet",
          body: "Nahraj až štyri fotky z trasy, pripoj aktivitu zo Stravy alebo opíš deň vlastnými slovami.",
        },
        {
          title: "Číta to človek",
          body: "Žiadny automat. Väčšinou do dňa vieš, či je dôkaz schválený.",
        },
        {
          title: "Aj návrat sa počíta",
          body: "Otočilo sa počasie? Zapíš to ako ústup. Rozumné rozhodnutie je tiež výsledok.",
        },
      ],
      card: {
        title: "Tvoj dôkaz",
        sent: "Odovzdané",
        sentNote: "Fotky a poznámka z trasy",
        review: "Čaká na schválenie",
        reviewNote: "Práve ho číta človek",
        approved: "Schválené",
        approvedNote: "Body v rebríčku, nálepka odomknutá",
      },
      board: {
        title: "Rebríček každý týždeň aj mesiac",
        body: "Body dostaneš za dĺžku, stúpanie a obtiažnosť. Prví traja si odnesú medailu.",
        gold: "Zlato",
        silver: "Striebro",
        bronze: "Bronz",
      },
    },
    stickers: {
      overline: "Nálepky",
      title: "Za každý míľnik jedna nálepka.",
      lede: "Prvý quest, tisíc výškových metrov, desať regiónov. Odomknú sa hneď po schválení dôkazu a ostanú ti v zbierke.",
      points: {
        count: {
          title: (count: number) => `${count} nálepiek na zbieranie`,
          body: "Od prvej túry až po celý rok bez vynechaného mesiaca.",
        },
        post: {
          title: "Poštou až domov",
          body: "Predplatiteľom posielame každý mesiac obálku s kartou questu a dvoma vyrezanými nálepkami.",
        },
        show: {
          title: "Zbierka, ktorú sa oplatí ukázať",
          body: "Nálepky si môžeš dať na verejný profil. Alebo si ich nechať pre seba.",
        },
      },
      cta: "Začať zbierať",
      sheetLabel: "Ukážka hárku nálepiek",
    },
    pricing: {
      overline: "Plány",
      title: "Vyskúšaj zadarmo. Predplať si, keď ťa to chytí.",
      lede: (days: number) => `Zrušíš kedykoľvek. Ak si to do ${days} dní rozmyslíš, vrátime ti celú sumu.`,
      billing: "Fakturačné obdobie",
      monthly: "Mesačne",
      yearly: "Ročne",
      perMonth: "/ mesiac",
      perYear: "/ rok",
      forever: "navždy",
      free: "Zadarmo",
      save: (percent: number) => `Ušetríš ${percent} %`,
      includes: "Obsahuje",
      notIncluded: "Neobsahuje",
      cta: {
        free: "Vytvoriť účet zadarmo",
        explorer: "Začať s Explorerom",
        ultra: "Chcem Ultra",
      },
      note: "Platby spracúva Paddle · zrušíš kedykoľvek",
      noteFree: "Bez platobnej karty",
    },
    faq: {
      overline: "Skôr než sa spýtaš",
      title: "Rozumné otázky.",
      items: {
        picker: {
          q: "Je to len náhodný výber trás?",
          a: "Nie. Quest je trasa s cieľom: má značku, dĺžku, stúpanie, odhad času, miesto na parkovanie a jednu bonusovú výzvu navyše. A mesačný quest ide v tom istom mesiaci celá komunita.",
        },
        free: {
          q: "Čo dostanem zadarmo?",
          a: (quests: number, stickers: number) =>
            `Účet, ${quests} skutočné questy z databázy a prvých ${stickers} nálepiek. Bez karty. Neobmedzené questy, nálepky poštou a ďalšie regióny začínajú pri Exploreri.`,
        },
        proof: {
          q: "Ako dokážem, že som tam bol?",
          a: "Odovzdáš dôkaz: až štyri fotky, odkaz na aktivitu v Strave alebo opis dňa. Prečíta ho človek a zvyčajne ho do dňa schváli alebo vráti s poznámkou.",
        },
        weather: {
          q: "Čo ak sa pokazí počasie alebo je trasa nad moje sily?",
          a: "Otoč sa. Aj ústup môžeš zapísať a schváli sa ako ústup, nie ako zlyhanie. Obtiažnosť každého questu vidíš vopred na merači vrcholov.",
        },
        safety: {
          q: "Sú trasy bezpečné?",
          a: "Questy vedú po značených chodníkoch a pri každom je dĺžka, stúpanie a odhad času. Nenahrádzajú však mapu, predpoveď ani tvoj vlastný úsudok. Prečítaj si, prosím, bezpečnostné upozornenie.",
        },
        stickers: {
          q: "Čo sú nálepky?",
          a: "Každý míľnik má vlastnú nálepku. Odomkne sa po schválení dôkazu. Predplatiteľom chodia vyrezané nálepky aj poštou spolu s kartou mesačného questu.",
        },
        company: {
          q: "Musím chodiť s cudzími ľuďmi?",
          a: "Nie. Sólo je plnohodnotný spôsob. Ak chceš spoločnosť, v appke nájdeš ľudí a skupiny, s ktorými sa môžeš porovnávať.",
        },
        cancel: {
          q: "Môžem predplatné zrušiť?",
          a: (days: number) =>
            `Kedykoľvek v nastaveniach. Prístup ti ostane do konca zaplateného obdobia a do ${days} dní od začiatku ti vrátime celú sumu.`,
        },
      },
    },
    cta: {
      title: "Niekde vonku je ráno, ktoré čaká na teba.",
      lede: "Účet je zadarmo. Tohtomesačný quest je už otvorený.",
      primary: "Pridaj sa k mesačnému questu",
      secondary: "Pozrieť plány",
    },
    footer: {
      blurb: "Jeden veľký quest mesačne, každý týždeň menší. Choď von.",
      product: "Produkt",
      account: "Účet",
      legal: "Právne",
      login: "Prihlásiť sa",
      signup: "Vytvoriť účet",
      terms: "Podmienky",
      privacy: "Súkromie",
      safety: "Bezpečnosť",
      motto: "Choď von · Nenechaj po sebe stopy · Povedz niekomu, kam ideš",
      rights: (year: number) => `© ${year} Summit Quest`,
    },
  },

  auth: {
    login: {
      overline: "Vitaj späť",
      title: "Pokračuj tam, kde si skončil.",
      lede: "Tvoje questy, dôkazy a nálepky ťa čakajú tam, kde si ich nechal.",
      submit: "Prihlásiť sa",
      swap: "Ešte nemáš účet?",
      swapLink: "Vytvor si ho",
    },
    signup: {
      overline: "Účet zadarmo",
      title: "Začni svoj denník questov.",
      lede: (quests: number) =>
        `Jeden účet drží tvoje questy, históriu a nálepky. ${quests} skutočné questy zadarmo, bez karty.`,
      submit: "Vytvoriť účet",
      swap: "Už máš účet?",
      swapLink: "Prihlás sa",
    },
    name: "Meno",
    email: "E-mail",
    password: "Heslo",
    passwordHint: (min: number) => `Aspoň ${min} znakov.`,
    pending: "Chvíľku…",
    terms: {
      before: "Vytvorením účtu súhlasíš s",
      terms: "podmienkami",
      between: "a so",
      privacy: "zásadami ochrany súkromia",
      after: ".",
    },
    side: {
      overline: "Quest tohto mesiaca",
      fallbackTitle: "Každý mesiac jeden kopec pre všetkých.",
      fallbackBody: "Skutočná trasa, časové okno a nálepka na konci.",
    },
    errors: {
      nameRequired: "Ako ťa máme volať?",
      emailRequired: "Zadaj e-mail.",
      emailInvalid: "Toto nevyzerá ako e-mailová adresa.",
      passwordRequired: "Zadaj heslo.",
      passwordShort: (min: number) => `Heslo musí mať aspoň ${min} znakov.`,
      passwordLong: "Také dlhé heslo nevieme spracovať.",
      tooMany: "Príliš veľa pokusov. Skús to o pár minút.",
      emailTaken: "Účet s týmto e-mailom už existuje.",
      signupFailed: "Účet sa nepodarilo vytvoriť. Skús to o chvíľu znova.",
      mismatch: "E-mail a heslo sa nezhodujú.",
    },
  },

  legal: {
    overline: "Právne",
    /** Shown above a legal text that has not been translated yet. */
    englishOnly: "Tento text je zatiaľ dostupný len v angličtine.",
    nav: "Právne stránky",
    terms: "Podmienky",
    privacy: "Súkromie",
    safety: "Bezpečnosť",
    back: "Späť na úvod",
  },

  notFound: {
    code: "404",
    title: "Toto miesto na mape nie je.",
    body: "Stránka, ktorú hľadáš, neexistuje, alebo patrí do dobrodružstva niekoho iného.",
    toQuests: "Na moje questy",
    toStart: "Späť na úvod",
  },
};
