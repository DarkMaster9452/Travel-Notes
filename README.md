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

## Cadence, the database and the leaderboards

The product runs on two clocks — the weekly drops Monday at 06:00, the monthly
on the 1st — and `src/lib/admin/schedule.ts` owns the arithmetic for both. Slot
keys (`2026-W34`, `2026-09`) are derived there and nowhere else, so the
schedule, the featured quests, the review queue and the leaderboards can never
disagree about which week they are in.

**Has this quest ever been the weekly?** `src/lib/quest/cadence.ts` answers it
for a set of quests in one query, and returns the sentence the UI prints
("Ran as the monthly quest in September 2026"). A booking that has not opened
yet is deliberately *not* a run — a quest pencilled into next March has not
been the monthly. Both the admin table at `/admin/quests/all` and the
customer-facing catalogue at `/quests` filter and tag from that one function,
so the badge and the filter can't drift apart.

**Filing proof** works against any published quest in the catalogue, not only
one the generator issued — the history row is written when somebody files, and
costs no quota, because nothing was issued. Proof filed against a live weekly
or monthly slot is stamped with `submissions.period` / `slot_key` at filing
time, because the answer expires: the same question asked next Tuesday would
say no. That stamp does two things — it puts the submission at the front of the
review deck, ahead of the plan ranking, and it carries the featured bonus onto
the board.

**Leaderboards** (`src/lib/leaderboard.ts`) score every *approved* submission
done inside a slot's window: grade points, a point a kilometre, a point per
hundred metres of ascent, plus the featured bonus; an honest retreat scores
half. A board is derived while its slot is open and **sealed** into
`leaderboard_awards` once it closes — the top three, score and all. Sealing is
what makes a podium survive a verdict reversed three weeks later, and it is
idempotent, so the first person to open a closed board is what hands out its
medals. There is no cron.

The six podium stickers are distinct designs: a weekly gold is not a monthly
gold. Cadence sets the motif (a medal on a ribbon, a summit under a pennant),
and the place is counted in dots — a numeral at that size is a smudge. The
metals are three of the sheet's own ten inks (`gold`, `stone`, `copper`)
rather than a palette of their own, so a medal is coloured by exactly the
mechanism every other sticker is.

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
- **Severity is weight, not a third hue.** The panel's notices need four levels
  and the product has two colours, so `critical` is filled stamp ink, `warning`
  is the same ink outlined, `info` is green and `clear` is paper. Each also
  carries its own icon and its own word, so none of it is encoded by colour
  alone.

The mark is drawn twice on purpose. `LogoMark` is the outlined version used in
the chrome; `src/app/icon.svg` is the same mountain as a silhouette, because at
16px the outline's 1.7px strokes fall below a device pixel. That icon backs the
favicon, the Apple touch icon and the web manifest, so the tab, the home screen
and an installed window all show the same thing.

## Architecture

