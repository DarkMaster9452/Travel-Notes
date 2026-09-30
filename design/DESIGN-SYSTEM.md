# Summit Quest — dizajnový systém „Trail“

> **Záväzné.** Každá zmena UI (landing, zákaznícka appka, admin panel) sa riadi
> týmto súborom. Hodnoty žijú v [`design/tokens.css`](./tokens.css). Keď tu niečo
> chýba, najprv doplň pravidlo sem, až potom kóduj. Keď sa kód a tento súbor
> rozchádzajú, platí tento súbor a kód sa opraví.

Tento systém **nahrádza** pôvodný „field guide“ vzhľad (`design/index.html`,
`src/styles/field-guide.css`, `src/styles/summit.css`). Tie sú už len legacy —
nič nové z nich nepreberaj.

---

## 0. Princípy

1. **Jeden produkt, jeden hlas.** Landing, appka aj admin používajú tie isté
   tokeny, fonty, rádiusy a komponenty. Líšia sa len **hustotou**, nie štýlom.
2. **Príroda je pozadie, quest je hrdina.** Neutrálne „kamenné“ plochy, zelená
   značka (Pine) nesie dôveru, oranžová (Blaze) = energia questu. Oranžovej je
   málo, preto svieti.
3. **Turistická značka ako motív.** Farby obtiažnosti a trojpruhý „blaze“
   (biela–farba–biela) sú náš vizuálny podpis. Nepoužívaj ich na nič iné.
4. **Obsah pred dekoráciou.** Žiadne tiene, gradienty ani ilustrácie, ktoré
   nič nehovoria. Hierarchiu robí typografia a medzery, nie rámčeky.
5. **Tri jazyky (SK / EN / DE).** Každý layout musí zniesť o **40 % dlhší text**
   (nemčina). Nikdy nefixuj šírku tlačidla alebo štítku podľa anglického textu.
6. **Prístupnosť nie je voliteľná.** WCAG 2.2 AA, ovládanie klávesnicou,
   `prefers-reduced-motion`, svetlý aj tmavý režim.

---

## 1. Farby

### 1.1 Pravidlo č. 1
V komponentoch **nikdy** nepíš hex, `rgb()`, ani surovú paletu (`pine-600`,
`stone-200`). Používaj **len sémantické tokeny** (`bg-surface`, `text-muted`,
`bg-primary`…). Surová paleta existuje iba pre `tokens.css`, grafy, obtiažnosť,
medaily a profilové farby.

### 1.2 Paleta (raw)

| Rodina | Úloha | Kľúčové odtiene |
| --- | --- | --- |
| **Stone** | neutrálne plochy, text, okraje | 50 `#f6f6f2` · 200 `#d9dbd1` · 600 `#555a4f` · 900 `#1b1e19` |
| **Pine** | značka, primárne akcie, aktívny stav | 50 `#eef6f0` · 500 `#2f7f52` · 600 `#236842` · 700 `#1c5335` |
| **Blaze** | akcent: quest, odmena, „nové“ | 50 `#fff4ec` · 500 `#ec6317` · 600 `#c94e0e` · 700 `#a03d0e` |

### 1.3 Sémantické tokeny (svetlý / tmavý)

| Token | Použitie | Light | Dark |
| --- | --- | --- | --- |
| `bg` | pozadie stránky | `#f6f6f2` | `#111310` |
| `surface` | karty, panely, tabuľky, modaly | `#ffffff` | `#1b1e19` |
| `surface-sunken` | vnorené plochy, sidebar adminu, input disabled, skeleton | `#ecede6` | `#0c0e0b` |
| `surface-raised` | dropdown, popover, tooltip | `#ffffff` | `#232720` |
| `surface-inverse` | tooltip, tmavý pás na landingu | `#1b1e19` | `#f6f6f2` |
| `border` | všetky 1px okraje a deliace čiary | `#d9dbd1` | `#2f342c` |
| `border-strong` | hover okraj, okraj inputu | `#bcbfb3` | `#454b41` |
| `text` | hlavný text, nadpisy | `#1b1e19` | `#eef0ea` |
| `muted` | sekundárny text, popisy | `#555a4f` | `#a9aea1` |
| `subtle` | placeholder, metadáta, timestampy | `#666b5f` | `#868b7e` |
| `primary` (+`-hover`, `-fg`) | primárne tlačidlo, odkaz, aktívna položka | `#236842` | `#5fb182` |
| `primary-soft` (+`-fg`) | aktívna položka menu, vybraný chip | `#eef6f0` | `#16402a` |
| `accent` (+`-hover`, `-fg`) | CTA „Vygeneruj quest“, XP, featured | `#c94e0e` | `#fb7e36` |
| `accent-soft` (+`-fg`) | badge „Týždenný / Mesačný“, highlight | `#fff4ec` | `#5e2610` |
| `success` / `-soft` | schválené, aktívne predplatné | `#1e7a3c` | `#6fcf8a` |
| `warning` / `-soft` | čaká na review, past due | `#8a5a00` | `#f2c35b` |
| `danger` / `-soft` | zamietnuté, mazanie, chyby | `#b42318` | `#f2877d` |
| `info` / `-soft` | tipy, systémové oznamy | `#1d5aa6` | `#7fb2f0` |
| `ring` | focus ring | `#2f7f52` | `#8ccba5` |
| `overlay` | pozadie za modalom | stone-950 / 55 % | čierna / 65 % |

