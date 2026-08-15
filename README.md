# Summit Quest

> "My life is boring and I want to do a side quest, but I don't know what to do."

A production-shaped web app that generates personalised, randomised hiking and
adventure quests — and never gives you the same one twice.

Next.js 16 · TypeScript · Tailwind v4 · Prisma 7 · Postgres (Neon) · Stripe

---

## Getting started

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:migrate          # apply migrations
npm run db:seed             # 20 showcase quests + a demo account
npm run dev
```

`AUTH_SECRET` must be at least 32 characters — `openssl rand -hex 32`.

The seed creates `demo@sidequest.app` / `SideQuest!2026` with six quests of
history. Set `SEED_DEMO_USER=false` to seed showcase content only, and never
run the demo seed against production.

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run quests:preview` | Prints 20 generated quests to the terminal — the fastest way to see the engine work |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` |

---

## How the quest generator works

The generator is the product, so it lives on its own in `src/lib/quest/` and is
a **pure function**: same preferences + same history + same seed produces the
same quest, with no database or network involved. That is what makes the
interesting question — *"is this genuinely different from the last five?"* —
testable.

```
preferences
   ↓ drawParameters()      randomised inside the user's limits, plus a wildcard
   ↓ scoreLocations()      preference fit − history penalties + novelty bonuses
   ↓ weighted pick         top candidates, weighted by score
   ↓ deriveRoute()         distance, ascent, duration (Naismith), difficulty
   ↓ buildTitle/Objective  grammars keyed to the chosen feature
   ↓ signature check       collision → skip to the next candidate
unique quest
```

| File | Responsibility |
| --- | --- |
| `locations.ts` | 37 real places described as *bands* (distance, ascent, difficulty) rather than fixed routes |
| `taxonomy.ts` | The shared tag vocabulary: terrain, features, activities |
| `random.ts` | Seeded RNG (mulberry32) + stable hashing |
| `language.ts` | Title / objective / bonus / description grammars |
| `engine.ts` | The pipeline above |
| `service.ts` | Database orchestration, entitlement, persistence |

### Anti-repetition

Every generation reads the user's last 40 quests and scores each candidate
location against them, with recency weighting (the last quest counts far more
than the tenth):

- a location the user has seen: heavy penalty; the *immediately* previous one, heavier still
- regions and features seen recently: penalised proportionally
- regions and features never seen: bonus
- the same difficulty or distance bucket as the last two: small penalty

The chosen quest then gets a **signature** — `location · difficulty · distance
bucket · primary feature · timing`. If that signature is already in the user's
history the candidate is skipped and the next one is tried. Titles, objective
templates and bonus templates are likewise drawn from the pool the user hasn't
been given yet.

Because a location offers a *range*, the same valley can legitimately return as
a different quest — a two-hour evening loop is not the same adventure as a
full-day ridge traverse — but never as the same combination.

---

## Design system

`index.html` (the finished landing page) is the source of truth. Nothing in the
product invents a colour, a radius or a type size of its own.

- **Tokens** live in the `@theme` block of `src/app/globals.css` — the palette,
  radii, the three faces and the two shadows, lifted from the landing page's
  `:root`. This is a Tailwind v4 project, so tokens are declared in CSS rather
  than in a `tailwind.config.ts`.
- **Component classes** live in `src/styles/field-guide.css`, a near-verbatim
  port of the landing page's stylesheet so the two can be diffed. It is imported
  `layer(components)`, which matters: unlayered CSS beats every Tailwind
  utility, so without the layer a component class would silently win over any
  utility applied next to it.
- **Components** live in `src/components/field/` — `QuestCard`, `Tag`, `Stat`,
  `Panel`, `Pill`, `Avatar`, `Sticker`, `EmptyState`, `Modal`, `Toast`.
  Marketing, app interior and admin all build from these.

Rules carried over from the landing page and enforced in the components rather
than left to call sites:

- Green is the structure; **orange is stamp ink only** — seals, bonus
  challenges, "Most taken", hard/brutal difficulty. `DifficultyTag` decides
  which grades earn it, so no page decides on its own.
- Every quest renders as an **issued document**: quest number, dashed rules,
  difficulty tag, seal watermark, expiry. That is `QuestCard`, everywhere.
- Uppercase mono for all metadata; serif for anything handed to you.
- Paper grain and contour lines are marketing surfaces only. The app interior
  drops both and keeps the palette.

## Architecture

```
src/
  app/
    (auth)/           login, signup, auth actions
    (app)/            everything behind authentication
      dashboard/ history/ saved/ profile/ upgrade/ quests/[id]/
    onboarding/       seven-step preference flow
    api/
      quests/generate stripe/{checkout,portal,webhook}
  components/
    field/            the shared design-system library (see below)
    landing/          the landing page, ported from index.html
    quest/ app/ onboarding/ ui/
  styles/
    field-guide.css   component classes, ported from index.html
  lib/
    auth/ quest/ db, entitlements, billing, stripe, rate-limit, validation, geo, images
