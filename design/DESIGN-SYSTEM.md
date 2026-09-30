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

1. **Mesačný quest je srdce produktu.** Celý web sa točí okolo neho. Na landingu,
   dashboarde aj v navigácii je vždy prvý a najväčší. Všetko ostatné (týždenné
   questy, katalóg, rebríčky, nálepky) je podporné.
2. **Hravý, svieži, svetlý.** Svetlé mätové pozadie, šťavnatá zelená (Meadow),
   oranžová (Sunset) pre mesačný quest, slnečná žltá pre jeho blok a hravé
   doplnkové farby (sky, berry, lake, lilac). Nikdy ťažké tmavé plochy.
3. **Plné farby, žiadne gradienty.** Žiadne prechody farieb na pozadiach,
   tlačidlách, fotkách ani textoch. Výnimka len keď ju výslovne schváli majiteľ
   produktu a zapíše sa sem.
4. **Hodnoty z terénu.** Pri každom queste je turistická značka (farba KST),
   obtiažnosť, dĺžka, prevýšenie a čas. Sú to fakty, ktoré človek v teréne
   naozaj potrebuje, takže sú vždy vidieť a vždy na tom istom mieste.
5. **Jeden produkt, jeden hlas.** Landing, appka aj admin používajú tie isté
   tokeny, fonty, rádiusy a komponenty. Líšia sa len **hustotou**.
6. **Tri jazyky (SK / EN / DE).** Každý layout musí zniesť o **40 % dlhší text**
   (nemčina). Nikdy nefixuj šírku tlačidla alebo štítku podľa anglického textu.
7. **Prístupnosť nie je voliteľná.** WCAG 2.2 AA, ovládanie klávesnicou,
   `prefers-reduced-motion`, svetlý aj tmavý režim.

---

## 1. Farby

### 1.1 Pravidlo č. 1
V komponentoch **nikdy** nepíš hex, `rgb()`, ani surovú paletu (`meadow-600`,
`moss-200`). Používaj **len sémantické tokeny** (`bg-surface`, `text-muted`,
`bg-primary`…). Surová paleta je len pre `tokens.css` a doménové mapy
(obtiažnosť, značky, medaily, profilové farby, grafy, tagy).

### 1.2 Paleta (raw)

| Rodina | Úloha | Kľúčové odtiene |
| --- | --- | --- |
| **Moss** | neutrály so sviežim zeleným nádychom | 50 `#f4f8f1` · 200 `#d5e0cf` · 600 `#4a5a4f` · 950 `#16241c` |
| **Meadow** | značka, primárne akcie, aktívny stav | 50 `#e3f4e8` · 500 `#22a360` · 600 `#157a47` · 700 `#0f6639` |
| **Sunset** | akcent = **mesačný quest** | 50 `#ffe9df` · 500 `#ff6a3d` · 600 `#f2572a` · 700 `#a63a12` |
| **Sun** | plocha bloku mesačného questu | `#ffd35c` · soft `#fff3c9` |
| **Hravé doplnky** | tagy, nálepky, ilustrácie | sky `#4fb3f6` · berry `#f0508c` · lake `#1fb5a6` · lilac `#9b7bea` |

### 1.3 Sémantické tokeny (svetlý / tmavý)

Tmavý režim je **mäkký „večer v doline“** (tmavá zeleno-bridlicová), nikdy
takmer čierny. Svetlý režim je predvolený a hlavný.