Všetky páry text/pozadie sú overené na **≥ 4.5 : 1**.

### 1.4 Pravidlá použitia farieb
- **Primary (Pine)** = jedno hlavné tlačidlo na sekciu/formulár. Nikdy dve
  primárne tlačidlá vedľa seba.
- **Accent (Blaze)** = **najviac jeden** výrazný prvok na obrazovku
  (hlavné CTA „Vygeneruj quest“, odmena, featured quest badge). Nie na
  bežné tlačidlá, nie na nadpisy, nie na ikony v menu.
- **Stav nikdy len farbou.** Každý status = ikona + text + farba.
- Soft varianty (`*-soft`) sú pre pozadia badge/alertov, text na nich je vždy
  zodpovedajúca plná farba (`text-success` na `bg-success-soft`).
- Farebná plocha väčšia ako karta existuje len na landingu (hero, CTA pás).
  V appke a admine sú veľké plochy vždy `bg` / `surface`.

### 1.5 Doménové farby

**Obtiažnosť (enum `Difficulty`) — farby lyžiarskych/turistických značiek:**

| Hodnota | Token | Farba | Značka |
| --- | --- | --- | --- |
| `EASY` | `diff-easy` | `#2e7d32` zelená | blaze ▬ biela–zelená–biela |
| `MODERATE` | `diff-moderate` | `#1f5fbf` modrá | biela–modrá–biela |
| `HARD` | `diff-hard` | `#c8102e` červená | biela–červená–biela |
| `EXPERT` | `diff-expert` | `#1b1e19` čierna | biela–čierna–biela |

Obtiažnosť sa **vždy** zobrazí komponentom `<DifficultyBlaze>` (trojpruhá
značka 12×20 px, rádius `xs`) + textový label. Tieto farby sa nesmú použiť na
nič iné.

**Medaily (`Medal`):** `medal-gold #c9a227`, `medal-silver #9aa3ad`,
`medal-bronze #b0703c` — len v rebríčkoch a na profile.

**Profilové farby (`ProfileAccent`)** — 7 farieb, každá má 4 odtiene
(`ink` text, `deep` pás, `wash` pozadie, `edge` okraj). Používajú sa **len**
na profile / avatare / skupine daného človeka, nikdy v navigácii alebo
tlačidlách.

| Accent | ink | deep | wash | edge |
| --- | --- | --- | --- | --- |
| PINE | `#1c5335` | `#16402a` | `#eef6f0` | `#d5eadb` |
| MOSS | `#4a6a2a` | `#3a5520` | `#eef3e4` | `#d6e2c2` |
| STONE | `#4c5460` | `#3a414c` | `#eceef1` | `#d3d8de` |
| WATER | `#1d5aa6` | `#17457f` | `#e8f0fa` | `#c5d9f2` |
| CLAY | `#a03d0e` | `#7d3211` | `#fff4ec` | `#ffe3cf` |
| DUSK | `#5a4590` | `#45356f` | `#efebf7` | `#d9d0ec` |
| SIGNAL | `#b42318` | `#912018` | `#fdecea` | `#f7cdc8` |