prisma/
  schema.prisma, migrations/, seed.ts, seed-data.ts
```

Server components do the data fetching; client components exist only where
there is interaction (generation overlay, onboarding, toggles, forms). Prisma
records are mapped to a `QuestSummary` projection before crossing to the
client, so no database row is shipped to the browser.

---

## Security

Everything that matters is decided on the server, from database state:

- **Sessions** — signed JWT in an httpOnly, SameSite=Lax cookie, pointing at a
  `sessions` row so logout revokes server-side. Passwords are bcrypt (cost 12),
  and login spends comparable time on unknown accounts so timing doesn't leak
  whether an email is registered.
- **Route protection** — `proxy.ts` rejects requests without a valid token, and
  every protected page and action independently re-checks the session against
  the database. The proxy is a fast path, not the authority.
- **Entitlement** — `getEntitlement()` is the single source of truth for "may
  this user generate?". The client never decides. The quota increment shares a
  transaction with the quest insert, so a crash can't hand out a free quest
  without recording it.
- **Ownership** — quest mutations require a `quest_history` row linking user and
  quest; another user's quest id changes nothing and renders as not-found.
- **Rate limiting** — Postgres-backed fixed windows (an in-memory limiter is
  bypassable across serverless instances): 12 generations/hour, 10 auth
  attempts/15 min, plus a 4-second lock that collapses double submissions.
- **Stripe** — webhook signatures verified against the raw body before parsing;
  subscription state is only ever written from data fetched *from* Stripe.
- **Input** — every mutation validates through Zod before touching the database;
  `?next=` redirects are restricted to relative paths.

---

## Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon pooled connection |
| `DIRECT_URL` | yes | Same host without `-pooler`. Migrations run over it: Neon's pooler multiplexes connections, which the schema engine's advisory locks don't tolerate |
| `AUTH_SECRET` | yes | ≥ 32 chars |
| `NEXT_PUBLIC_APP_URL` | yes | Used for Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | no | Without it, checkout is disabled and the paywall degrades gracefully instead of erroring |
| `STRIPE_WEBHOOK_SECRET` | no | Required for the webhook to accept anything |
| `STRIPE_PRICE_ID_EXPLORER_MONTHLY` / `_YEARLY` | no | Explorer plan prices |

Pricing, plan features, the free allowance and rate limits all live in
`src/lib/config.ts` — nothing is hardcoded in a component.

### Prisma 7 notes

Connection URLs live in `prisma.config.ts`, not `schema.prisma`, and the CLI no
longer loads `.env` implicitly — the config imports `dotenv/config` to do it.
The client connects through the **node-postgres driver adapter**, which is the
portable choice: the same code talks to Neon's pooled endpoint and to a plain
local Postgres. Swap `@prisma/adapter-pg` for `@prisma/adapter-neon` if you move
to an edge runtime.

### Stripe setup

1. Create a recurring price for the Explorer plan and put its id in
   `STRIPE_PRICE_ID_EXPLORER_MONTHLY`.
2. Point a webhook at `/api/stripe/webhook` subscribing to
   `checkout.session.completed`, `customer.subscription.*`, `invoice.paid` and
   `invoice.payment_failed`.
3. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

---

## Imagery

All photography is referenced through `src/lib/images.ts` — one file to swap for
your own asset host. Each image carries a palette that renders a generated
ridgeline *underneath* the photo, so a slow network or a dead URL degrades into
something designed rather than a grey box. The Unsplash ids are placeholders;
replace them with licensed assets before launch.

---

## Known gaps before a real launch

Deliberate scope edges, not oversights:

- **Route data is schematic.** Waypoints are generated around the trailhead for
  the preview sketch; they are not surveyed GPX tracks. Wire a real routing
  provider (or curate GPX per location) before anyone navigates by this.
- **No live weather.** The conditions panel explains the timing and links out to
  a forecast rather than inventing data.
- **Geocoding is a local gazetteer** (~55 towns in Slovakia and neighbours). It
  covers the launch region; anywhere else falls back to no travel estimate.
- **No email** — verification, password reset and receipts are unimplemented.
- **The location catalogue is hand-curated** and Slovakia-centred. Coordinates
  are approximate trailhead positions.