| Token | Použitie | Light | Dark |
| --- | --- | --- | --- |
| `bg` | pozadie stránky | `#f4f8f1` | `#1f2a26` |
| `surface` | karty, panely, tabuľky, modaly | `#ffffff` | `#27352f` |
| `surface-sunken` | vnorené plochy, sidebar adminu, skeleton | `#e9f0e4` | `#1a2420` |
| `surface-raised` | dropdown, popover | `#ffffff` | `#2f3f38` |
| `surface-inverse` | tooltip | `#16241c` | `#f4f8f1` |
| `border` | 1 px okraje a deliace čiary | `#d5e0cf` | `#3a4b43` |
| `border-strong` | hover okraj, okraj inputu | `#b3c2ab` | `#4e6258` |
| `text` | hlavný text, nadpisy | `#16241c` | `#f1f6ef` |
| `muted` | sekundárny text | `#4a5a4f` | `#b9c7bd` |
| `subtle` | placeholder, metadáta | `#5e6e62` | `#98a89d` |
| `primary` (+`-hover`, `-fg`) | primárne tlačidlo, odkaz, aktívna položka | `#157a47` / biely text | `#5fd394` / tmavý text |
| `primary-soft` (+`-fg`) | aktívna položka menu, vybraný chip | `#e3f4e8` | `#1d4a33` |
| `accent` (+`-hover`, `-fg`) | **len mesačný quest**: jeho CTA, badge, odpočet | `#ff6a3d` / tmavý text | `#ff7d52` / tmavý text |
| `accent-soft` (+`-fg`) | pozadie badge „Mesačný“ | `#ffe9df` | `#5a2a17` |
| `feature` (+`-fg`) | plocha bloku mesačného questu | `#ffd35c` / tmavý text | rovnaké |
| `success` / `warning` / `danger` / `info` (+`-soft`) | stavy | viď `tokens.css` | viď `tokens.css` |
| `ring` | focus ring | `#22a360` | `#8fe0b0` |

Všetky páry text/pozadie sú overené na **≥ 4.5 : 1**.

### 1.4 Pravidlá použitia farieb
- **Primary (Meadow)** = jedno hlavné tlačidlo na blok. Nikdy dve primárne vedľa seba.
- **Accent (Sunset) a feature (Sun) patria mesačnému questu.** Nič iné ich nepoužíva:
  ani bežné tlačidlá, ani nadpisy, ani menu. Keď človek vidí oranžovú alebo žltú plochu, vie, že ide o mesačný quest.
- **Týždenný quest** má vlastnú, tichšiu farbu: `sky` (badge `sky-soft` / `sky-fg`).
- **Hravé doplnky** (sky, berry, lake, lilac) sú na tagy kategórií (vodopád, hrad,
  jaskyňa, vyhliadka…), nálepky a drobné ilustrácie. Vždy ako `*-soft` pozadie
  s `*-fg` textom. Nie na veľké plochy.
- **Stav nikdy len farbou.** Každý status = ikona + text + farba.
- **Žiadne gradienty.** Ani `linear-gradient`, ani `radial-gradient`, ani
  priesvitný prechod cez fotku. Plné farby a plné, polopriehľadné plochy (`/80`) áno.

### 1.5 Doménové farby

**Turistická značka (KST) — nové pole pri každom queste.** Značka hovorí, po čom
ide človek v teréne. Zobrazuje ju vždy komponent `<TrailMarks>`.

| Farba | Token | Hex |
| --- | --- | --- |
| červená | `mark-red` | `#d52b1e` |
| modrá | `mark-blue` | `#0063b1` |
| zelená | `mark-green` | `#00913f` |
| žltá | `mark-yellow` | `#ffd500` |

- Tvar **pásová značka**: biela–farba–biela vodorovne, 24 × 16 px, `rounded-xs`,
  1 px okraj `border-strong` (aby biela nezanikla na bielom pozadí).
- Tvar **náučný chodník**: biely štvorec 16 × 16 so zelenou uhlopriečkou.
- Trasa môže meniť značku: zobraz poradie `▬ → ▬` (max 3, potom „+2“) a
  pri detaile aj úsek: „červená 4,2 km → modrá 8,2 km“.
- Vždy s textom („Červená“), farby značiek sa nesmú použiť na nič iné.
- Dátový model: pole značiek na queste (poradie + farba + typ + km úseku) ešte
  neexistuje, treba ho pridať do `Quest` pred prestavbou kariet.