**Grafy (admin, štatistiky):** poradie kategórií je fixné `chart-1 … chart-6`
(pine, blaze, modrá, fialová, okrová, tyrkysová). Jedna séria = vždy `chart-1`.
Mriežka grafu = `border`, popisky osí = `subtle`, `text-caption`.

---

## 2. Typografia

### 2.1 Fonty (všetky s `latin-ext` kvôli slovenčine a nemčine)

| Rola | Font | Kde |
| --- | --- | --- |
| **Display** | Bricolage Grotesque 600/700 | `display-*`, `h1`, `h2`, veľké čísla v štatistikách |
| **Sans (UI + text)** | Inter 400/500/600 | všetko ostatné vrátane `h3`, `h4` |
| **Mono** | JetBrains Mono 400/500 | len kódy: slot key `2026-W34`, ID, e-maily v tabuľke, logy |

Žiadne ďalšie fonty. Admin používa **tie isté** fonty (h1 displayom, zvyšok Inter).

### 2.2 Stupnica

| Token | Veľkosť / riadok | Font · váha | Použitie |
| --- | --- | --- | --- |
| `display-xl` | 40→64 fluid / 1.05 | Display 700, −0.03em | len hero landingu |
| `display` | 32→44 fluid / 1.1 | Display 700 | nadpisy sekcií landingu |
| `h1` | 32 / 38 | Display 700 | nadpis stránky (1× na stránku) |
| `h2` | 24 / 30 | Display 600 | sekcia na stránke |
| `h3` | 20 / 28 | Inter 600 | nadpis karty/panelu |
| `h4` | 17 / 24 | Inter 600 | titul quest karty, položka zoznamu |
| `body-lg` | 18 / 28 | Inter 400 | úvodný odsek, landing |
| `body` | 16 / 24 | Inter 400 | default text |
| `body-sm` | 14 / 20 | Inter 400/500 | UI text, tabuľky, formuláre v admine |
| `caption` | 13 / 18 | Inter 400/500 | metadáta, helper text, timestamp |
| `overline` | 12 / 16, +0.06em, UPPERCASE | Inter 600 | eyebrow nad nadpisom, hlavičky stĺpcov |

### 2.3 Pravidlá
- Na stránke je **jeden** `h1`. Nadpisy nepreskakujú úrovne.
- Dĺžka riadku textu max **65ch** (`max-w-prose` = 640 px).
- Čísla v štatistikách, tabuľkách a rebríčkoch: `tabular-nums`.
- Tučné písmo (`600+`) nie v odsekoch — len nadpisy, labely, čísla.
- Text nikdy nie je VEĽKÝMI písmenami okrem `overline`.
- Odkazy v texte: `text-primary underline underline-offset-2`; v navigácii bez podčiarknutia.

---

## 3. Medzery a rozmery

**Základ 4 px.** Povolené hodnoty (Tailwind kroky):

| px | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96 | 128 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TW | 0.5 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 |

**Žiadne arbitrary hodnoty** (`p-[13px]`, `mt-[7px]`) — nikdy.

### 3.1 Kde aká medzera

| Vzťah | Hodnota |
| --- | --- |
| ikona ↔ text v tlačidle / chipe | 8 (`gap-2`) |
| label ↔ input ↔ helper | 6 → použi `gap-1.5`; je to jediná výnimka mimo stupnice |
| položky vo vnútri karty | 12–16 |
| polia formulára medzi sebou | 20 |
| karty v gride | 16 mobil · 24 desktop (admin: 16 všade) |
| bloky na stránke (sekcia ↔ sekcia v appke) | 32 mobil · 48 desktop |
| sekcie landingu (padding-y) | 64 mobil · 96 desktop · 128 hero |
| nadpis stránky ↔ obsah | 24 (appka), 20 (admin) |

### 3.2 Vnútorný padding komponentov

| Komponent | Appka / landing | Admin (kompaktné) |
| --- | --- | --- |
| Karta / panel | 20 mobil · 24 desktop | 16 |
| Modal | 24 · (32 na ≥ md) | 24 |
| Tlačidlo md | 16 horizontálne | 12 |
| Bunka tabuľky | 16 × 12 | 12 × 8 |
| Alert / banner | 16 | 12 × 16 |

### 3.3 Výšky ovládacích prvkov

| Veľkosť | Výška | Použitie |
| --- | --- | --- |
| `sm` | 32 | tabuľky, filtre v admine, inline akcie |
| `md` | 40 | default všade |
| `lg` | 48 | hero CTA, hlavná akcia na mobile, auth formulár |

