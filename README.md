# STOPA

> Objavuj Slovensko. Zbieraj body.

Gamifikovaná webová aplikácia: každý pondelok nová výzva, dôkaz fotkou, admin
schválenie, body, odznaky, rebríček a odmeny.

Next.js 16 · TypeScript · Tailwind v4 · Prisma 7 · Postgres (Neon)

---

## Spustenie

```bash
npm install
cp .env.example .env        # DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:migrate
npm run db:seed             # výzvy + admin + traja hráči
npm run dev
```

Seed vytvorí `admin@stopa.app / StopaAdmin!2026` (rola ADMIN) a hráčov
`zuzka@ | marek@ | ivana@stopa.app / StopaHrac!2026`. `SEED_DEMO_USERS=false`
naseeduje len výzvy. Demo účty nikdy nepúšťaj do produkcie.

## Ako to funguje

```
pondelok 8:00        admin zverejní výzvu (WeeklyQuest)
      ↓
hráč vyjde von       fotka + report (Submission, status PENDING)
      ↓
admin skontroluje    Approve/Reject + odkaz pre hráča
      ↓
schválené            +body → odznaky → rebríček → odmeny
```

Body sa pripisujú **iba pri schválení**, nikdy pri odoslaní — to je celý zmysel
review kroku a zároveň obrana proti vygenerovaným fotkám.

| Súbor | Za čo zodpovedá |
| --- | --- |
| `src/lib/gamification.ts` | Kategórie, škála náročnosti, odznaky, odmeny, pravidlá |
| `src/lib/stopa/data.ts` | Čítania: aktívna výzva, feed, rebríček, štatistiky, odznaky |
| `src/app/(app)/actions.ts` | Odoslanie dôkazu, reakcie, komentáre, súhlas s pravidlami |
| `src/app/(app)/admin/actions.ts` | Review a tvorba výziev |

Prahy odznakov a odmien sú v kóde, nie v databáze — dajú sa ladiť pull requestom
namiesto migrácie. `UserAchievement` drží len to, *že* niekto odznak získal.

## Bezpečnosť

- **Roly.** `requireAdmin()` na serveri pri každom admin requeste; Admin tab sa
  nezobrazí ani nefunguje pre bežný účet.
- **Iba schválené je verejné.** Feed, komunitná náročnosť aj rebríček filtrujú na
  `APPROVED` — čakajúcu ani zamietnutú fotku nevidí nikto okrem autora a adminov.
- **Body.** Pripísanie zdieľa transakciu so zmenou stavu a `updateMany` matchuje
  len kým je záznam `PENDING`, takže dvaja admini naraz nepripíšu body dvakrát.
- **Jeden pokus na výzvu** — unikátny index `(user_id, quest_id)`.
- **Pravidlá.** Bez súhlasu sa nedá odoslať dôkaz; kontroluje to server, nielen UI.
- **Rate limity** v Postgrese (in-memory limiter sa v serverless obíde):
  6 odoslaní/hod, 20 komentárov/10 min, 10 pokusov o prihlásenie/15 min.
- Sessions sú odvolateľné DB záznamy za podpísanou httpOnly cookie, heslá bcrypt (12).

## Jazyky

Slovenčina je primárna a **predvolená pre každého** — Accept-Language zámerne
nesledujeme, aby sa slovenská appka neotvorila po anglicky. Angličtinu zapne až
prepínač (SK/EN v hlavičke, v profile a na landingu), ktorý si voľbu pamätá
v cookie. `en.ts` je typovaný proti `sk.ts`, takže chýbajúci preklad je chyba
pri kompilácii, nie prázdny text v UI.

## Fotky

Fotky sa zmenšujú v prehliadači (1280 px, JPEG) a ukladajú ako data URL v stĺpci
`submissions.photo`, limit 1,5 MB. Funguje to bez externej služby, ale **pred
ostrým spustením to presuň do object storage** (S3/R2/Vercel Blob) a nechaj
v databáze len URL.

## Čo ešte chýba

- Object storage pre fotky (viď vyššie).
- E-maily — potvrdenie účtu, reset hesla, notifikácia o schválení.
- Automatické zverejnenie výzvy v pondelok o 8:00 (teraz sa dátum zadáva ručne;
  stačí naň cron).
- Tabuľky po pôvodnom projekte (`quests`, `subscriptions`, `user_preferences`,
  `quest_history`, `saved_quests`, `quest_generations`) sú zatiaľ nepoužívané —
  po odsúhlasení sa dajú zahodiť samostatnou migráciou.