**Obtiažnosť (enum `Difficulty`) — merač vrcholov.** Obtiažnosť sa **nesmie** vizuálne
podobať na značku. Komponent `<DifficultyMeter>`: 4 malé trojuholníky (vrcholy)
14 × 12 px, gap 2; vyplnených je toľko, aká je úroveň, zvyšok má len obrys
`border-strong`. Vedľa label v `text` (nie vo farbe obtiažnosti).

| Hodnota | Vrcholy | Token | Farba | Label SK |
| --- | --- | --- | --- | --- |
| `EASY` | ▲△△△ | `diff-easy` | `#2fb36b` mätová | Pohodová |
| `MODERATE` | ▲▲△△ | `diff-moderate` | `#f5b82e` slnečná | Stredná |
| `HARD` | ▲▲▲△ | `diff-hard` | `#ff7a3d` oranžová | Náročná |
| `EXPERT` | ▲▲▲▲ | `diff-expert` | `#e0457b` malinová | Expert |

**Medaily (`Medal`):** `medal-gold #e8b92e`, `medal-silver #a7b1bb`, `medal-bronze #c7824a`.

**Profilové farby (`ProfileAccent`)** — 7 farieb, každá so 4 odtieňmi. Len na profile,
avatare a skupine daného človeka.

| Accent | ink | deep | wash | edge |
| --- | --- | --- | --- | --- |
| PINE | `#0f6639` | `#1d4a33` | `#e3f4e8` | `#c6ead2` |
| MOSS | `#4a6a2a` | `#3a5520` | `#eef3e4` | `#d6e2c2` |
| STONE | `#4a5a4f` | `#33423a` | `#e9f0e4` | `#d5e0cf` |
| WATER | `#0b5e96` | `#0a4a76` | `#e1f2fd` | `#bfe2fa` |
| CLAY | `#a63a12` | `#80300f` | `#ffe9df` | `#ffc2a8` |
| DUSK | `#5b3fb0` | `#47318a` | `#eee8fc` | `#d6cbf7` |
| SIGNAL | `#b0245c` | `#8c1c49` | `#fde6ef` | `#f8c3d8` |

**Grafy:** fixné poradie `chart-1 … chart-6` (meadow, sunset, sky, lilac, sun, berry).
Jedna séria = `chart-1`. Mriežka `border`, popisky `subtle` `caption`. Plochy grafov plnou farbou s opacity, nie gradientom.

---

## 2. Typografia

### 2.1 Fonty (všetky s `latin-ext`)

| Rola | Font | Kde |
| --- | --- | --- |
| **Display** | Bricolage Grotesque 600/700/800 | `display-*`, `h1`, `h2`, veľké čísla |
| **Sans** | Inter 400/500/600 | všetko ostatné vrátane `h3`, `h4` |
| **Mono** | JetBrains Mono 400/500 | len kódy: slot key `2026-W34`, ID, logy |

Admin používa tie isté fonty.

### 2.2 Stupnica

| Token | Veľkosť / riadok | Font · váha | Použitie |
| --- | --- | --- | --- |
| `display-xl` | 40→64 fluid / 1.05 | Display 800, −0.03em | hero landingu, názov mesačného questu v hero |
| `display` | 32→44 fluid / 1.1 | Display 700 | nadpisy sekcií landingu, názov mesačného questu v appke |
| `h1` | 32 / 38 | Display 700 | nadpis stránky (1× na stránku) |
| `h2` | 24 / 30 | Display 700 | sekcia na stránke |
| `h3` | 20 / 28 | Inter 600 | nadpis karty/panelu |
| `h4` | 18 / 24 | Inter 600 | titul quest karty |
| `body-lg` | 18 / 28 | Inter 400 | úvodný odsek |
| `body` | 16 / 24 | Inter 400 | default |
| `body-sm` | 14 / 20 | Inter 400/500 | UI, tabuľky, formuláre |
| `caption` | 13 / 18 | Inter 400/500 | metadáta, helper, labely štatistík |
| `overline` | 12 / 16, +0.06em, UPPERCASE | Inter 600 | eyebrow, hlavičky stĺpcov |