Dotykový cieľ na mobile **min. 44 × 44** (aj keď je vizuál menší, rozšír hit area).

---

## 4. Zaoblenia (radius)

| Token | px | Na čo |
| --- | --- | --- |
| `rounded-xs` | 4 | checkbox, progress track, blaze značka, kód inline |
| `rounded-control` | 10 | tlačidlá, inputy, select, tabs, položky menu, dropdown |
| `rounded-card` | 16 | karty, panely, tabuľky (obal), obrázky, alerty, toasty |
| `rounded-dialog` | 24 | modal, bottom sheet, hero panel, CTA pás, feature blok |
| `rounded-pill` | ∞ | badge, chip, avatar, switch, stepper bodky |

Pravidlá:
- **Vnorený rádius = vonkajší − padding.** Obrázok vnútri karty s paddingom
  16 → obrázok bez rádiusu, alebo ak je „na hranu“ (full-bleed v karte), dostane
  len horné rohy `rounded-t-card`.
- Nemiešaj: v jednej skupine prvkov je jeden rádius.
- Žiadne iné hodnoty. Žiadne `rounded-lg`, `rounded-2xl` z Tailwind defaultu.

---

## 5. Okraje, tiene, vrstvy

- **Karta = 1 px `border` + `surface`, bez tieňa.** Tieň len keď prvok „pláva“.
- `shadow-1` — hover interaktívnej karty (spolu s `border-strong`), sticky header po scrolle.
- `shadow-2` — dropdown, popover, toast.
- `shadow-3` — modal, bottom sheet.
- V tmavom režime tiene takmer nevidno → plávajúce prvky majú navyše `border`.
- Deliace čiary: `border-t border-border`. Nikdy dvojité čiary (karta v karte s okrajom).
- Z-index len z tokenov: sticky 10 · nav 20 · dropdown 30 · overlay 40 · modal 50 · toast 60 · tooltip 70.

---

## 6. Layout a gridy

### 6.1 Breakpointy
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Mobile-first: základné
štýly sú pre mobil, rozširuj cez `md:` / `lg:`.

### 6.2 Kontajnery a gutter

| Kontext | Max šírka | Bočný gutter |
| --- | --- | --- |
| Landing, legal | 1200 | 16 · 24 (md) · 32 (lg) |
| Zákaznícka appka (obsah) | 1120 | 16 · 24 · 32 |
| Admin (obsah) | 1440 | 16 · 24 |
| Dlhý text (legal, popis questu) | 640 | — |

### 6.3 Grid
- **12 stĺpcov**, gap 16 (mobil) / 24 (≥ lg). Admin gap 16.
- Na mobile všetko 1 stĺpec, výnimka: štatistiky 2 stĺpce.

### 6.4 Vzory blokov (používaj tieto, nevymýšľaj nové)

| Vzor | Mobil | md | lg+ | Kde |
| --- | --- | --- | --- | --- |
| **Stat row** (KPI dlaždice) | 2 | 2 | 4 | dashboard, admin dashboard, revenue, profil |
| **Card grid** (quest karty, nálepky) | 1 | 2 | 3 (xl: 4 pre nálepky) | `/quests`, `/stickers`, admin quests |
| **Auto grid** | `grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` — jediný povolený arbitrary pattern | | | zoznamy kariet s neznámym počtom |
| **Detail 8 / 4** | stack | stack | 8 obsah + 4 bočný panel | detail questu, detail používateľa, detail lokality |
| **Settings** | stack, nav ako select/tabs | stack | 220 nav + formulár max 640 | `/settings/*`, admin staff |
| **Main + rail** | stack (rail pod obsahom) | stack | obsah + rail 320 (od xl) | dashboard (`@rail`), admin review (`@rail`) |
| **Split auth** | 1 stĺpec | 1 | 2× 6/6 (formulár + obrázok) | login, signup, invite |
| **Table page** | karty namiesto tabuľky | tabuľka | tabuľka + filter bar | admin users, submissions, audit log |

### 6.5 Shelly