```
src/
  app/
    (auth)/           login, signup, auth actions
    (app)/            everything behind authentication
      dashboard/ history/ profile/ upgrade/ submissions/ people/ rules/
      weekly/ monthly/ leaderboard/ achievements/ quests/ quests/[id]/
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

## Admin notices

The panel tells an admin what is wrong before they go looking. Every notice is a
**live condition** derived on each request in `src/lib/admin/notifications.ts` —
never a stored message — so it cannot go stale, cannot describe something that
was already fixed, and needs no background job to clean up. Book the empty week
and the notice is gone on the next load.

What it watches: the weekly and monthly slots that are live now and the ones
opening within the horizon, the size *and the age* of the review queue, how many
published quests there are to draw from, unpublished drafts, and subscriptions
Stripe could not charge. The thresholds are policy rather than logic and live
together in one `THRESHOLDS` object at the top of that module.

They surface in two places, from one list: the bell in the panel chrome, and a
"Needs attention" block above the figures on the overview. Which of them an
admin has already seen is kept in `localStorage` — "seen" is a property of a
person at a screen, not of the account, and it should never cost a write to the
database.

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
- **Stripe** — webhook signatures verified against the raw body before parsing,
  by `webhooks.constructEventAsync`, which will not return an event it could
  not authenticate; its validator also rejects a stale timestamp, so a
  captured body cannot be replayed. Subscription state is only ever written
  from data fetched *from* Stripe. The embedded checkout hands the browser a
  session id and nothing else, and that id is only ever used to *ask Stripe*
  what happened — checked against the account presenting it before it counts.
- **Input** — every mutation validates through Zod before touching the database;
  `?next=` redirects are restricted to relative paths.

---

## Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon pooled connection |
| `DIRECT_URL` | yes | Same host without `-pooler`. Migrations run over it: Neon's pooler multiplexes connections, which the schema engine's advisory locks don't tolerate |
| `AUTH_SECRET` | yes | ≥ 32 chars |
| `NEXT_PUBLIC_APP_URL` | yes | Absolute links in email and the portal return |
| `STRIPE_SECRET_KEY` | no | Server key. Without it, checkout is disabled and the paywall degrades gracefully instead of erroring |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | no | Publishable key Stripe.js is loaded with. Required as well as the secret key — the embedded checkout is mounted in the browser, so a secret key alone renders a buy button that cannot open anything |
| `STRIPE_WEBHOOK_SECRET` | no | Required for the webhook to accept anything |
| `STRIPE_PRICE_ID_EXPLORER_MONTHLY` / `_YEARLY` | no | Explorer plan prices |
| `STRIPE_PRICE_ID_ULTRA_MONTHLY` / `_YEARLY` | no | Ultra plan prices. Without them Ultra is not offered |
| `BLOB_READ_WRITE_TOKEN` | no | Vercel Blob, for proof photographs. Without it the upload route says so instead of failing silently |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | no | Connected apps. Without them the Strava row reads "not configured" |
| `RESEND_API_KEY` | no | Transactional email. Without it messages are logged rather than sent |
| `EMAIL_FROM` | no | The From line. Defaults to `Summit Quest <quests@summitquest.app>` |
| `CRON_SECRET` | no | Bearer token the scheduled routes require. **Empty refuses every call** — a job anybody can trigger is worse than one that never runs |

Pricing, plan features, the free allowance and rate limits all live in
`src/lib/config.ts` — nothing is hardcoded in a component.

### Prisma 7 notes

Connection URLs live in `prisma.config.ts`, not `schema.prisma`, and the CLI no
longer loads `.env` implicitly — the config imports `dotenv/config` to do it.
The client connects through the **node-postgres driver adapter**, which is the
portable choice: the same code talks to Neon's pooled endpoint and to a plain
local Postgres. Swap `@prisma/adapter-pg` for `@prisma/adapter-neon` if you move
to an edge runtime.

### Connected apps and email

Strava is read-only and only ever reads an activity somebody has pasted a link
to: the OAuth scope is `read,activity:read`, the token is refreshed a minute
before it dies, and disconnecting deletes the row rather than nulling five
columns. Point the app's callback at `/api/strava/callback`.

Photographs are re-encoded server-side on upload (`src/lib/uploads.ts`) rather
than merely checked. Re-encoding is what actually strips EXIF — a header check
does not — and a photograph filed as proof of where somebody was should not
carry the coordinates of where they live.

Four emails go out, and every one of them is about the recipient's own quest:
the drop, the verdict, the reviewer's note on a decline, and a board sealing
with their name on it. Each is gated on that account's notification settings
inside `send`, not at the call site. Two of them are scheduled:

| Route | Schedule | What it does |
| --- | --- | --- |
| `/api/cron/quest-drop` | `0 6 * * *` | Announces a booked slot, on the mornings a slot opens |
| `/api/cron/seal-boards` | `30 6 * * *` | Reads closed boards, which seals them, and writes to the podium |
| `/api/cron/envelopes` | `0 7 * * *` | On the 2nd, decides who gets a posted envelope and who gets the month's card by email instead. Returns the despatch list; the rule itself lives in `lib/envelope` |

Both refuse anything without a matching `CRON_SECRET` bearer token, compared in
constant time.

### Roles

Five, and additive: `USER` is a member; `READER` opens the review deck and
decides proof and sees nothing about money; `WRITER` adds quests and slots;
`ADMIN` adds users, billing and the database browser; `OWNER` adds the desk
itself — invitations, revocations, panel access.

Which tabs each rank may open lives in `src/lib/admin/access.ts`, read by three
things that must agree: the rail (`tabsFor`), the per-screen guard
(`requireRank`), and the matrix drawn on Panel access. One table, so the page
cannot promise what the guard refuses.

People join the desk by **invitation**, from Staff settings. An invite names an
email and a role and is claimed by that email signing in and opening the link,
so a leaked token is useless to anybody who cannot receive mail at the address
it was written to. An admin can invite readers and writers; an owner can also
invite an admin.

Nothing in the panel mints an **owner**. That one happens at a database prompt:

```bash
npm run staff:grant -- somebody@example.com OWNER
```

Revoking is a thing you want to do fast from a phone at two in the morning;
granting an owner should require somebody who already has the database, because
a panel that can mint owners is one compromised session away from making an
attacker permanent. Every write from the panel is stamped into `AdminAudit`
(the command-line grant included, attributed to nobody, which is what it was);
reads are not logged.

### Stripe setup

1. Create a product with a recurring price for the Explorer plan (Dashboard →
   Product catalogue) and put the **price** id (`price_…`, not the product id)
   in `STRIPE_PRICE_ID_EXPLORER_MONTHLY`. Do the same for a yearly Explorer
   price and, optionally, an Ultra product — without an Ultra price, Ultra is
   simply not offered.
2. Take a secret key into `STRIPE_SECRET_KEY` and a publishable key into
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, both from Developers → API keys.
   Both are needed: the server reads subscriptions back and creates checkout
   sessions, and Stripe.js mounts the embedded checkout in the browser. Test
   keys (`sk_test_…`/`pk_test_…`) and live keys (`sk_live_…`/`pk_live_…`) are
   just different keys — there is no separate environment flag to keep in
   step with them.
3. Point a webhook at `/api/stripe/webhook` (Developers → Webhooks) subscribing
   to `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted` and `invoice.payment_failed`, and put its
   signing secret in `STRIPE_WEBHOOK_SECRET`. For local development,
   `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints a
   temporary one instead.

The checkout session is created server-side either way — the server decides
*which* price this account may buy — but it is rendered as **Embedded
Checkout**, a Stripe-hosted iframe mounted on this page rather than a redirect
to Stripe's own domain, so nobody leaves the product to buy it. Nothing is
granted until Stripe says money moved — through the webhook, or through the
session read that runs the moment the embed reports completion so the page
does not tell a paying member they are still free.

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