### 2.3 Pravidlá
- Jeden `h1` na stránku, úrovne sa nepreskakujú. Text max **65ch**.
- Čísla v štatistikách a tabuľkách `tabular-nums`, číslo tučne (600), jednotka normálne.
- VEĽKÉ písmená len `overline`. Odkazy v texte `text-primary underline underline-offset-2`.

---

## 3. Medzery a rozmery

**Základ 4 px.** Povolené hodnoty:

| px | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96 | 128 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TW | 0.5 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 |

**Žiadne arbitrary hodnoty** (`p-[13px]`). Jediná výnimka mimo stupnice: `gap-1.5` (6 px) medzi labelom, inputom a helperom.

| Vzťah | Hodnota |
| --- | --- |
| ikona ↔ text | 8 |
| položky vo vnútri karty | 12 |
| polia formulára | 20 |
| karty v gride | 16 mobil · 24 desktop (admin 16) |
| bloky na stránke v appke | 32 mobil · 48 desktop |
| sekcie landingu | 64 mobil · 96 desktop |
| nadpis stránky ↔ obsah | 24 (admin 20) |

| Komponent | Appka / landing | Admin |
| --- | --- | --- |
| Karta / panel | 20 | 16 |
| Blok mesačného questu | 24 mobil · 40 desktop | 24 |
| Modal | 24 (32 na ≥ md) | 24 |
| Bunka tabuľky | 16 × 12 | 12 × 8 |

Výšky ovládacích prvkov: `sm 32 · md 40 · lg 48`. Dotykový cieľ na mobile min. 44 × 44.

---

## 4. Zaoblenia

Hravejší, mäkší tvar.

| Token | px | Na čo |
| --- | --- | --- |
| `rounded-xs` | 4 | checkbox, značka, progress track |
| `rounded-control` | 12 | tlačidlá, inputy, select, tabs, položky menu |
| `rounded-card` | 20 | karty, panely, tabuľky, fotky, alerty, toasty |
| `rounded-dialog` | 28 | modal, sheet, **blok mesačného questu**, CTA pás |
| `rounded-pill` | ∞ | badge, chip, avatar, switch |

- Vnorený rádius = vonkajší − padding. Fotka vo vnútri karty s paddingom 8 má `rounded-[12px]` → použi `rounded-control`.
- Žiadne iné hodnoty, žiadne `rounded-lg` / `rounded-2xl`.

---

## 5. Okraje, tiene, vrstvy

- **Karta = 1 px `border` + `surface`, bez tieňa.** Tieň len keď prvok pláva alebo je hover.
- `shadow-1` hover karty, sticky header · `shadow-2` dropdown, toast · `shadow-3` modal.
- V tmavom režime majú plávajúce prvky navyše `border`.
- Z-index len z tokenov: sticky 10 · nav 20 · dropdown 30 · overlay 40 · modal 50 · toast 60 · tooltip 70.

---

## 6. Layout a gridy