**Landing (`/`, `/legal/*`)**
- Top nav 64 px, sticky, `bg/80 + backdrop-blur` po scrolle + `border-b`.
- Logo vľavo · odkazy v strede (≥ md) · „Prihlásiť“ ghost + „Začať“ primary vpravo.
- Mobil: hamburger → celoobrazovkový sheet.
- Footer: 4 stĺpce (≥ md) / stack, `surface-sunken`, text `muted`.
- Sekcie striedajú `bg` a `surface`; max 1 farebný pás (`surface-inverse` alebo `primary`) na stránku — záverečné CTA.

**Zákaznícka appka (`(app)/*`)**
- **≥ lg:** ľavý sidebar 248 px (`surface`, `border-r`), sticky, výška 100vh.
  Hore logo, potom `memberNav`, dole `memberFootNav` (Nastavenia + plán) a user menu.
- **< lg:** top bar 56 px (logo, notifikácie, avatar) + **spodný tab bar 64 px**
  s 5 položkami: Prehľad · Questy · Rebríček · Nálepky · Viac (sheet so zvyškom).
  Obsah má `padding-bottom` = tab bar + safe area.
- Aktívna položka: `bg-primary-soft text-primary-soft-fg`, font 600, ikona plná.
- Badge počtu (napr. čakajúce submissions): pill `bg-accent text-accent-fg`, `caption`, tabular.
- Nadpis stránky: `h1` + voliteľný popis `muted` + akcie vpravo (na mobile pod nadpisom, full-width).

**Admin (`/admin/*`)**
- Rovnaká štruktúra ako appka, ale **hustejšia a pracovná**:
  sidebar 232 px na `surface-sunken`, top bar 56 px s breadcrumbom,
  prepínačom „Späť do appky“ a **role badge** (Reader/Writer/Admin/Owner).
- Obsah fluid do 1440. Tabuľky `sm` riadky (44 px, kompakt 36).
- Admin má vždy vizuálny signál, že si v paneli: úzky 3 px pruh `accent`
  úplne hore v top bare. Nič iné sa nemení (farby, fonty, komponenty rovnaké).
- Na mobile: sidebar ako drawer (hamburger v top bare), žiadny tab bar.
- Tabuľky na mobile sa menia na zoznam kariet (1 riadok = 1 karta).

---

## 7. Komponenty

Všetky zdieľané komponenty žijú v **`src/components/ui/`** (primitívy) a
**`src/components/domain/`** (quest, sticker, leaderboard…). Varianty cez
`cva`, triedy spájaj cez `cn()` z `src/lib/utils.ts`. Interaktívne primitívy
stavaj na Radix (už v `package.json`). Ikony **len `lucide-react`**.

Každý interaktívny prvok má stavy: default · hover · active (pressed) ·
focus-visible · disabled · loading (kde dáva zmysel).

### 7.1 Button
| Variant | Vzhľad | Kedy |
| --- | --- | --- |
| `primary` | `bg-primary text-primary-fg`, hover `primary-hover` | hlavná akcia (1× na blok) |
| `accent` | `bg-accent text-accent-fg` | len „Vygeneruj quest“ / hero CTA / upgrade plánu |
| `secondary` | `bg-surface border border-border-strong text-text`, hover `bg-surface-sunken` | vedľajšie akcie |
| `ghost` | bez pozadia, hover `bg-surface-sunken` | toolbar, zrušiť, ikonové |
| `danger` | `bg-danger text-white` | nevratné akcie (vždy za potvrdením) |
| `link` | text `primary`, podčiarknutie na hover | inline |

- Veľkosti `sm 32 · md 40 · lg 48`, rádius `control`, font `body-sm` 600 (lg: `body` 600).
- Ikona 16 px (lg: 20), gap 8. Ikonové tlačidlo = štvorec danej výšky + `aria-label`.
- Loading: spinner nahradí ikonu, šírka sa nemení, `aria-busy`.
- Pressed: `scale-[0.98]` 120 ms (jediný povolený arbitrary transform).
- Poradie v pätičke formulára/modalu: **sekundárne vľavo, primárne vpravo**; na mobile full-width stack, primárne hore.

### 7.2 Formuláre
- Label **nad** poľom (`body-sm` 500, `text`), helper pod ním (`caption`, `subtle`),
  chyba nahradí helper (`caption`, `danger`, ikona `AlertCircle`).
- Input/select/textarea: výška 40 (mobil 44), `rounded-control`, `bg-surface`,
  `border border-border-strong`, placeholder `subtle`; hover `border-text/40`;
  focus: ring; error: `border-danger`; disabled: `bg-surface-sunken text-subtle`.
- Povinné pole: bez hviezdičky — voliteľné sa označí „(voliteľné)“.
- Checkbox 18 px `rounded-xs`, switch 36×20 `rounded-pill`, radio 18 px kruh; checked = `primary`.
- Výber z enumov (difficulty, time, transport, style, ternary v onboardingu/preferenciách)
  = **segmented chips** (pill, `primary-soft` keď vybrané), nie select, ak je ≤ 5 možností.
- Validácia pri odoslaní a potom živo; nikdy nemaž vyplnené hodnoty.

### 7.3 Card
- `bg-surface border border-border rounded-card p-5 md:p-6` (admin `p-4`).
- Anatómia: [media] → hlavička (`h3`/`h4` + meta) → obsah → pätička (akcie, `border-t` voliteľne).
- Klikateľná karta: celá plocha je jeden odkaz, hover `border-border-strong shadow-1`,
  bez posunu/zväčšenia.

### 7.4 Quest card (doménový)
```
┌──────────────────────────────┐
│  [foto 16:9, rounded-t-card]  │  ← badge vľavo hore: Týždenný/Mesačný (accent-soft)
│                         ♡    │  ← uložiť (ghost icon, na foto s bielym pozadím)
├──────────────────────────────┤
│ ▌▌▌ Stredná · Nízke Tatry     │  ← DifficultyBlaze + label · región (caption, muted)
│ Titul questu (h4, 2 riadky)   │
│ ↔ 12,4 km  ▲ 820 m  ◷ 4 h 30  │  ← meta row, ikony 16, body-sm, tabular
├──────────────────────────────┤
│ stav / CTA                    │  ← pill statusu alebo tlačidlo
└──────────────────────────────┘
```
- Foto vždy s fallbackom (generovaný hrebeň z `images.ts`), nikdy prázdna sivá.
- Titul max 2 riadky (`line-clamp-2`).

### 7.5 Badge / chip / status
- Pill, výška 24 (sm 20), `caption` 500, padding 8–10, ikona 12–14.
- Stav submission: `PENDING` → warning-soft + `Clock` · `APPROVED` → success-soft + `Check` · `REJECTED` → danger-soft + `X`.
- Predplatné: `ACTIVE/TRIALING` success · `PAST_DUE/INCOMPLETE` warning · `PAUSED/CANCELED` neutrálny (`surface-sunken`, `muted`).
- Plán: `FREE` neutrálny · `EXPLORER` primary-soft · `ULTRA` accent-soft.
- Rola: `USER` bez badge · `READER/WRITER` neutrálny · `ADMIN` info-soft · `OWNER` accent-soft.

### 7.6 Tabuľka (admin)
- Obal `rounded-card border bg-surface overflow-hidden`; hlavička `surface-sunken`,
  `overline` `muted`; riadky `body-sm`, oddelené `border-t`, hover `bg-surface-sunken/60`.
- Čísla zarovnané vpravo, `tabular-nums`. Akcie riadku vpravo (ghost icon + menu `⋯`).
- Nad tabuľkou filter bar: vyhľadávanie vľavo, filtre (chips/select `sm`), akcie vpravo.
- Prázdna tabuľka → Empty state vnútri obalu. Stránkovanie dole vpravo.

### 7.7 Tabs, segmented, nav
- Tabs: podčiarknutie 2 px `primary` pod aktívnou, text aktívnej `text` 600, ostatné `muted`.
- Segmented control (prepínač rozsahu, napr. týždeň/mesiac): `surface-sunken` koľajnica,
  aktívny segment `surface` + `shadow-1`, `rounded-control`.

### 7.8 Modal, sheet, dropdown, tooltip
- Modal: `rounded-dialog`, `shadow-3`, `bg-surface`, overlay `overlay`.
  Šírky: `sm 440` (potvrdenie) · `md 560` (formulár) · `lg 720` (detail, review).
  Hlavička `h3` + zatváracie `X` vpravo; pätička podľa 7.1. Esc a klik na overlay zatvára
  (okrem rozpracovaného formulára → potvrdenie).