### 6.1 Breakpointy
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`, mobile-first.

### 6.2 Kontajnery

| Kontext | Max šírka | Gutter |
| --- | --- | --- |
| Landing, legal | 1200 | 16 · 24 (md) · 32 (lg) |
| Appka | 1120 | 16 · 24 · 32 |
| Admin | 1440 | 16 · 24 |
| Dlhý text | 640 | — |

### 6.3 Grid
12 stĺpcov, gap 16 (mobil) / 24 (≥ lg), admin 16.

### 6.4 Vzory blokov

| Vzor | Mobil | md | lg+ | Kde |
| --- | --- | --- | --- | --- |
| **Monthly hero** | stack (fotka hore) | stack | 7 fotka + 5 obsah | landing, dashboard, `/monthly`, vrch `/quests` |
| **Stat row** | 2 | 2 | 4 | dashboard, admin, profil |
| **Quest grid** | 1 | 2 | 3 | `/quests`, admin quests |
| **Sticker grid** | 2 | 3 | 4 | `/stickers` |
| **Detail 8 / 4** | stack | stack | 8 + 4 | detail questu, používateľa, lokality |
| **Settings** | stack, nav ako tabs | stack | 220 nav + 640 formulár | `/settings/*`, admin staff |
| **Main + rail** | stack | stack | obsah + 320 rail (xl) | dashboard, admin review |
| **Split auth** | 1 | 1 | 6 / 6 | login, signup, invite |
| **Table page** | karty | tabuľka | tabuľka + filter bar | admin zoznamy |

Poradie na stránke je pevné: **mesačný quest → týždenný quest → ostatné**.
Quest grid nikdy neobsahuje mesačný quest ako bežnú kartu, ten má vždy vlastný Monthly hero nad gridom.

### 6.5 Shelly

**Landing (`/`, `/legal/*`)**
- Top nav 64 px, sticky, `bg/90` + `border-b` po scrolle. Logo · odkazy · „Prihlásiť“ ghost + „Začať“ primary.
- **Hero = aktuálny mesačný quest.** Názov, fotka, značka, obtiažnosť, odpočet do konca mesiaca a CTA „Pridaj sa k mesačnému questu“ (accent). Až pod ním vysvetlenie, ako to funguje.
- Sekcie striedajú `bg` a `surface`. Jeden farebný pás na stránku = blok `feature` (Sun).
- Footer `surface-sunken`.

**Zákaznícka appka (`(app)/*`)**
- **≥ lg:** ľavý sidebar 248 px (`surface`, `border-r`). Poradie navigácie:
  **Mesačný quest** (ikona s bodkou `accent`) · Prehľad · Questy · Rebríček · Nálepky · Dôkazy · Ľudia; dole Nastavenia + plán.
- **< lg:** top bar 56 px + spodný tab bar 64 px s 5 položkami:
  Prehľad · Questy · **Mesačný** (stredná, zväčšená, kruh `accent`) · Rebríček · Viac.
- Aktívna položka `bg-primary-soft text-primary-soft-fg` 600.
- Badge počtu: pill `bg-primary text-primary-fg` `caption` (accent je rezervovaný pre mesačný quest).

**Admin (`/admin/*`)**
- Rovnaká štruktúra, hustejšia: sidebar 232 px na `surface-sunken`, top bar 56 px s breadcrumbom, „Späť do appky“ a badge roly.
- Signál panelu: 4 px pás `primary` úplne hore. Nič iné sa nemení.
- Na mobile sidebar ako drawer, tabuľky sa menia na karty.
- Dashboard adminu začína stavom mesačného questu (je naplánovaný? koľko dôkazov čaká?).

---

## 7. Komponenty

Zdieľané komponenty: **`src/components/ui/`** (primitívy) a **`src/components/domain/`**
(quest, značka, obtiažnosť, sticker…). Varianty cez `cva`, triedy cez `cn()`,
interaktívne primitívy na Radix, ikony **len `lucide-react`**.
Stavy: default · hover · active · focus-visible · disabled · loading.

### 7.1 Button
| Variant | Vzhľad | Kedy |
| --- | --- | --- |
| `primary` | `bg-primary text-primary-fg` | hlavná akcia (1× na blok) |
| `monthly` | `bg-accent text-accent-fg` | **len** akcie mesačného questu |
| `secondary` | `bg-surface border border-border-strong` | vedľajšie akcie |
| `ghost` | bez pozadia, hover `bg-surface-sunken` | toolbar, zrušiť |
| `danger` | `bg-danger text-white` | nevratné akcie, vždy s potvrdením |
| `link` | text `primary` | inline |

Veľkosti `sm 32 · md 40 · lg 48`, `rounded-control`, `body-sm` 600. Ikona 16 (lg 20), gap 8.
Pressed `scale-[0.98]`. Poradie: sekundárne vľavo, primárne vpravo; na mobile stack, primárne hore.

### 7.2 Formuláre
- Label nad poľom (`body-sm` 500), helper pod ním (`caption` `subtle`), chyba nahradí helper (`danger` + ikona).
- Input 40 (mobil 44), `rounded-control`, `border-border-strong`; focus ring; error `border-danger`.
- Výber z ≤ 5 možností (onboarding, preferencie) = **segmented chips** (pill, vybraný `primary-soft` + okraj `primary`).

### 7.3 Card
`bg-surface border border-border rounded-card p-5` (admin `p-4`). Klikateľná karta = celá je odkaz,
hover `border-border-strong shadow-1`, bez posunu.

### 7.4 Quest card
Fotka je **vo vnútri** karty s 8 px okrajom, nie na hranu. Informácie sú v pevnom poradí a pevných riadkoch, aby sa karty v gride dali čítať pod sebou.

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │  foto 4:3, rounded-control, p-2 okolo
│ │ [Týždenný]              [♡] │ │  plné chipy (surface/90), nie gradient
│ └─────────────────────────────┘ │
│  ▬ ▬  Červená → Modrá            │  1 · TrailMarks + text (body-sm 500)
│  Hrebeňom z Tále na Chopok      │  2 · titul h4, max 2 riadky
│  Nízke Tatry · štart Tále        │  3 · región · nástupné miesto (caption muted)
│ ┌────────┬────────┬────────┐    │  4 · 3 štatistiky: číslo 600 + label caption
│ │12,4 km │ 820 m  │ 4 h 30 │    │     na surface-sunken, rounded-control
│ │dĺžka   │stúpanie│čas     │    │
│ └────────┴────────┴────────┘    │
│  ▲▲△△ Stredná       🚗 1 h 10    │  5 · DifficultyMeter vľavo · doprava vpravo
│  [vyhliadka] [hrebeň]            │  6 · max 2 tagy kategórií (hravé *-soft)
├─────────────────────────────────┤
│  stav / CTA                      │  7 · pätička: status pill alebo tlačidlo
└─────────────────────────────────┘
```
- Max **6 informácií** pod fotkou, nič navyše. Detail (bonus, popis, mapa, počasie) patrí na stránku questu.
- Chýbajúci údaj → riadok ostáva (napr. „—“), aby sa karty nerozchádzali.
- Karta nemá vlastný `min-height`; riadky v gride zarovnáva `grid-rows` subgrid alebo pevný počet riadkov.

### 7.5 Monthly hero (hlavný blok)
- Plocha `bg-feature text-feature-fg`, `rounded-dialog`, padding 24 / 40. Žiadny okraj, žiadny tieň, žiadny gradient.
- Layout 7 / 5: vľavo fotka (`rounded-card`, 4:3 alebo 16:10), vpravo obsah.
- Obsah: badge „Mesačný quest · Október“ (`bg-accent text-accent-fg`), názov `display`, 1–2 vety popisu,
  riadok značky + obtiažnosti, 4 štatistiky (dĺžka, stúpanie, čas, nálepka), odpočet do konca mesiaca (`tabular-nums`),
  CTA `monthly` `lg` + sekundárne „Detail trasy“.
- Po dokončení: namiesto CTA stav („Dôkaz čaká na schválenie“ / „Splnené, nálepka je na ceste“).
- Existuje len **jeden** na obrazovke.

### 7.6 Badge / chip / status
- Pill 24 (sm 20), `caption` 500, ikona 12–14.
- Obdobie: **Mesačný** `bg-accent text-accent-fg` · **Týždenný** `sky-soft` / `sky-fg`.
- Submission: `PENDING` warning-soft + `Clock` · `APPROVED` success-soft + `Check` · `REJECTED` danger-soft + `X`.
- Predplatné: `ACTIVE/TRIALING` success · `PAST_DUE/INCOMPLETE` warning · `PAUSED/CANCELED` neutrálny.
- Plán: `FREE` neutrálny · `EXPLORER` primary-soft · `ULTRA` lilac-soft.
- Rola: `READER/WRITER` neutrálny · `ADMIN` info-soft · `OWNER` lilac-soft.
- Tagy kategórií: vodopád `sky` · hrad/zrúcanina `lilac` · jaskyňa `moss` neutrál · vyhliadka/hrebeň `lake` · jazero `sky` · kvety/lúky `berry`.

### 7.7 Tabuľka (admin)
Obal `rounded-card border bg-surface`; hlavička `surface-sunken` `overline` `muted`; riadky `body-sm`, `border-t`,
hover `bg-surface-sunken/60`. Čísla vpravo `tabular-nums`. Filter bar nad tabuľkou. Na mobile karty.

### 7.8 Tabs, segmented, nav
Tabs: podčiarknutie 2 px `primary`. Segmented: koľajnica `surface-sunken`, aktívny segment `surface` + `shadow-1`.

### 7.9 Modal, sheet, dropdown, tooltip
- Modal `rounded-dialog` `shadow-3`, šírky 440 / 560 / 720, na mobile bottom sheet. Esc a overlay zatvárajú.
- Dropdown `surface-raised rounded-control shadow-2 border`, položky 36. Tooltip `surface-inverse` `caption`.

### 7.10 Feedback
- Toast vpravo dole / hore na mobile, `rounded-card shadow-2`, max 3, 5 s (chyba ostáva).
- Alert: `*-soft` pozadie, ikona, nadpis `body-sm 600`, `rounded-card`.
- Empty state: ikona v kruhu 72 px (`primary-soft`), `h3`, 1 veta, max 1 CTA.
- Loading: skeletony `surface-sunken`, nie spinnery na celú stránku.
- Deštruktívne potvrdenie: modal 440, `danger` tlačidlo s konkrétnym slovesom.

### 7.11 Avatar, nálepky, rebríček
- Avatar 24 · 32 · 40 · 64 · 96, bez fotky iniciály na `wash` profilovej farby.
- Nálepka 1:1, biely 6 px okraj + `shadow-1`, jemne natočená (−3° až 3°, stabilne podľa ID); nezískaná = obrys `border-strong` prerušovaný + zámok.
- Rebríček: top 3 kruh 28 px vo farbe medaily, vlastný riadok `primary-soft`.
- Activity grid: štvorce 12 px `rounded-xs`, škála `surface-sunken` → meadow 100 → 400 → 600.

### 7.12 Ikony
`lucide-react`, stroke 2, veľkosti 16 · 20 · 24, `currentColor`.

### 7.13 Fotky
- **Zdroj: Unsplash**, všetky cez `src/lib/images.ts`. Pred spustením nahradiť licencovanými.
- **Nikdy dve rovnaké fotky** v produkte: každý quest, lokalita a sekcia landingu má vlastné Unsplash ID.
  Pri pridávaní fotky skontroluj, že ID ešte v `images.ts` nie je. (Pozor: `1470071459604-3b5ec3a7fe05` je tam momentálne dvakrát — opraviť pri prestavbe.)
- Pomery: quest karta 4:3 · monthly hero 4:3 / 16:10 · detail 21:9 · avatar a nálepka 1:1.
- Text **nikdy** cez fotku. Chipy na fotke majú plné pozadie `surface/90`.
- Fallback pri chybe načítania: plná farba `surface-sunken` + ikona `Mountain` v `subtle`. Žiadny gradient.
- `next/image`, vždy `alt`, vždy definovaný pomer.

---

## 8. Pohyb

| Token | Hodnota | Použitie |
| --- | --- | --- |
| `duration-fast` | 120 ms | hover, pressed |
| `duration-base` | 200 ms | dropdown, tabs, toast |
| `duration-slow` | 320 ms | modal, sheet, stránka |

- Animuj len `opacity` a `transform`.
- Hravé momenty (konfety, poskočenie nálepky, count-up) len pri: splnení mesačného questu, schválení dôkazu, novej nálepke, medaile.
- `prefers-reduced-motion` → bez animácií.

---

## 9. Obsah a hlas

- Priateľský parťák na túru, stručný, konkrétny. „Tvoj októbrový quest čaká“, nie „Operácia prebehla úspešne“.
- Tlačidlá = sloveso + objekt („Odoslať dôkaz“). Texty cez `src/lib/i18n`, čísla a jednotky cez `format.ts`.

---

## 10. Prístupnosť

- Kontrast ≥ 4.5 : 1 (tokeny to spĺňajú, pri zmene prepočítaj).
- `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-bg` na každom interaktívnom prvku.
- Klávesnica, sémantické HTML, `label` pri poliach, `alt` pri fotkách.
- Značka a obtiažnosť majú vždy aj text, nikdy len farbu alebo tvar.

---

## 11. Implementačné pravidlá

1. Tokeny importuj z `design/tokens.css` v `src/app/globals.css`.
2. **Zakázané v komponentoch:** hex/rgb, surová paleta, Tailwind default farby (`gray-*`…),
   arbitrary hodnoty, inline `style` pre farby a medzery, default rádiusy, **akékoľvek gradienty**.
3. Jeden vzor = jeden komponent. Najprv hľadaj v `src/components/ui` a `domain`.
4. Varianty cez `cva`. Tmavý režim len cez tokeny, žiadne `dark:` s vlastnou farbou.
5. Stránka = shell + `PageHeader` + bloky zo sekcie 6.4.

### Checklist pred dokončením UI úlohy
- [ ] Iba sémantické tokeny, žiadne hexy, arbitrary hodnoty ani gradienty
- [ ] Medzery zo stupnice, rádius zo sekcie 4
- [ ] Mesačný quest je na obrazovke prvý (ak na nej je) a accent/feature nepoužíva nič iné
- [ ] Každý quest ukazuje značku, obtiažnosť, dĺžku, stúpanie, čas
- [ ] Žiadna fotka sa neopakuje
- [ ] 360 / 768 / 1280 px bez horizontálneho scrollu, svetlý aj tmavý režim, nemecký text
- [ ] Focus, klávesnica, stav nie len farbou
- [ ] Prázdny, načítavací a chybový stav

---

## 12. Mapa obrazoviek

| Obrazovka | Layout | Kľúčové komponenty |
| --- | --- | --- |
| `/` landing | sekcie 1200 | **Monthly hero** ako hero, ako to funguje, ukážka týždenných questov (quest grid), nálepky, plány, FAQ, CTA pás `feature` |
| `/login`, `/signup`, `/invite` | split auth | formulár max 400, vpravo fotka mesačného questu |
| `/onboarding` | stĺpec 560 | segmented chips, progress |
| `/dashboard` | main + rail | **Monthly hero** hore, potom týždenný quest, stat row, activity grid |
| `/monthly` | Monthly hero + detail 8/4 | trasa, značky po úsekoch, odpočet, stav nálepky a obálky |
| `/quests` | Monthly hero + filter bar + quest grid | quest card, filtre (obtiažnosť, značka, región, obdobie) |
| `/quests/[id]` | detail 8/4 | fotka 21:9, značky po úsekoch, meta, mapa, CTA v bočnom paneli |
| `/quests/[id]/proof` | stĺpec 640 | upload, sticky submit na mobile |
| `/submissions` | zoznam / tabuľka | status badge |
| `/leaderboard` | tabs (mesiac prvý) + tabuľka | medaily, vlastný riadok |
| `/stickers` | sticker grid | mesačné nálepky prvé |
| `/people`, profily, skupiny | quest grid / profil | avatar, profilová farba |
| `/settings/*` | settings | formuláre, danger zóna |
| `/admin` | stat row + 8/4 | stav mesačného questu hore, „čaká na rozhodnutie“ |
| `/admin/review` | main + rail | mesačné dôkazy prvé, approve primary, reject danger |
| `/admin/quests`, `/locations`, `/users` | table page | filter bar, detail 8/4, editor značiek |
| `/admin/schedule` | kalendár | mesačné sloty výrazne (`accent-soft`), týždenné `sky-soft` |
| `/admin/revenue`, `/systems`, `/database` | stat row + grafy/tabuľky | chart paleta |
| `/admin/staff`, `/access` | settings | matica rolí |