- Na mobile (< md) je modal **bottom sheet** s úchytom, `rounded-t-dialog`.
- Dropdown/popover: `surface-raised`, `rounded-control`, `shadow-2`, `border`, položky 36 px.
- Tooltip: `surface-inverse`, `text-inverse`, `caption`, `rounded-xs`, max 240 px; len doplnkové info.

### 7.9 Feedback
- **Toast**: vpravo dole (desktop) / hore na stred (mobil), `rounded-card`, `shadow-2`,
  ikona podľa typu, max 3 naraz, 5 s (chyba ostáva do zavretia).
- **Alert/banner**: `*-soft` pozadie, ikona + nadpis `body-sm 600` + text, `rounded-card`.
- **Empty state**: ikona 40 v kruhu `surface-sunken` 72 px, `h3`, 1 veta `muted`, max 1 CTA. Centrované, `py-12`.
- **Loading**: skeletony (`surface-sunken`, `rounded` podľa cieľa, jemný pulse) — nie spinnery na celú stránku.
- **Error page**: rovnaký layout ako empty state + tlačidlo „Skúsiť znova“.
- **Potvrdenie deštrukcie**: modal `sm`, nadpis otázka, text čo presne zmizne, `danger` tlačidlo s konkrétnym slovesom („Zmazať quest“).

### 7.10 Avatar, nálepky, rebríček
- Avatar: kruh, veľkosti 24 · 32 · 40 · 64 · 96; bez fotky = iniciály na `wash` profilovej farby, text `ink`.
- Nálepka (sticker): 1:1, kruh alebo die-cut, biely 4 px „rez“ okraj + `shadow-1`; nezískaná = grayscale + 40 % opacity + zámok.
- Rebríček: top 3 s medailovou farbou (kruh 28 px s číslom), ostatné poradie `muted tabular`. Vlastný riadok zvýraznený `primary-soft`.
- Activity grid (heatmapa dní): štvorce 12 px, `rounded-xs`, gap 3 → škála `surface-sunken` → pine-200 → pine-400 → pine-600.

### 7.11 Ikony
- `lucide-react`, stroke **1.75**, veľkosti **16** (v texte, tlačidlách sm/md) · **20** (navigácia, lg) · **24** (empty, hero features).
- Farba = `currentColor`. Ikona nikdy nie je jediný nosič významu bez `aria-label`.

### 7.12 Obrázky
- Pomery: karty 16:9 · hero 3:2 alebo 21:9 · profil cover 3:1 · avatar/nálepka 1:1.
- Text cez fotku len s gradientom `from-black/60 to-transparent` a bielym textom.
- `next/image`, vždy `alt`, vždy definovaný pomer (žiadny layout shift).

---

## 8. Pohyb

| Token | Hodnota | Použitie |
| --- | --- | --- |
| `duration-fast` | 120 ms | hover, pressed, farba |
| `duration-base` | 200 ms | dropdown, tabs, toast, accordion |
| `duration-slow` | 320 ms | modal, sheet, prechod stránky |
| `ease-standard` | (0.2, 0, 0, 1) | väčšina |
| `ease-enter` / `ease-exit` | — | príchod / odchod prvku |

- Animuj len `opacity` a `transform`.
- **Oslava** (animejs, konfety, count-up) len pri: schválení submission, novej nálepke/achievemente, medaile. Nikde inde.
- Landing: jemné reveal-on-scroll (fade + 16 px posun), raz, nie parallax.
- `prefers-reduced-motion` → trvania 0, žiadne oslavy okrem statickej zmeny.

---

## 9. Obsah a hlas

- Tón: priateľský sprievodca, stručný, konkrétny. „Tvoj ďalší quest je pripravený“, nie „Operácia prebehla úspešne“.
- Tlačidlá = sloveso + objekt („Odoslať dôkaz“, „Uložiť zmeny“), nie „OK“ / „Áno“.
- Všetky texty cez `src/lib/i18n` (sk/en/de), čísla, dátumy a jednotky cez `format.ts` a `Units`.
- Chybová hláška = čo sa stalo + čo s tým spraviť.

---

## 10. Prístupnosť (checklist)

- Kontrast textu ≥ 4.5 : 1, veľký text a UI prvky ≥ 3 : 1 (tokeny to spĺňajú — nemeň ich bez prepočtu).
- Focus: `focus-visible:outline-none focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-bg` — na **každom** interaktívnom prvku.
- Celé UI ovládateľné klávesnicou; modaly držia fokus (Radix).
- Sémantické HTML: `button` pre akcie, `a` pre navigáciu, `nav`, `main`, `header`, landmarks.
- Formuláre: `label` prepojený s poľom, chyby cez `aria-describedby`.
- Obrázky `alt`, dekoratívne `alt=""`.

---

## 11. Implementačné pravidlá (pre kód)

1. Tokeny importuj z `design/tokens.css` v `src/app/globals.css`. Iné `:root` farby nevznikajú.
2. **Zakázané v komponentoch:** hex/rgb, surová paleta (`pine-600`), Tailwind default farby
   (`gray-*`, `green-*`…), arbitrary hodnoty (`[13px]`), inline `style` pre farby/medzery,
   default rádiusy (`rounded-lg`, `rounded-xl`, `rounded-2xl`).
   Výnimky sú vymenované v tomto súbore (auto grid, pressed scale, profilové/doménové farby cez mapu).
3. Jeden vzor = jeden komponent. Pred vytvorením nového skontroluj `src/components/ui` a `domain`.
4. Varianty cez `cva`, nie podmienené reťazce tried rozhádzané po stránkach.
5. Tmavý režim sa rieši tokenmi — komponent nikdy nepoužíva `dark:` s vlastnou farbou.
6. Stránka = shell + `PageHeader` + bloky zo sekcie 6.4. Nie ručne skladaný layout.

### Kontrola pred dokončením každej UI úlohy
- [ ] Iba sémantické tokeny, žiadne hexy ani arbitrary hodnoty
- [ ] Medzery zo stupnice, rádius zo sekcie 4
- [ ] Max 1 primárne tlačidlo na blok, max 1 accent prvok na obrazovku
- [ ] Funguje na 360 px, 768 px, 1280 px; žiadny horizontálny scroll
- [ ] Svetlý aj tmavý režim
- [ ] Nemecký (dlhší) text nerozbije layout
- [ ] Focus viditeľný, ovládanie klávesnicou, stav nie len farbou
- [ ] Prázdny, načítavací a chybový stav existujú

---

## 12. Mapa obrazoviek → vzory

| Obrazovka | Layout (6.4) | Kľúčové komponenty |
| --- | --- | --- |
| `/` landing | sekcie 1200 | hero (display-xl + accent CTA), ako to funguje (3 kroky, card grid), ukážka questu, plány (3 karty, stredná zvýraznená `border-primary`), FAQ (accordion), CTA pás |
| `/login`, `/signup`, `/invite/[token]` | split auth | formulár max 400, `lg` inputy/tlačidlo |
| `/onboarding` | centrovaný stĺpec 560, stepper | segmented chips, progress |
| `/dashboard` | main + rail | aktuálny quest (hero karta, `rounded-dialog`), stat row, activity grid, nudge banner |
| `/monthly` | detail 8/4 | mesačný quest, countdown, stav nálepky/obálky |
| `/quests` | filter bar + card grid | quest card, filtre (difficulty chips, cadence) |
| `/quests/[id]` | detail 8/4 | hero foto, meta, mapa (rounded-card), bočný panel s CTA |
| `/quests/[id]/proof` | stĺpec 640 | upload, formulár, sticky submit na mobile |
| `/submissions` | zoznam kariet / tabuľka | status badge |
| `/leaderboard` | tabs (týždeň/mesiac) + tabuľka | medaily, vlastný riadok |
| `/stickers` | card grid (xl 4) | sticker |
| `/people`, `/people/[handle]`, groups | card grid / profil s cover | avatar, profilová farba |
| `/settings/*` | settings | formuláre, danger zóna (karta s `border-danger`) |
| `/admin` | stat row + 8/4 | KPI, „čaká na rozhodnutie“ zoznam |
| `/admin/review` | main + rail | review deck (modal `lg` / karta), approve=primary, reject=danger-ghost |
| `/admin/quests`, `/locations`, `/users` | table page | tabuľka, filter bar, detail 8/4 |
| `/admin/schedule` | kalendár týždňov/mesiacov | sloty ako karty, accent-soft pre obsadené featured |
| `/admin/revenue`, `/systems`, `/database` | stat row + grafy/tabuľky | chart paleta |
| `/admin/staff`, `/access` | settings | matica rolí (tabuľka s check ikonami) |
